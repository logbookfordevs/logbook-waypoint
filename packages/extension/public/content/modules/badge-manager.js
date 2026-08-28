// Renders numbered pins (badges) inside shadow DOM
// Position-tracked via RAF loop (only runs when badges exist)
// Zero host DOM modification for display

var WaypointBadgeManager = (() => {
  const DESIGN_PROPS = [
    'fontSize','fontWeight','lineHeight','textAlign',
    'paddingTop','paddingRight','paddingBottom','paddingLeft',
    'marginTop','marginRight','marginBottom','marginLeft',
    'display','flexDirection','flexWrap','gap','columnGap','rowGap',
    'justifyContent','alignItems','gridTemplateColumns','gridTemplateRows',
    'borderWidth','borderRadius','borderStyle',
    'color','backgroundColor','borderColor',
    'width','minWidth','maxWidth','height','minHeight','maxHeight'
  ];

  // Get all style props to clear/apply from pending_changes + DESIGN_PROPS
  function getStyleProps(pc) {
    if (!pc) return DESIGN_PROPS;
    const keys = new Set(DESIGN_PROPS);
    for (const k of Object.keys(pc)) keys.add(k);
    return keys;
  }

  function restorePendingChanges(targetElement, pendingChanges) {
    if (!pendingChanges) return;
    for (const [prop, change] of Object.entries(pendingChanges)) {
      if (prop === 'copyChange' || !change || typeof change !== 'object') continue;
      targetElement.style[prop] = change.original || '';
    }
    if (pendingChanges.copyChange) targetElement.textContent = pendingChanges.copyChange.original;
  }

  let badges = []; // { el, annotation, targetElement }
  let styleInjections = []; // { styleEl, annotation } for stylesheet annotations
  let rafId = null;
  let provisionalBadge = null;
  let domObserver = null;
  let rematchDebounceTimer = null;
  let lastTotal = 0; // total annotations (including unanchored)
  const savedTargets = new Map();

  function annotationLabel(annotation) {
    const comment = typeof annotation.comment === 'string' ? annotation.comment.trim() : '';
    if (comment) return comment;
    if (annotation.pending_changes?.copyChange) return 'Text content edit';
    return 'Annotation';
  }

  function init() {
    WaypointEvents.on('annotations:render', render);
    WaypointEvents.on('annotation:saved', ({ annotation, element }) => {
      if (annotation?.id && element) savedTargets.set(annotation.id, element);
    });
    WaypointEvents.on('annotation:deleted', onDeleted);
    WaypointEvents.on('annotation:updated', onUpdated);
    WaypointEvents.on('inspection:elementClicked', onProvisionalPin);
    WaypointEvents.on('popover:cancelled', removeProvisional);
    startDOMObserver();
  }

  // --- DOM observer: detect when framework re-renders replace annotated elements ---
  function startDOMObserver() {
    if (domObserver) return;
    const onMutation = () => {
      // Check if any badge targets got disconnected
      const hasDisconnected = badges.some(b => !b.targetElement.isConnected);
      if (hasDisconnected) {
        // Debounce — frameworks often batch multiple mutations
        clearTimeout(rematchDebounceTimer);
        rematchDebounceTimer = setTimeout(rematchDisconnectedBadges, 150);
      }
    };
    domObserver = new MutationObserver(onMutation);
    domObserver.observe(document.body, { childList: true, subtree: true });

    // Also observe inside open shadow roots so we catch web component re-renders
    try {
      const hosts = document.querySelectorAll('*');
      for (const el of hosts) {
        if (el.shadowRoot) {
          const shadowObs = new MutationObserver(onMutation);
          shadowObs.observe(el.shadowRoot, { childList: true, subtree: true });
        }
      }
    } catch { /* skip — shadow roots may not be available yet */ }
  }

  function rematchDisconnectedBadges() {
    let changed = false;
    for (const entry of badges) {
      if (!entry.targetElement.isConnected) {
        const newTarget = WaypointElementContext.findElementBySelector(entry.target);
        if (newTarget && newTarget !== entry.targetElement) {
          entry.targetElement = newTarget;
          entry.el.style.display = '';
          // Re-apply pending changes on the new target
          const pc = entry.annotation.pending_changes;
          if (pc) {
            for (const prop of getStyleProps(pc)) {
              if (pc[prop]) newTarget.style[prop] = pc[prop].value;
            }
            if (pc.copyChange) newTarget.textContent = pc.copyChange.value;
          }
          changed = true;
        }
      }
    }
    if (changed) console.log('[Waypoint] Re-matched badges after framework re-render');
  }

  function onProvisionalPin({ clientX, clientY, shiftKey = false }) {
    if (WaypointMultiTargetSelection.shouldHandle(shiftKey)) return;
    removeProvisional();
    const root = WaypointShadowHost.getRoot();
    if (!root || clientX == null) return;

    const badge = document.createElement('div');
    badge.className = 'waypoint-badge';
    badge.textContent = (badges.length + 1).toString();
    badge.style.top = `${clientY - 11}px`;
    badge.style.left = `${clientX}px`;
    root.appendChild(badge);
    provisionalBadge = badge;
  }

  function removeProvisional() {
    if (provisionalBadge) {
      provisionalBadge.remove();
      provisionalBadge = null;
    }
  }

  function render(annotations) {
    const renderableAnnotations = WaypointAnnotationStatus.filterRenderable(annotations);
    removeProvisional();
    rollbackChangedTargets(renderableAnnotations);
    syncStyleAnnotations(renderableAnnotations);

    const sorted = [...renderableAnnotations].sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );
    const previousBadges = new Map(badges.map(entry => [`${entry.annotation.id}:${entry.targetIndex}`, entry]));
    badges = [];

    let badgeIndex = 0;
    sorted.forEach((annotation) => {
      // Stylesheet annotations — inject as <style> tag
      if (annotation.type === 'stylesheet' && annotation.css) {
        return;
      }

      badgeIndex++;
      const annotationTargets = WaypointAnnotationTargets.get(annotation);
      annotationTargets.forEach((targetData, targetIndex) => {
        const savedTarget = targetIndex === 0 ? savedTargets.get(annotation.id) : null;
        const target = savedTarget?.isConnected
          ? savedTarget
          : WaypointElementContext.findElementBySelector(targetData);
        if (!target) return;
        // Rehydrate pending design changes
        const rpc = annotationTargets.length === 1 ? annotation.pending_changes : null;
        if (rpc) {
          for (const prop of getStyleProps(rpc)) {
            if (rpc[prop]) target.style[prop] = rpc[prop].value;
          }
          if (rpc.copyChange) target.textContent = rpc.copyChange.value;
        }
        const key = `${annotation.id}:${targetIndex}`;
        const existing = previousBadges.get(key);
        const label = annotationTargets.length > 1
          ? `${badgeIndex}${String.fromCharCode(97 + targetIndex)}`
          : badgeIndex.toString();
        if (existing) {
          if (existing.targetElement !== target) {
            restorePendingChanges(existing.targetElement, existing.annotation.pending_changes);
          }
          existing.annotation = annotation;
          existing.target = targetData;
          existing.targetElement = target;
          existing.el.childNodes[0].textContent = label;
          const tooltip = existing.el.querySelector('.waypoint-badge-tooltip');
          if (tooltip) tooltip.textContent = annotationLabel(annotation);
          badges.push(existing);
          positionBadge(existing);
          previousBadges.delete(key);
        } else {
          addBadge(target, annotation, targetData, targetIndex, label);
        }
      });
      savedTargets.delete(annotation.id);
    });

    for (const entry of previousBadges.values()) {
      restorePendingChanges(entry.targetElement, entry.annotation.pending_changes);
      entry.el.remove();
    }
    if (!badges.length) stopRAF();

    lastTotal = renderableAnnotations.length;
    WaypointEvents.emit('badges:rendered', { count: badges.length, total: renderableAnnotations.length, styleCount: styleInjections.filter(s => s.annotation.type === 'stylesheet').length });
  }

  function injectStyleAnnotation(annotation) {
    const style = document.createElement('style');
    style.setAttribute('data-waypoint-style', annotation.id);
    style.textContent = annotation.css;
    document.head.appendChild(style);
    styleInjections.push({ styleEl: style, annotation });
  }

  function rollbackChangedTargets(annotations) {
    const nextById = new Map(annotations.map(annotation => [annotation.id, annotation]));
    for (const entry of badges) {
      const next = nextById.get(entry.annotation.id);
      const previewChanged = JSON.stringify(next?.pending_changes || null)
        !== JSON.stringify(entry.annotation.pending_changes || null);
      if (!next || previewChanged) {
        restorePendingChanges(entry.targetElement, entry.annotation.pending_changes);
      }
    }
  }

  function syncStyleAnnotations(annotations) {
    const desired = new Map(
      annotations.filter(annotation => annotation.css).map(annotation => [annotation.id, annotation])
    );

    for (const entry of [...styleInjections]) {
      const annotation = desired.get(entry.annotation.id);
      if (!annotation) {
        entry.styleEl.remove();
        styleInjections.splice(styleInjections.indexOf(entry), 1);
        continue;
      }
      if (entry.styleEl.textContent !== annotation.css) entry.styleEl.textContent = annotation.css;
      entry.annotation = annotation;
      desired.delete(annotation.id);
    }

    for (const annotation of desired.values()) injectStyleAnnotation(annotation);
  }

  function addBadge(targetElement, annotation, target, targetIndex, label) {
    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    const badge = document.createElement('div');
    badge.className = 'waypoint-badge';
    badge.textContent = label;
    badge.dataset.annotationId = annotation.id;

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'waypoint-badge-tooltip';
    tooltip.textContent = annotationLabel(annotation);
    badge.appendChild(tooltip);

    root.appendChild(badge);

    const entry = { el: badge, annotation, target, targetElement, targetIndex };

    // Click → edit (read from entry so we get the latest annotation after updates)
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetElements = WaypointAnnotationTargets.get(entry.annotation)
        .map(candidate => WaypointElementContext.findElementBySelector(candidate));
      WaypointEvents.emit('annotation:edit', {
        annotation: entry.annotation,
        element: entry.targetElement,
        targetElements,
        targetIndex: entry.targetIndex,
      });
    });
    badges.push(entry);

    // Position immediately
    positionBadge(entry);

    // Start RAF loop if not running
    if (!rafId) startRAF();
  }

  function positionBadge(entry) {
    if (!entry.targetElement.isConnected) {
      entry.el.style.display = 'none';
      return;
    }
    const rect = entry.targetElement.getBoundingClientRect();
    const off = entry.target.badge_offset;
    entry.el.style.display = '';
    entry.el.style.top = `${rect.top + (off ? off.y : 0) - 11}px`;
    entry.el.style.left = `${rect.left + (off ? off.x : rect.width / 2)}px`;
  }

  function startRAF() {
    const tick = () => {
      for (const entry of badges) {
        positionBadge(entry);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function stopRAF() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function clearAll(annotations, { restoreTargets = true, removeStyles = true } = {}) {
    // Clear injected stylesheets
    if (removeStyles) {
      for (const entry of styleInjections) entry.styleEl.remove();
      styleInjections = [];
    }

    // Clear tracked badges
    const clearedEls = new Set();
    for (const entry of badges) {
      const pc = entry.annotation.pending_changes;
      if (restoreTargets) {
        restorePendingChanges(entry.targetElement, pc);
      }
      clearedEls.add(entry.targetElement);
      entry.el.remove();
    }
    badges = [];
    savedTargets.clear();
    lastTotal = 0;
    stopRAF();
    clearTimeout(rematchDebounceTimer);

    // Sweep for orphaned styled elements (badges lost their target but styles remain)
    if (restoreTargets && annotations) {
      for (const a of annotations) {
        if (!a.pending_changes) continue;
        const el = WaypointElementContext.findElementBySelector(a);
        if (el && !clearedEls.has(el)) {
          const pc = a.pending_changes;
          restorePendingChanges(el, pc);
        }
      }
    }
  }

  function onDeleted({ id, annotation }) {
    savedTargets.delete(id);
    // Remove companion style tag if any (both standalone stylesheet and element-anchored css)
    const styleIdx = styleInjections.findIndex(s => s.annotation.id === id);
    if (styleIdx !== -1) {
      styleInjections[styleIdx].styleEl.remove();
      styleInjections.splice(styleIdx, 1);
      // If this was a pure stylesheet annotation (no badge), we're done
      if (annotation?.type === 'stylesheet') return;
    }

    const deletedEntries = badges.filter(b => b.annotation.id === id);
    if (deletedEntries.length) {
      for (const entry of deletedEntries) {
        const pc = entry.annotation.pending_changes;
        restorePendingChanges(entry.targetElement, pc);
        entry.el.remove();
      }
      badges = badges.filter(entry => entry.annotation.id !== id);
    } else if (annotation?.pending_changes) {
      // Badge was lost but element may still have inline styles — retry selector
      const el = WaypointElementContext.findElementBySelector(annotation);
      if (el) {
        const pc = annotation.pending_changes;
        restorePendingChanges(el, pc);
      }
    }
    if (!badges.length) stopRAF();

    const annotationNumbers = new Map();
    for (const entry of badges) {
      if (!annotationNumbers.has(entry.annotation.id)) {
        annotationNumbers.set(entry.annotation.id, annotationNumbers.size + 1);
      }
      const number = annotationNumbers.get(entry.annotation.id);
      const targetCount = WaypointAnnotationTargets.get(entry.annotation).length;
      entry.el.childNodes[0].textContent = targetCount > 1
        ? `${number}${String.fromCharCode(97 + entry.targetIndex)}`
        : number.toString();
    }
  }

  function onUpdated({ id, comment, pending_changes, css, design_intent, variant_intent }) {
    const entries = badges.filter(b => b.annotation.id === id);
    for (const entry of entries) {
      const tooltip = entry.el.querySelector('.waypoint-badge-tooltip');
      if (tooltip) tooltip.textContent = annotationLabel({ ...entry.annotation, comment, pending_changes });
      const oldPC = entry.annotation.pending_changes;
      // Revert old copy change before applying new state
      entry.annotation = WaypointDesignIntent.applyUpdate(
        entry.annotation,
        { comment, pending_changes, css, design_intent, variant_intent },
      );
      restorePendingChanges(entry.targetElement, oldPC);
      if (pending_changes) {
        for (const prop of getStyleProps(pending_changes)) {
          if (pending_changes[prop]) entry.targetElement.style[prop] = pending_changes[prop].value;
        }
        if (pending_changes.copyChange) entry.targetElement.textContent = pending_changes.copyChange.value;
      }

      // Update companion style tag
      const styleEntry = styleInjections.find(s => s.annotation.id === id);
      if (css && styleEntry) {
        styleEntry.styleEl.textContent = css;
      } else if (css && !styleEntry) {
        injectStyleAnnotation({ id, css });
      } else if (css === null && styleEntry) {
        styleEntry.styleEl.remove();
        styleInjections.splice(styleInjections.indexOf(styleEntry), 1);
      }
    }
  }

  function targetBadge(annotationId) {
    const entry = badges.find(b => b.annotation.id === annotationId);
    if (!entry) return;

    entry.targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    entry.el.classList.add('targeted');
    setTimeout(() => entry.el.classList.remove('targeted'), 2000);
  }

  function highlightElement(annotation) {
    const firstTarget = WaypointAnnotationTargets.get(annotation)[0];
    const el = WaypointElementContext.findElementBySelector(firstTarget);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.outline = '3px solid #3f8580';
    el.style.outlineOffset = '2px';
    setTimeout(() => {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }, 3000);
  }

  function getCount() {
    return badges.length;
  }

  return { init, render, clearAll, targetBadge, highlightElement, getCount };
})();
