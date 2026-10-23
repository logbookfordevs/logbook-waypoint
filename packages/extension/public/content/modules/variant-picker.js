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

  const DOCK_INSET = 16;
  const DOCK_CLEARANCE = 12;
  const MORE_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.75"/><circle cx="12" cy="12" r="1.75"/><circle cx="19" cy="12" r="1.75"/></svg>';

  function getPlacement(target, dock, viewport) {
    if (!target) return 'bottom';
    const dockLeft = (viewport.width - dock.width) / 2;
    const overlapsHorizontally = target.left < dockLeft + dock.width && target.right > dockLeft;
    const bottomZoneTop = viewport.height - DOCK_INSET - dock.height - DOCK_CLEARANCE;
    const coversBottomZone = overlapsHorizontally && target.bottom > bottomZoneTop;
    const coversTopZone = overlapsHorizontally && target.top < DOCK_INSET + dock.height + DOCK_CLEARANCE;
    return coversBottomZone && !coversTopZone ? 'top' : 'bottom';
  }

  function isTypingTarget(element) {
    return Boolean(element?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element?.tagName || ''));
  }

  function show(annotation, targetElement, view = {}) {
    const root = WaypointShadowHost.getRoot();
    if (!root || !handles(annotation)) return false;

    closeCurrent?.();
    root.querySelector('.waypoint-variant-dock')?.remove();
    const request = annotation.variant_request;
    const variants = request.variants;
    const activeIndex = variants.findIndex(variant => variant.key === request.active_variant_key);
    const active = variants[activeIndex];
    const canDiscard = variants.length > 2;
    const discardItems = canDiscard
      ? variants
        .filter(variant => variant.state !== 'active')
        .map(variant => `<button class="waypoint-variant-menu-item waypoint-variant-discard" type="button" role="menuitem" data-variant-key="${escapeHTML(variant.key)}">Discard ${escapeHTML(variant.name)}</button>`)
        .join('')
      : '';
    const tabs = variants
      .map((variant, index) => `<button class="waypoint-variant-tab" type="button" data-variant-key="${escapeHTML(variant.key)}" aria-pressed="${index === activeIndex}" aria-keyshortcuts="${index + 1}">${escapeHTML(variant.name)}</button>`)
      .join('');
    let closed = false;
    let menuOpen = false;
    const dock = document.createElement('section');
    dock.className = 'waypoint-variant-dock';
    dock.setAttribute('aria-label', 'Variants');
    dock.innerHTML = `
      <p class="waypoint-variant-summary" ${active.summary ? '' : 'hidden'}>${escapeHTML(active.summary || '')}</p>
      <p class="waypoint-variant-status" role="status" aria-live="polite" hidden></p>
      <div class="waypoint-variant-pill">
        <div class="waypoint-variant-tabs" role="group" aria-label="Variant to preview">
          <span class="waypoint-variant-highlight" aria-hidden="true"></span>
          ${tabs}
        </div>
        <span class="waypoint-variant-divider" aria-hidden="true"></span>
        <button class="waypoint-variant-keep" type="button">Keep<span class="waypoint-variant-keep-name"> ${escapeHTML(active.name)}</span></button>
        <button class="waypoint-variant-more" type="button" aria-label="More variant actions" aria-haspopup="menu" aria-expanded="false">${MORE_ICON}</button>
        <div class="waypoint-variant-menu" role="menu" hidden>
          ${discardItems}
          <span class="waypoint-variant-menu-divider" aria-hidden="true"></span>
          <button class="waypoint-variant-menu-item waypoint-variant-cancel" type="button" role="menuitem">Cancel set</button>
          <button class="waypoint-variant-menu-item waypoint-variant-close" type="button" role="menuitem">Hide picker</button>
        </div>
      </div>`;
    root.appendChild(dock);

    const previousFocus = view.returnFocus || root.activeElement || document.activeElement;
    const tabButtons = [...dock.querySelectorAll('.waypoint-variant-tab')];
    const highlight = dock.querySelector('.waypoint-variant-highlight');
    const menu = dock.querySelector('.waypoint-variant-menu');
    const moreButton = dock.querySelector('.waypoint-variant-more');
    const status = dock.querySelector('.waypoint-variant-status');

    const moveHighlight = index => {
      const tab = tabButtons[index];
      if (!tab) return;
      highlight.style.width = `${tab.offsetWidth}px`;
      highlight.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    const place = () => {
      const target = targetElement?.getBoundingClientRect?.() || null;
      const bounds = dock.getBoundingClientRect();
      dock.dataset.position = getPlacement(target, bounds, { width: window.innerWidth, height: window.innerHeight });
    };
    const setMenuOpen = value => {
      menuOpen = value;
      menu.hidden = !value;
      moreButton.setAttribute('aria-expanded', String(value));
      if (value) menu.querySelector('.waypoint-variant-menu-item:not(:disabled)')?.focus?.({ preventScroll: true });
    };
    const onResize = () => {
      moveHighlight(activeIndex);
      place();
    };
    const onKeyDown = event => {
      const insideDock = event.composedPath?.().includes(dock) ?? dock.contains(event.target);
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (menuOpen) {
          setMenuOpen(false);
          moreButton.focus?.({ preventScroll: true });
        } else close();
        return;
      }
      if (!insideDock || menuOpen || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      const number = Number.parseInt(event.key, 10);
      if (number >= 1 && number <= variants.length) {
        event.preventDefault();
        activateIndex(number - 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    const onPointerDown = event => {
      const path = event.composedPath?.() ?? [event.target];
      const insideMenuControls = path.includes(menu) || path.includes(moreButton) || menu.contains(event.target) || moreButton.contains(event.target);
      if (menuOpen && !insideMenuControls) setMenuOpen(false);
    };
    const close = ({ restoreFocus = true } = {}) => {
      closed = true;
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', place, true);
      dock.remove();
      closeCurrent = null;
      if (restoreFocus) previousFocus?.focus?.({ preventScroll: true });
    };
    closeCurrent = close;

    const fromIndex = variants.findIndex(variant => variant.key === view.fromKey);
    moveHighlight(fromIndex >= 0 ? fromIndex : activeIndex);
    place();
    window.requestAnimationFrame?.(() => {
      dock.dataset.ready = '';
      moveHighlight(activeIndex);
    });
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', place, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    tabButtons[activeIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    if (view.focus !== false) tabButtons[activeIndex]?.focus?.({ preventScroll: true });

    let busy = false;
    const showError = error => {
      status.textContent = error.message;
      status.setAttribute('role', 'alert');
      status.hidden = false;
    };
    const applyOperation = async operation => {
      if (busy) return null;
      busy = true;
      dock.setAttribute('aria-busy', 'true');
      const buttons = [...dock.querySelectorAll('button')];
      const disabled = buttons.map(button => button.disabled);
      buttons.forEach(button => { button.disabled = true; });
      try {
        return await operation();
      } catch (error) {
        showError(error);
        return null;
      } finally {
        busy = false;
        dock.removeAttribute('aria-busy');
        buttons.forEach((button, index) => { button.disabled = disabled[index]; });
      }
    };
    const reopen = (updated, nextView = {}) => {
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      if (closed) return;
      close({ restoreFocus: false });
      show(updated, targetElement, { ...nextView, returnFocus: previousFocus });
    };
    const activateIndex = async index => {
      const key = variants[index]?.key;
      if (!key || key === request.active_variant_key) return;
      const updated = await applyOperation(() => WaypointAPI.activateVariant(annotation.id, key));
      if (updated) reopen(updated, { fromKey: request.active_variant_key });
    };
    const step = direction => activateIndex((activeIndex + direction + variants.length) % variants.length);

    tabButtons.forEach((tab, index) => tab.addEventListener('click', () => activateIndex(index)));
    moreButton.addEventListener('click', () => setMenuOpen(!menuOpen));
    dock.querySelector('.waypoint-variant-close').addEventListener('click', () => close());
    dock.querySelector('.waypoint-variant-cancel').addEventListener('click', async () => {
      setMenuOpen(false);
      const updated = await applyOperation(() => WaypointAPI.cancelVariantRequest(annotation.id));
      if (!updated) return;
      close();
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
    });
    dock.querySelectorAll('.waypoint-variant-discard').forEach(button => button.addEventListener('click', async () => {
      setMenuOpen(false);
      const updated = await applyOperation(() => WaypointAPI.discardVariant(annotation.id, button.dataset.variantKey));
      if (updated) reopen(updated);
    }));
    dock.querySelector('.waypoint-variant-keep').addEventListener('click', async () => {
      const updated = await applyOperation(() => WaypointAPI.finalizeVariant(annotation.id, request.active_variant_key));
      if (!updated) return;
      WaypointEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      close();
    });
    return true;
  }

  return { buildAnnotationUpdates, getPlacement, handles, locksPresentation, show };
})();
