globalThis.WaypointVariantPicker = (() => {
  let closeCurrent = null;
  function handles(annotation) {
    return annotation?.variant_request?.status === 'unresolved';
  }

  function locksPresentation(annotation) {
    return annotation?.variant_request?.status === 'finalized';
  }

  function buildAnnotationUpdates(annotation, comment, pendingChanges, css) {
    const updates = { comment, updated_at: new Date().toISOString() };
    if (!locksPresentation(annotation)) {
      updates.pending_changes = pendingChanges;
      updates.css = css;
    }
    return updates;
  }

  function escapeHTML(value) {
    const node = document.createElement('div');
    node.textContent = String(value);
    return node.innerHTML;
  }

  function getPosition(target, panel, viewport) {
    const inset = 12;
    const gap = 16;
    const clamp = (value, max) => Math.max(inset, Math.min(value, max));
    const fitsRight = target.right + gap + panel.width <= viewport.width - inset;
    const fitsLeft = target.left - gap - panel.width >= inset;
    const preferredLeft = fitsRight ? target.right + gap : target.left - gap - panel.width;
    const left = fitsRight || fitsLeft ? preferredLeft : target.left;
    const top = fitsRight || fitsLeft ? target.top : target.bottom + gap;
    return {
      left: clamp(left, viewport.width - panel.width - inset),
      top: clamp(top, viewport.height - panel.height - inset),
    };
  }

  function show(annotation, targetElement, view = {}) {
    const root = WaypointShadowHost.getRoot();
    if (!root || !handles(annotation)) return false;

    closeCurrent?.();
    root.querySelector('.waypoint-variant-picker-anchor')?.remove();
    const request = annotation.variant_request;
    const activeIndex = request.variants.findIndex(variant => variant.key === request.active_variant_key);
    let expanded = Boolean(view.expanded);
    let draggedPosition = view.position || null;
    let closed = false;
    const anchor = document.createElement('div');
    anchor.className = 'waypoint-popover-anchor waypoint-variant-picker-anchor';
    anchor.innerHTML = `
      <section class="waypoint-popover waypoint-variant-picker" aria-label="Variants">
        <header class="waypoint-variant-header">
          <div><h2>Variants</h2><p>Preview an option on the page.</p></div>
          <button class="waypoint-btn-icon waypoint-variant-close" type="button" aria-label="Close variants">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>
        <div class="waypoint-variant-compact">
          <div class="waypoint-variant-wheel">
            <button type="button" class="waypoint-btn-icon waypoint-variant-prev" aria-label="Previous variant"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>
            <div class="waypoint-variant-name" aria-live="polite"><span>${escapeHTML(request.variants[activeIndex].name)}</span></div>
            <button type="button" class="waypoint-btn-icon waypoint-variant-next" aria-label="Next variant"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>
          </div>
          <div class="waypoint-variant-counter"><span>${activeIndex + 1} / ${request.variants.length}</span><button type="button" class="waypoint-btn waypoint-btn-secondary waypoint-variant-view-all" aria-expanded="false">View all</button></div>
        </div>
        <div class="waypoint-variant-expanded" hidden>
        <div class="waypoint-variant-list-heading"><span>All variants</span><button type="button" class="waypoint-btn waypoint-btn-secondary waypoint-variant-back">Back to wheel</button></div>
        <div class="waypoint-variant-list">
          ${request.variants.map(variant => `
            <div class="waypoint-variant-row" data-variant-key="${escapeHTML(variant.key)}">
              <button class="waypoint-btn ${variant.state === 'active' ? 'waypoint-btn-primary' : 'waypoint-btn-secondary'} waypoint-variant-activate" type="button" aria-pressed="${variant.state === 'active'}">
                <span>${escapeHTML(variant.name)}</span>${variant.state === 'active' ? '<span class="waypoint-variant-active-label">Active</span>' : ''}
              </button>
              <button class="waypoint-btn-icon waypoint-variant-discard" type="button" title="Discard ${escapeHTML(variant.name)}" aria-label="Discard ${escapeHTML(variant.name)}" ${variant.state === 'active' || request.variants.length <= 2 ? 'disabled' : ''}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
            </div>
          `).join('')}
        </div>
        </div>
        <footer class="waypoint-variant-footer">
          <p class="waypoint-variant-status" role="status" aria-live="polite">Keep the selected option to finish comparing.</p>
          <div class="waypoint-variant-actions">
            <button class="waypoint-btn waypoint-btn-secondary waypoint-variant-cancel" type="button">Cancel set</button>
            <button class="waypoint-btn waypoint-btn-primary waypoint-variant-finalize" type="button">Keep selected</button>
          </div>
        </footer>
      </section>`;
    root.appendChild(anchor);

    const panel = anchor.querySelector('.waypoint-variant-picker');
    const previousFocus = root.activeElement || document.activeElement;
    const position = () => {
      const target = targetElement?.getBoundingClientRect?.() || { left: 12, right: 12, top: 12, bottom: 12 };
      const bounds = panel.getBoundingClientRect();
      const point = draggedPosition ? {
        left: Math.max(12, Math.min(draggedPosition.left, window.innerWidth - bounds.width - 12)),
        top: Math.max(12, Math.min(draggedPosition.top, window.innerHeight - bounds.height - 12)),
      } : getPosition(target, bounds, { width: window.innerWidth, height: window.innerHeight });
      panel.style.left = `${point.left}px`;
      panel.style.top = `${point.top}px`;
    };
    const onKeyDown = event => {
      if (['ArrowLeft', 'ArrowRight'].includes(event.key) && !expanded && event.composedPath().includes(panel)) {
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
        return;
      }
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (expanded) setExpanded(false);
      else close();
    };
    const close = () => {
      closed = true;
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      anchor.remove();
      closeCurrent = null;
      previousFocus?.focus?.({ preventScroll: true });
    };
    closeCurrent = close;
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    document.addEventListener('keydown', onKeyDown, true);
    const setExpanded = value => {
      expanded = value;
      anchor.querySelector('.waypoint-variant-compact').hidden = expanded;
      anchor.querySelector('.waypoint-variant-expanded').hidden = !expanded;
      anchor.querySelector('.waypoint-variant-view-all').setAttribute('aria-expanded', String(expanded));
      position();
      const focusSelector = expanded ? '.waypoint-variant-activate[aria-pressed="true"]' : '.waypoint-variant-view-all';
      anchor.querySelector(focusSelector)?.focus?.({ preventScroll: true });
    };
    setExpanded(expanded);
    anchor.querySelector('.waypoint-variant-view-all').addEventListener('click', () => setExpanded(true));
    anchor.querySelector('.waypoint-variant-back').addEventListener('click', () => setExpanded(false));
    const header = anchor.querySelector('.waypoint-variant-header');
    header.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button')) return;
      const bounds = panel.getBoundingClientRect();
      const offset = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      header.setPointerCapture(event.pointerId);
      header.onpointermove = move => {
        draggedPosition = { left: move.clientX - offset.x, top: move.clientY - offset.y };
        position();
      };
      const endDrag = () => { header.onpointermove = null; };
      header.onpointerup = endDrag;
      header.onpointercancel = endDrag;
      header.onlostpointercapture = endDrag;
    });
    const wheelLabel = anchor.querySelector('.waypoint-variant-name span');
    if (view.direction && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      wheelLabel.animate?.([{ transform: `rotateX(${-view.direction * 85}deg)`, opacity: 0.2 }, { transform: 'rotateX(0deg)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    let busy = false;
    const status = anchor.querySelector('.waypoint-variant-status');
    const showError = error => {
      status.textContent = error.message;
      status.setAttribute('role', 'alert');
    };
    const applyOperation = async operation => {
      if (busy) return null;
      busy = true;
      panel.setAttribute('aria-busy', 'true');
      const buttons = [...anchor.querySelectorAll('button')];
      const disabled = buttons.map(button => button.disabled);
      buttons.forEach(button => { button.disabled = true; });
      try {
        return await operation();
      } catch (error) {
        showError(error);
        return null;
      } finally {
        busy = false;
        panel.removeAttribute('aria-busy');
        buttons.forEach((button, index) => { button.disabled = disabled[index]; });
        position();
      }
    };

    anchor.querySelector('.waypoint-variant-close').addEventListener('click', close);
    anchor.querySelector('.waypoint-variant-cancel').addEventListener('click', async () => {
      const updated = await applyOperation(() => WaypointAPI.cancelVariantRequest(annotation.id));
      if (!updated) return;
      close();
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
    });
    const activate = async (key, direction = 0) => {
      if (key === request.active_variant_key) { setExpanded(false); return; }
      const updated = await applyOperation(() => WaypointAPI.activateVariant(annotation.id, key));
      if (!updated) return;
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      if (closed) return;
      close();
      show(updated, targetElement, { position: draggedPosition, direction });
    };
    const step = direction => activate(request.variants[(activeIndex + direction + request.variants.length) % request.variants.length].key, direction);
    anchor.querySelector('.waypoint-variant-prev').addEventListener('click', () => step(-1));
    anchor.querySelector('.waypoint-variant-next').addEventListener('click', () => step(1));
    anchor.querySelectorAll('.waypoint-variant-activate').forEach(button => button.addEventListener('click', () => activate(button.closest('[data-variant-key]').dataset.variantKey)));
    anchor.querySelectorAll('.waypoint-variant-discard').forEach(button => button.addEventListener('click', async () => {
      const key = button.closest('[data-variant-key]').dataset.variantKey;
      const updated = await applyOperation(() => WaypointAPI.discardVariant(annotation.id, key));
      if (!updated) return;
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      if (closed) return;
      close();
      show(updated, targetElement, { position: draggedPosition, expanded: true });
    }));
    anchor.querySelector('.waypoint-variant-finalize').addEventListener('click', async () => {
      const updated = await applyOperation(() => WaypointAPI.finalizeVariant(annotation.id, request.active_variant_key));
      if (!updated) return;
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      close();
    });
    return true;
  }

  return { buildAnnotationUpdates, getPosition, handles, locksPresentation, show };
})();
