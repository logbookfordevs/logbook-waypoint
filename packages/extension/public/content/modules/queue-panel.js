var WaypointQueuePanel = (() => {
  let panel = null;
  let opener = null;

  function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = String(value ?? '');
    return div.innerHTML;
  }

  function statusLabel(status) {
    return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  }

  function attachmentLabels(annotation) {
    const labels = [];
    if (annotation.screenshot || annotation.has_screenshot) labels.push('Screenshot');
    if (annotation.attachments?.length) labels.push(`${annotation.attachments.length} image${annotation.attachments.length === 1 ? '' : 's'}`);
    else if (annotation.has_attachments) labels.push('Images');
    if (annotation.variant_request) {
      const activeKey = annotation.variant_request.active_variant_key;
      const active = annotation.variant_request.variants?.find(variant => variant.key === activeKey);
      labels.push(active ? `Variant: ${active.name}` : `Variants: ${annotation.variant_request.status}`);
    }
    return labels;
  }

  function renderAnnotation(annotation) {
    const details = [statusLabel(annotation.status), annotation.selector || annotation.element || 'Target', ...attachmentLabels(annotation)];
    return `
      <div class="waypoint-queue-row" data-annotation-id="${escapeHTML(annotation.id)}">
        <input class="waypoint-queue-select" type="checkbox" value="${escapeHTML(annotation.id)}" aria-label="Select annotation: ${escapeHTML(annotation.comment || 'Untitled annotation')}">
        <span class="waypoint-queue-copy">
          <span class="waypoint-queue-comment">${escapeHTML(annotation.comment || 'Untitled annotation')}</span>
          <span class="waypoint-queue-meta">${details.map(escapeHTML).join(' · ')}</span>
        </span>
        <span class="waypoint-queue-row-actions">
          <button class="waypoint-queue-open" type="button" data-annotation-id="${escapeHTML(annotation.id)}">Open</button>
          <button class="waypoint-queue-more" type="button" data-annotation-id="${escapeHTML(annotation.id)}" aria-label="More actions for annotation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
          </button>
        </span>
      </div>
    `;
  }

  function routeFor(annotation) {
    try {
      const url = new URL(annotation.url);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return annotation.url || 'Unknown route';
    }
  }

  function groupOtherRoutes(projectAnnotations) {
    const groups = new Map();
    for (const annotation of projectAnnotations) {
      if (annotation.url === window.location.href) continue;
      const route = routeFor(annotation);
      const routeAnnotations = groups.get(route) || [];
      routeAnnotations.push(annotation);
      groups.set(route, routeAnnotations);
    }
    return groups;
  }

  function close(restoreFocus = true) {
    panel?.remove();
    panel = null;
    if (restoreFocus) opener?.focus?.();
    opener = null;
  }

  async function open(anchor, actions = {}) {
    close();
    const [annotations, projectAnnotations] = await Promise.all([
      WaypointAPI.loadAnnotations(),
      WaypointAPI.loadProjectAnnotations(),
    ]);
    const root = WaypointShadowHost.getRoot();
    if (!root) return;
    const otherRoutes = groupOtherRoutes(projectAnnotations);
    const currentRoute = {
      annotations,
      route: window.location.pathname + window.location.search + window.location.hash,
    };
    opener = anchor.querySelector?.('.waypoint-tb-queue') || anchor;

    panel = document.createElement('section');
    panel.className = 'waypoint-queue-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Annotation Queue');
    panel.onkeydown = event => {
      if (event.key === 'Escape') close();
    };
    root.appendChild(panel);
    renderRouteView(annotations, currentRoute.route, otherRoutes, actions, currentRoute);
    position(anchor);
    panel.querySelector('.waypoint-queue-close')?.focus();
  }

  function renderRouteView(annotations, route, otherRoutes, actions, currentRoute) {
    panel.innerHTML = `
      <header class="waypoint-queue-header">
        <div>
          <h2>Queue <span>${annotations.length}</span></h2>
          <p>${escapeHTML(route)}</p>
        </div>
        <div class="waypoint-queue-header-actions">
          ${otherRoutes.size ? `<button class="waypoint-queue-other-routes" type="button">${otherRoutes.size} other route${otherRoutes.size === 1 ? '' : 's'}</button>` : ''}
          <button class="waypoint-queue-close" type="button" aria-label="Close Queue">×</button>
        </div>
      </header>
      <div class="waypoint-queue-list">
        ${annotations.length ? annotations.map(renderAnnotation).join('') : '<p class="waypoint-queue-empty">No annotations on this route.</p>'}
      </div>
      ${annotations.length ? `
        <footer class="waypoint-queue-actions">
          <button class="waypoint-queue-select-all" type="button">Select all</button>
          <button class="waypoint-queue-discard-selected" type="button" disabled>Discard</button>
          <button class="waypoint-queue-copy-selected" type="button" disabled>Copy</button>
        </footer>
      ` : ''}
    `;
    panel.querySelector('.waypoint-queue-close').addEventListener('click', close);
    panel.querySelector('.waypoint-queue-other-routes')?.addEventListener('click', () => renderRouteList(otherRoutes, actions, currentRoute));
    panel.querySelectorAll('.waypoint-queue-open').forEach(button => {
      button.addEventListener('click', () => {
        const annotation = annotations.find(candidate => candidate.id === button.dataset.annotationId);
        if (!annotation) return;
        close(false);
        actions.open?.(annotation);
      });
    });
    panel.querySelectorAll('.waypoint-queue-more').forEach(button => {
      button.addEventListener('click', () => openRowMenu(button, annotations, actions));
    });
    if (annotations.length) wireSelection(annotations, actions);
  }

  function openRowMenu(button, annotations, actions) {
    panel.querySelector('.waypoint-queue-row-menu')?.remove();
    const annotation = annotations.find(candidate => candidate.id === button.dataset.annotationId);
    if (!annotation) return;
    const row = button.closest('.waypoint-queue-row');
    const menu = document.createElement('div');
    menu.className = 'waypoint-queue-row-menu';
    menu.innerHTML = '<button class="waypoint-queue-delete" type="button">Delete permanently</button>';
    row.appendChild(menu);
    menu.querySelector('.waypoint-queue-delete').addEventListener('click', () => {
      menu.innerHTML = `
        <span>Delete this annotation permanently?</span>
        <button class="waypoint-queue-cancel-delete" type="button">Cancel</button>
        <button class="waypoint-queue-confirm-delete" type="button">Delete</button>
      `;
      menu.querySelector('.waypoint-queue-cancel-delete').addEventListener('click', () => menu.remove());
      menu.querySelector('.waypoint-queue-confirm-delete').addEventListener('click', async () => {
        try {
          await actions.delete?.(annotation);
          close();
        } catch (error) {
          showActionError(menu, error, 'Could not delete this annotation.');
        }
      });
    });
  }

  function renderRouteList(otherRoutes, actions, currentRoute) {
    panel.innerHTML = `
      <header class="waypoint-queue-header">
        <div><h2>Other routes <span>${otherRoutes.size}</span></h2><p>Current site</p></div>
        <div class="waypoint-queue-header-actions">
          <button class="waypoint-queue-current-route" type="button">Current route</button>
          <button class="waypoint-queue-close" type="button" aria-label="Close Queue">×</button>
        </div>
      </header>
      <div class="waypoint-queue-list">
        ${[...otherRoutes].map(([route, annotations]) => `
          <button class="waypoint-queue-route" type="button" data-route="${escapeHTML(route)}">
            <span>${escapeHTML(route)}</span><span>${annotations.length}</span>
          </button>
        `).join('')}
      </div>
    `;
    panel.querySelector('.waypoint-queue-close').addEventListener('click', close);
    panel.querySelector('.waypoint-queue-current-route').addEventListener('click', () => {
      renderRouteView(currentRoute.annotations, currentRoute.route, otherRoutes, actions, currentRoute);
    });
    panel.querySelectorAll('.waypoint-queue-route').forEach(button => {
      button.addEventListener('click', () => {
        const annotations = otherRoutes.get(button.dataset.route) || [];
        renderRouteView(annotations, button.dataset.route, otherRoutes, actions, currentRoute);
      });
    });
  }

  function wireSelection(annotations, actions) {
    const inputs = [...panel.querySelectorAll('.waypoint-queue-select')];
    const selectAll = panel.querySelector('.waypoint-queue-select-all');
    const discard = panel.querySelector('.waypoint-queue-discard-selected');
    const copy = panel.querySelector('.waypoint-queue-copy-selected');

    const selectedAnnotations = () => {
      const ids = new Set(inputs.filter(input => input.checked).map(input => input.value));
      return annotations.filter(annotation => ids.has(annotation.id));
    };
    const updateActions = () => {
      const count = selectedAnnotations().length;
      discard.disabled = count === 0;
      copy.disabled = count === 0;
      discard.textContent = count ? `Discard ${count}` : 'Discard';
      copy.textContent = count ? `Copy ${count}` : 'Copy';
      selectAll.textContent = count === annotations.length ? 'Clear selection' : 'Select all';
    };

    inputs.forEach(input => input.addEventListener('click', updateActions));
    selectAll.addEventListener('click', () => {
      const shouldSelect = selectedAnnotations().length !== annotations.length;
      inputs.forEach(input => { input.checked = shouldSelect; });
      updateActions();
    });
    copy.addEventListener('click', async () => {
      const selected = selectedAnnotations();
      if (selected.length) await actions.copy?.(selected);
    });
    discard.addEventListener('click', () => {
      const selected = selectedAnnotations();
      if (!selected.length) return;
      const noun = selected.length === 1 ? 'annotation' : 'annotations';
      const actionBar = panel.querySelector('.waypoint-queue-actions');
      const defaultActionsHTML = actionBar.innerHTML;
      actionBar.innerHTML = `
        <span class="waypoint-queue-confirm-copy">Discard ${selected.length} ${noun}?</span>
        <button class="waypoint-queue-cancel-discard" type="button">Cancel</button>
        <button class="waypoint-queue-confirm-discard" type="button">Discard</button>
      `;
      actionBar.querySelector('.waypoint-queue-cancel-discard').addEventListener('click', () => {
        actionBar.innerHTML = defaultActionsHTML;
        wireSelection(annotations, actions);
      });
      actionBar.querySelector('.waypoint-queue-confirm-discard').addEventListener('click', async () => {
        try {
          await actions.discard?.(selected);
          close();
        } catch (error) {
          showActionError(actionBar, error, 'Could not discard the selected annotations.');
        }
      });
    });
    updateActions();
  }

  function showActionError(container, error, fallback) {
    container.innerHTML = `<span class="waypoint-queue-action-error" role="alert">${escapeHTML(error?.message || fallback)}</span>`;
  }

  function position(anchor) {
    if (!panel || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const inLowerHalf = rect.top > window.innerHeight / 2;
    panel.classList.toggle('above', inLowerHalf);
    panel.style.right = `${Math.max(12, window.innerWidth - rect.right)}px`;
    if (inLowerHalf) {
      panel.style.bottom = `${Math.max(12, window.innerHeight - rect.top + 10)}px`;
      panel.style.top = 'auto';
    } else {
      panel.style.top = `${Math.max(12, rect.bottom + 10)}px`;
      panel.style.bottom = 'auto';
    }
  }

  function toggle(anchor, actions) {
    if (panel) {
      close();
      return Promise.resolve();
    }
    return open(anchor, actions);
  }

  return { close, open, toggle };
})();
