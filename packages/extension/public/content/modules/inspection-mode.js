// Inspection mode: hover highlight + click capture
// All visual feedback happens inside shadow DOM (highlight overlay div)
// No host DOM mutation during inspection

var WaypointInspectionMode = (() => {
  let active = false;
  let highlightEl = null;
  let toastEl = null;
  let scopeControlsEl = null;
  let hoveredElement = null;
  let scopeAnchor = null;
  let scopePath = [];
  let scopeIndex = 0;

  // Bound handlers for removal
  let onMouseOver = null;
  let onMouseOut = null;
  let onPointerMove = null;
  let onPointerDown = null;
  let onMouseDown = null;
  let onClick = null;
  let onKeyDown = null;

  function init() {
    WaypointEvents.on('inspection:start', start);
    WaypointEvents.on('inspection:stop', stop);
  }

  function start() {
    if (active) return;
    active = true;

    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    // Create highlight overlay
    highlightEl = document.createElement('div');
    highlightEl.className = 'waypoint-highlight';
    highlightEl.style.display = 'none';
    root.appendChild(highlightEl);

    createScopeControls(root);

    // Show instruction toast
    showToast(root);

    // Set up capture-phase listeners on document
    onMouseOver = handleMouseOver;
    onMouseOut = handleMouseOut;
    onPointerMove = throttle(handlePointerMove, 16); // ~60fps cap
    onPointerDown = handlePointerDown;
    onMouseDown = handleMouseDown;
    onClick = handleClick;
    onKeyDown = handleKeyDown;

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    listenersAttached = true;

    // Crosshair cursor on all host page elements
    const cursorStyle = document.createElement('style');
    cursorStyle.setAttribute('data-waypoint-cursor', '');
    cursorStyle.textContent = '*, *::before, *::after { cursor: crosshair !important; }';
    document.head.appendChild(cursorStyle);

    WaypointEvents.emit('inspection:started');
  }

  function stop() {
    if (!active) return;
    active = false;

    // Remove listeners
    if (listenersAttached) {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      listenersAttached = false;
    }
    onMouseOver = onMouseOut = onPointerMove = onPointerDown = onMouseDown = onClick = onKeyDown = null;

    // Remove highlight
    if (highlightEl) { highlightEl.remove(); highlightEl = null; }
    if (scopeControlsEl) { scopeControlsEl.remove(); scopeControlsEl = null; }

    // Remove toast
    if (toastEl) { toastEl.remove(); toastEl = null; }

    resetScope();

    // Restore cursor
    const cursorStyle = document.querySelector('[data-waypoint-cursor]');
    if (cursorStyle) cursorStyle.remove();

    WaypointEvents.emit('inspection:stopped');
  }

  function isActive() {
    return active;
  }

  let listenersAttached = false;

  // --- Shadow-aware target resolution ---

  // Get the deepest actual element from the event's composed path
  function getDeepTarget(e) {
    const path = e.composedPath?.() || [];
    for (const node of path) {
      if (node instanceof Element) return node;
    }
    return e.target instanceof Element ? e.target : null;
  }

  function isOurUI(e) {
    const path = e.composedPath();
    const host = WaypointShadowHost.getHost();
    return host && path.includes(host);
  }

  // --- Throttle utility ---

  function throttle(fn, ms) {
    let last = 0;
    return function(e) {
      const now = performance.now();
      if (now - last < ms) return;
      last = now;
      fn(e);
    };
  }

  function tempDisable() {
    // Remove listeners but keep active=true so we can re-enable
    if (listenersAttached) {
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      listenersAttached = false;
    }
    if (highlightEl) highlightEl.style.display = 'none';
    resetScope();
  }

  function reEnable() {
    if (!active || listenersAttached) return;
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    listenersAttached = true;
  }

  // --- Handlers ---

  function handleMouseOver(e) {
    if (!active || isOurUI(e)) return;
    e.stopPropagation();

    const target = getDeepTarget(e) || WaypointShadowDOMUtils.elementFromPointDeep(e.clientX, e.clientY);
    if (!target) return;

    setScopeAnchor(target, e.clientX, e.clientY);
  }

  function handleMouseOut(e) {
    if (!active || isOurUI(e)) return;
    e.stopPropagation();

    // Ignore intermediate transitions between elements
    if (e.relatedTarget) return;

    resetScope();
    if (highlightEl) highlightEl.style.display = 'none';
  }

  // Reliable hover across nested shadow roots — pointermove fires for
  // shadow DOM children where mouseover only reports the host.
  // Throttled to ~60fps to avoid performance overhead.
  function handlePointerMove(e) {
    if (!active || isOurUI(e)) return;
    if (isApproachingScopeControls(e)) return;

    const target = getDeepTarget(e) || WaypointShadowDOMUtils.elementFromPointDeep(e.clientX, e.clientY);
    if (!target || target === document.body || target === document.documentElement) return;
    if (target === scopeAnchor) return;

    setScopeAnchor(target, e.clientX, e.clientY);
  }

  // Element selection on pointerdown — fires before frameworks can react
  function handlePointerDown(e) {
    if (!active || isOurUI(e)) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    const pointerTarget = getDeepTarget(e);
    if (!pointerTarget || pointerTarget === document.body || pointerTarget === document.documentElement) return;
    const target = scopeAnchor === pointerTarget && hoveredElement ? hoveredElement : pointerTarget;

    tempDisable();
    WaypointEvents.emit('inspection:elementClicked', { element: target, clientX: e.clientX, clientY: e.clientY });
  }

  // Safety nets — swallow mousedown/click so frameworks never see the interaction
  function handleMouseDown(e) {
    if (!active || isOurUI(e)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function handleClick(e) {
    if (!active || isOurUI(e)) return;
    e.preventDefault();
    e.stopPropagation();
  }

  function handleKeyDown(e) {
    if (!active || !hoveredElement) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (isOurUI(e) && !isScopeControlEvent(e) && !isInspectionTriggerEvent(e)) return;

    e.preventDefault();
    e.stopPropagation();
    moveScope(e.key === 'ArrowRight' ? 1 : -1);
  }

  function isScopeControlEvent(e) {
    if (!scopeControlsEl) return false;
    return e.composedPath().includes(scopeControlsEl);
  }

  function isInspectionTriggerEvent(e) {
    return e.composedPath().some(node => node?.matches?.('.waypoint-tb-annotate'));
  }

  function isApproachingScopeControls(e) {
    if (!scopeControlsEl || scopeControlsEl.style.display === 'none') return false;
    const rect = scopeControlsEl.getBoundingClientRect();
    const approachGap = 12;
    return e.clientX >= rect.left - approachGap
      && e.clientX <= rect.right + approachGap
      && e.clientY >= rect.top - approachGap
      && e.clientY <= rect.bottom + approachGap;
  }

  function setScopeAnchor(element, clientX, clientY) {
    scopeAnchor = element;
    scopePath = [element];
    scopeIndex = 0;

    let parent = WaypointShadowDOMUtils.getParentElement(element);
    const waypointHost = WaypointShadowHost.getHost();
    while (parent && parent !== document.body && parent !== document.documentElement && parent !== waypointHost) {
      scopePath.push(parent);
      parent = WaypointShadowDOMUtils.getParentElement(parent);
    }

    positionScopeControls(clientX, clientY);
    selectScope(0);
  }

  function moveScope(delta) {
    selectScope(Math.max(0, Math.min(scopePath.length - 1, scopeIndex + delta)));
  }

  function selectScope(index) {
    if (!scopePath[index]) return;
    scopeIndex = index;
    hoveredElement = scopePath[index];
    updateHighlight(hoveredElement);
    updateScopeControls();
  }

  function resetScope() {
    hoveredElement = null;
    scopeAnchor = null;
    scopePath = [];
    scopeIndex = 0;
    updateScopeControls();
  }

  // --- Visuals ---

  function updateHighlight(element) {
    if (!highlightEl) return;
    const rect = element.getBoundingClientRect();
    highlightEl.style.display = 'block';
    highlightEl.style.top = `${rect.top}px`;
    highlightEl.style.left = `${rect.left}px`;
    highlightEl.style.width = `${rect.width}px`;
    highlightEl.style.height = `${rect.height}px`;
  }

  function createScopeControls(root) {
    scopeControlsEl = document.createElement('div');
    scopeControlsEl.className = 'waypoint-scope-controls';
    scopeControlsEl.setAttribute('role', 'group');
    scopeControlsEl.setAttribute('aria-label', 'Adjust selected target');
    scopeControlsEl.innerHTML = `
      <button type="button" data-scope="smaller" aria-label="Select a smaller target">&larr; <span>Smaller</span></button>
      <button type="button" data-scope="larger" aria-label="Select a larger target"><span>Larger</span> &rarr;</button>
    `;
    scopeControlsEl.querySelector('[data-scope="smaller"]').addEventListener('click', () => moveScope(-1));
    scopeControlsEl.querySelector('[data-scope="larger"]').addEventListener('click', () => moveScope(1));
    root.appendChild(scopeControlsEl);
    updateScopeControls();
  }

  function positionScopeControls(clientX, clientY) {
    if (!scopeControlsEl || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    const estimatedWidth = 176;
    const estimatedHeight = 52;
    const gap = 12;
    const left = clientX + gap + estimatedWidth <= window.innerWidth
      ? clientX + gap
      : Math.max(gap, clientX - estimatedWidth - gap);
    const top = clientY + gap + estimatedHeight <= window.innerHeight
      ? clientY + gap
      : Math.max(gap, clientY - estimatedHeight - gap);
    scopeControlsEl.style.left = `${left}px`;
    scopeControlsEl.style.top = `${top}px`;
  }

  function updateScopeControls() {
    if (!scopeControlsEl) return;
    scopeControlsEl.style.display = hoveredElement ? 'flex' : 'none';
    const smaller = scopeControlsEl.querySelector('[data-scope="smaller"]');
    const larger = scopeControlsEl.querySelector('[data-scope="larger"]');
    smaller.disabled = !hoveredElement || scopeIndex === 0;
    larger.disabled = !hoveredElement || scopeIndex >= scopePath.length - 1;
  }

  function showToast(root) {
    toastEl = document.createElement('div');
    toastEl.className = 'waypoint-toast';
    toastEl.innerHTML = `
      <p>Click any element to annotate</p>
      <p class="sub">Use &larr; and &rarr; to adjust the target · ESC to exit</p>
    `;
    root.appendChild(toastEl);

    // Auto-fade after 3s
    setTimeout(() => {
      if (!toastEl) return;
      toastEl.classList.add('waypoint-toast--out');
      setTimeout(() => {
        if (toastEl) { toastEl.remove(); toastEl = null; }
      }, 250);
    }, 3000);
  }

  return { init, start, stop, isActive, tempDisable, reEnable };
})();
