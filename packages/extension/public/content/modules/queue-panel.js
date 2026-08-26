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

  function variantLabels(annotation) {
    const labels = [];
    if (annotation.variant_request) {
      const activeKey = annotation.variant_request.active_variant_key;
      const active = annotation.variant_request.variants?.find(variant => variant.key === activeKey);
      labels.push(active ? `Variant: ${active.name}` : `Variants: ${annotation.variant_request.status}`);
    } else if (annotation.variant_intent?.requested) {
      labels.push('Variants requested');
    }
    return labels;
  }

  function formatTargetSummary(annotation) {
    if (annotation.component_name) return annotation.component_name;
    const context = annotation.element_context || {};
    const tag = context.tag ? `<${context.tag}>` : '';
    const text = typeof context.text === 'string' ? context.text.trim().replace(/\s+/g, ' ') : '';
    const boundedText = text.length > 34 ? `${text.slice(0, 31)}…` : text;
    const captured = [tag, boundedText ? `“${boundedText}”` : ''].filter(Boolean).join(' ');
    return captured || annotation.selector || annotation.element || 'Target';
  }

  function signalIcon(type, label, path) {
    return `<span class="waypoint-queue-signal" data-signal="${type}" role="img" aria-label="${escapeHTML(label)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></span>`;
  }

  function hasStyleChanges(annotation) {
    if (typeof annotation.css === 'string' ? annotation.css.trim() : annotation.css) return true;
    return Object.entries(annotation.pending_changes || {}).some(([property, change]) => (
      property !== 'copyChange' && change && typeof change === 'object'
    ));
  }

  const SIGNAL_DEFINITIONS = [
    {
      key: 'attachment',
      legend: 'File',
      path: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
      describe(annotation) {
        const count = annotation.attachments?.length;
        if (!count && !annotation.has_attachments) return null;
        return count ? `${count} uploaded file${count === 1 ? '' : 's'}` : 'Uploaded files';
      },
    },
    {
      key: 'design-action',
      legend: 'Design',
      path: '<path d="m12 3-1.4 3.6L7 8l3.6 1.4L12 13l1.4-3.6L17 8l-3.6-1.4L12 3Z"/><path d="m5 14-.9 2.1L2 17l2.1.9L5 20l.9-2.1L8 17l-2.1-.9L5 14Z"/><path d="m19 13-1 2.5-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5Z"/>',
      describe(annotation) {
        if (!annotation.design_intent) return null;
        const action = annotation.design_intent.action;
        const label = action ? `${action.charAt(0).toUpperCase()}${action.slice(1)}` : 'Freeform';
        return `Design Action: ${label}`;
      },
    },
    {
      key: 'css',
      legend: 'CSS',
      path: '<path d="m8 3-5 9 5 9"/><path d="m16 3 5 9-5 9"/><path d="m14 4-4 16"/>',
      describe: annotation => hasStyleChanges(annotation) ? 'Custom CSS override' : null,
    },
    {
      key: 'screenshot',
      legend: 'Screenshot',
      path: '<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="13" r="3"/>',
      describe: annotation => annotation.screenshot || annotation.has_screenshot ? 'Automatic screenshot' : null,
    },
  ];

  function renderSignals(annotation) {
    const signals = SIGNAL_DEFINITIONS.flatMap(definition => {
      const label = definition.describe(annotation);
      return label ? [signalIcon(definition.key, label, definition.path)] : [];
    });
    return signals.length ? `<span class="waypoint-queue-signals">${signals.join('')}</span>` : '';
  }

  function renderSignalKey() {
    return `
      <div class="waypoint-queue-signal-key" aria-label="Annotation context indicators">
        <span class="waypoint-queue-signal-key-title">Indicators</span>
        ${SIGNAL_DEFINITIONS.map(definition => `<span class="waypoint-queue-signal-key-item">${signalIcon(`${definition.key}-key`, definition.legend === 'Design' ? 'Design action' : definition.legend, definition.path)}<span aria-hidden="true">${definition.legend}</span></span>`).join('')}
      </div>
    `;
  }

  function renderAnnotation(annotation, selectable = true, isCurrentRoute = true) {
    const details = [statusLabel(annotation.status), formatTargetSummary(annotation), ...variantLabels(annotation)];
    return `
      <div class="waypoint-queue-row${selectable ? '' : ' waypoint-queue-row-history'}" data-annotation-id="${escapeHTML(annotation.id)}">
        ${selectable ? `<input class="waypoint-queue-select" type="checkbox" value="${escapeHTML(annotation.id)}" aria-label="Select annotation: ${escapeHTML(annotation.comment || 'Untitled annotation')}">` : ''}
        <span class="waypoint-queue-copy">
          <span class="waypoint-queue-comment">${escapeHTML(annotation.comment || 'Untitled annotation')}</span>
          <span class="waypoint-queue-meta">${details.map(escapeHTML).join(' · ')}</span>
          ${renderSignals(annotation)}
        </span>
        <span class="waypoint-queue-row-actions">
          <button class="waypoint-queue-open" type="button" data-annotation-id="${escapeHTML(annotation.id)}">${isCurrentRoute ? 'Open' : 'Go to route'}</button>
          <button class="waypoint-queue-delete" type="button" data-annotation-id="${escapeHTML(annotation.id)}" aria-label="Delete annotation permanently">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
      const routeState = groups.get(route) || { annotations: [], route, isCurrent: false };
      routeState.annotations.push(annotation);
      groups.set(route, routeState);
    }
    return groups;
  }

  function close(restoreFocus = true) {
    panel?.remove();
    panel = null;
    if (restoreFocus) opener?.focus?.();
    opener = null;
  }

  function syncStatusMessage(status) {
    const count = status?.pending_count || 0;
    if (!status?.connected) {
      return count > 0
        ? `${count} local ${count === 1 ? 'change' : 'changes'}; server unavailable`
        : 'Server unavailable';
    }
    if (count > 0) return `${count} ${count === 1 ? 'change' : 'changes'} not synced`;
    return 'Up to date';
  }

  function renderSyncStatus(status) {
    return `
      <div class="waypoint-queue-sync-status" role="status" aria-live="polite">
        <span>${escapeHTML(syncStatusMessage(status))}</span>
        <button class="waypoint-queue-sync-now" type="button"${status?.connected ? '' : ' disabled'}>Sync now</button>
      </div>
    `;
  }

  function loadSyncStatus() {
    if (typeof WaypointAPI.getSyncStatus !== 'function') {
      return Promise.resolve({ connected: false });
    }
    return WaypointAPI.getSyncStatus().catch(error => ({ connected: false, error: error.message }));
  }

  async function open(anchor, actions = {}) {
    close();
    const [annotations, projectAnnotations, syncStatus] = await Promise.all([
      WaypointAPI.loadAnnotations(),
      WaypointAPI.loadProjectAnnotations(),
      loadSyncStatus(),
    ]);
    const root = WaypointShadowHost.getRoot();
    if (!root) return;
    const currentRoute = {
      annotations,
      route: window.location.pathname + window.location.search + window.location.hash,
      isCurrent: true,
    };
    const queue = { actions, currentRoute, otherRoutes: groupOtherRoutes(projectAnnotations), syncStatus };
    opener = anchor.querySelector?.('.waypoint-tb-queue') || anchor;

    panel = document.createElement('section');
    panel.className = 'waypoint-queue-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Annotation Queue');
    panel.onkeydown = event => {
      if (event.key === 'Escape') close();
    };
    root.appendChild(panel);
    renderRouteView(queue, currentRoute);
    position(anchor);
    panel.querySelector('.waypoint-queue-close')?.focus();
  }

  function renderRouteView(queue, routeState, view = 'active') {
    const { actions, otherRoutes } = queue;
    const { annotations, route, isCurrent } = routeState;
    const activeAnnotations = annotations.filter(WaypointAnnotationStatus.isActionable);
    const historyAnnotations = annotations.filter(WaypointAnnotationStatus.isHistorical);
    const visibleAnnotations = view === 'history' ? historyAnnotations : activeAnnotations;
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
      ${renderSyncStatus(queue.syncStatus)}
      ${visibleAnnotations.length ? renderSignalKey() : ''}
      <nav class="waypoint-queue-views" aria-label="Queue views">
        <button class="waypoint-queue-active-view" type="button" aria-pressed="${view === 'active'}">Active <span>${activeAnnotations.length}</span></button>
        <button class="waypoint-queue-history-view" type="button" aria-pressed="${view === 'history'}">History <span>${historyAnnotations.length}</span></button>
      </nav>
      <div class="waypoint-queue-list">
        ${visibleAnnotations.length ? visibleAnnotations.map(annotation => renderAnnotation(annotation, view === 'active', isCurrent)).join('') : `<p class="waypoint-queue-empty">No ${view === 'history' ? 'history' : 'active annotations'} on this route.</p>`}
      </div>
      ${view === 'active' && visibleAnnotations.length ? `
        <footer class="waypoint-queue-actions">
          <span class="waypoint-queue-copy-feedback" role="status" aria-live="polite"></span>
          <button class="waypoint-queue-select-all" type="button">Select all</button>
          <button class="waypoint-queue-discard-selected" type="button" disabled>Discard</button>
          <button class="waypoint-queue-copy-selected" type="button" disabled>Copy</button>
          <div class="waypoint-queue-export">
            <button class="waypoint-queue-export-selected" type="button" aria-label="Export selected annotations" aria-haspopup="menu" aria-expanded="false" disabled>
              <span>Export</span>
              <svg class="waypoint-queue-export-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="waypoint-queue-export-menu" role="menu" hidden>
              <button class="waypoint-queue-export-json" type="button" role="menuitem">Download JSON</button>
              <button class="waypoint-queue-export-markdown" type="button" role="menuitem">Download Markdown</button>
            </div>
          </div>
        </footer>
      ` : view === 'history' && visibleAnnotations.length ? `
        <footer class="waypoint-queue-actions waypoint-queue-history-actions">
          <span>History stays until you remove it.</span>
          <button class="waypoint-queue-clear-history" type="button">Clear history</button>
        </footer>
      ` : ''}
    `;
    panel.querySelector('.waypoint-queue-close').addEventListener('click', close);
    panel.querySelector('.waypoint-queue-sync-now').addEventListener('click', async event => {
      const button = event.currentTarget;
      const status = button.closest('.waypoint-queue-sync-status');
      button.disabled = true;
      button.textContent = 'Syncing…';
      try {
        queue.syncStatus = await WaypointAPI.syncNow();
        status.querySelector('span').textContent = syncStatusMessage(queue.syncStatus);
      } catch (error) {
        status.querySelector('span').textContent = error?.message || 'Sync failed. Try again.';
      } finally {
        button.disabled = !queue.syncStatus?.connected;
        button.textContent = 'Sync now';
      }
    });
    panel.querySelector('.waypoint-queue-other-routes')?.addEventListener('click', () => renderRouteList(queue));
    panel.querySelector('.waypoint-queue-active-view').addEventListener('click', () => renderRouteView(queue, routeState, 'active'));
    panel.querySelector('.waypoint-queue-history-view').addEventListener('click', () => renderRouteView(queue, routeState, 'history'));
    panel.querySelectorAll('.waypoint-queue-open').forEach(button => {
      button.addEventListener('click', () => {
        const annotation = visibleAnnotations.find(candidate => candidate.id === button.dataset.annotationId);
        if (!annotation) return;
        close(false);
        if (isCurrent) actions.open?.(annotation);
        else actions.navigate?.(annotation);
      });
    });
    panel.querySelectorAll('.waypoint-queue-delete').forEach(button => {
      button.addEventListener('click', () => openDeleteConfirm(button, queue, routeState, view));
    });
    if (view === 'active' && visibleAnnotations.length) {
      wireSelection(visibleAnnotations, queue, routeState);
    }
    if (view === 'history' && visibleAnnotations.length) {
      panel.querySelector('.waypoint-queue-clear-history').addEventListener('click', () => {
        openHistoryCleanup(queue, routeState);
      });
    }
  }

  function historyCleanupMatches(annotation, statusScope, ageScope) {
    const statusMatches = statusScope === 'terminal'
      ? ['resolved', 'discarded'].includes(annotation.status)
      : annotation.status === 'discarded';
    if (!statusMatches) return false;
    if (ageScope === 'all') return true;
    const timestamp = Date.parse(annotation.updated_at || annotation.created_at || '');
    if (!Number.isFinite(timestamp)) return false;
    return timestamp <= Date.now() - Number(ageScope) * 86400000;
  }

  function openHistoryCleanup(queue, routeState) {
    const { actions } = queue;
    const { annotations } = routeState;
    const actionBar = panel.querySelector('.waypoint-queue-history-actions');
    actionBar.classList.add('waypoint-queue-cleanup');
    actionBar.innerHTML = `
      <div class="waypoint-queue-cleanup-fields">
        <label>Status
          <select class="waypoint-queue-cleanup-status">
            <option value="discarded">Discarded only</option>
            <option value="terminal">Resolved and discarded</option>
          </select>
        </label>
        <label>Older than
          <select class="waypoint-queue-cleanup-age">
            <option value="7">7 days</option>
            <option value="30" selected>30 days</option>
            <option value="90">90 days</option>
            <option value="all">Everything</option>
          </select>
        </label>
      </div>
      <div class="waypoint-queue-cleanup-confirmation">
        <span class="waypoint-queue-cleanup-preview" role="status" aria-live="polite"></span>
        <button class="waypoint-queue-cancel-cleanup" type="button">Cancel</button>
        <button class="waypoint-queue-confirm-cleanup" type="button">Delete</button>
      </div>
    `;
    const status = actionBar.querySelector('.waypoint-queue-cleanup-status');
    const age = actionBar.querySelector('.waypoint-queue-cleanup-age');
    const preview = actionBar.querySelector('.waypoint-queue-cleanup-preview');
    const confirm = actionBar.querySelector('.waypoint-queue-confirm-cleanup');
    const matches = () => annotations.filter(annotation => historyCleanupMatches(annotation, status.value, age.value));
    const updatePreview = () => {
      const count = matches().length;
      preview.textContent = `${count} annotation${count === 1 ? '' : 's'} will be permanently deleted.`;
      confirm.disabled = count === 0;
    };
    status.addEventListener('change', updatePreview);
    age.addEventListener('change', updatePreview);
    actionBar.querySelector('.waypoint-queue-cancel-cleanup').addEventListener('click', () => {
      renderRouteView(queue, routeState, 'history');
    });
    confirm.addEventListener('click', async () => {
      const selected = matches();
      if (!selected.length) return;
      confirm.disabled = true;
      confirm.textContent = 'Deleting…';
      try {
        await Promise.all(selected.map(annotation => actions.delete?.(annotation)));
        const deletedIds = new Set(selected.map(annotation => annotation.id));
        const remaining = annotations.filter(annotation => !deletedIds.has(annotation.id));
        annotations.splice(0, annotations.length, ...remaining);
        renderRouteView(queue, routeState, 'history');
      } catch (error) {
        actionBar.querySelector('.waypoint-queue-action-error')?.remove();
        const message = document.createElement('span');
        message.className = 'waypoint-queue-action-error';
        message.setAttribute('role', 'alert');
        message.textContent = error?.message || 'Could not clear history.';
        actionBar.appendChild(message);
        confirm.disabled = false;
        confirm.textContent = 'Delete';
      }
    });
    updatePreview();
  }

  function openDeleteConfirm(button, queue, routeState, view) {
    const { actions } = queue;
    const { annotations } = routeState;
    panel.querySelector('.waypoint-queue-row-menu')?.remove();
    const annotation = annotations.find(candidate => candidate.id === button.dataset.annotationId);
    if (!annotation) return;
    const row = button.closest('.waypoint-queue-row');
    const menu = document.createElement('div');
    menu.className = 'waypoint-queue-row-menu';
    menu.innerHTML = `
      <span>Delete this annotation permanently?</span>
      <button class="waypoint-queue-cancel-delete" type="button">Cancel</button>
      <button class="waypoint-queue-confirm-delete" type="button">Delete</button>
    `;
    row.appendChild(menu);
    menu.querySelector('.waypoint-queue-cancel-delete').addEventListener('click', () => menu.remove());
    menu.querySelector('.waypoint-queue-confirm-delete').addEventListener('click', async () => {
      try {
        await actions.delete?.(annotation);
        const deletedIndex = annotations.findIndex(candidate => candidate.id === annotation.id);
        if (deletedIndex >= 0) annotations.splice(deletedIndex, 1);
        renderRouteView(queue, routeState, view);
        panel.querySelector(view === 'history' ? '.waypoint-queue-history-view' : '.waypoint-queue-active-view')?.focus();
      } catch (error) {
        showActionError(menu, error, 'Could not delete this annotation.');
      }
    });
  }

  function renderRouteList(queue) {
    const { currentRoute, otherRoutes } = queue;
    panel.innerHTML = `
      <header class="waypoint-queue-header">
        <div><h2>Other routes <span>${otherRoutes.size}</span></h2><p>Current site</p></div>
        <div class="waypoint-queue-header-actions">
          <button class="waypoint-queue-current-route" type="button">Current route</button>
          <button class="waypoint-queue-close" type="button" aria-label="Close Queue">×</button>
        </div>
      </header>
      <div class="waypoint-queue-list">
        ${[...otherRoutes].map(([route, routeState]) => `
          <button class="waypoint-queue-route" type="button" data-route="${escapeHTML(route)}">
            <span>${escapeHTML(route)}</span><span>${routeState.annotations.length}</span>
          </button>
        `).join('')}
      </div>
    `;
    panel.querySelector('.waypoint-queue-close').addEventListener('click', close);
    panel.querySelector('.waypoint-queue-current-route').addEventListener('click', () => {
      renderRouteView(queue, currentRoute);
    });
    panel.querySelectorAll('.waypoint-queue-route').forEach(button => {
      button.addEventListener('click', () => {
        const routeState = otherRoutes.get(button.dataset.route);
        if (routeState) renderRouteView(queue, routeState);
      });
    });
  }

  function wireSelection(annotations, queue, routeState) {
    const { actions } = queue;
    const inputs = [...panel.querySelectorAll('.waypoint-queue-select')];
    const selectAll = panel.querySelector('.waypoint-queue-select-all');
    const discard = panel.querySelector('.waypoint-queue-discard-selected');
    const copy = panel.querySelector('.waypoint-queue-copy-selected');
    const exportButton = panel.querySelector('.waypoint-queue-export-selected');
    const exportMenu = panel.querySelector('.waypoint-queue-export-menu');
    const copyFeedback = panel.querySelector('.waypoint-queue-copy-feedback');

    const selectedAnnotations = () => {
      const ids = new Set(inputs.filter(input => input.checked).map(input => input.value));
      return annotations.filter(annotation => ids.has(annotation.id));
    };
    const updateActions = () => {
      const count = selectedAnnotations().length;
      discard.disabled = count === 0;
      copy.disabled = count === 0;
      exportButton.disabled = count === 0;
      discard.textContent = count ? `Discard ${count}` : 'Discard';
      copy.textContent = count ? `Copy ${count}` : 'Copy';
      selectAll.textContent = count === annotations.length ? 'Clear selection' : 'Select all';
    };
    const setExportMenuOpen = open => {
      exportMenu.hidden = !open;
      exportButton.setAttribute('aria-expanded', String(open));
    };

    inputs.forEach(input => input.addEventListener('click', updateActions));
    selectAll.addEventListener('click', () => {
      const shouldSelect = selectedAnnotations().length !== annotations.length;
      inputs.forEach(input => { input.checked = shouldSelect; });
      updateActions();
    });
    copy.addEventListener('click', async () => {
      const selected = selectedAnnotations();
      if (!selected.length) return;
      await actions.copy?.(selected);
      copyFeedback.textContent = 'Copied to clipboard';
      copy.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m20 6-11 11-5-5"/></svg><span>Copied</span>';
      setTimeout(() => {
        if (!copy.isConnected) return;
        copyFeedback.textContent = '';
        updateActions();
      }, 1400);
    });
    exportButton.addEventListener('click', () => {
      if (!selectedAnnotations().length) return;
      setExportMenuOpen(exportButton.getAttribute('aria-expanded') !== 'true');
      if (!exportMenu.hidden) exportMenu.querySelector('[role="menuitem"]')?.focus();
    });
    exportMenu.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setExportMenuOpen(false);
      exportButton.focus();
    });
    const runExport = async format => {
      const selected = selectedAnnotations();
      if (!selected.length) return;
      await actions.export?.(selected, { format });
      setExportMenuOpen(false);
      copyFeedback.textContent = `${format === 'json' ? 'JSON' : 'Markdown'} export downloaded`;
      exportButton.focus();
    };
    exportMenu.querySelector('.waypoint-queue-export-json').addEventListener('click', () => runExport('json'));
    exportMenu.querySelector('.waypoint-queue-export-markdown').addEventListener('click', () => runExport('markdown'));
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
        wireSelection(annotations, queue, routeState);
      });
      actionBar.querySelector('.waypoint-queue-confirm-discard').addEventListener('click', async () => {
        try {
          await actions.discard?.(selected);
          selected.forEach(annotation => { annotation.status = 'discarded'; });
          renderRouteView(queue, routeState, 'active');
          panel.querySelector('.waypoint-queue-active-view')?.focus();
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
