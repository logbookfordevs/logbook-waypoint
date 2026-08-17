// Creates and manages the shadow DOM host for all Waypoint UI

var WaypointShadowHost = (() => {
  let hostEl = null;
  let shadowRoot = null;
  let hidden = false;
  let visibilityAnimation = null;

  function init(initiallyHidden = false) {
    if (hostEl) return shadowRoot;

    hidden = initiallyHidden;

    hostEl = document.createElement('div');
    hostEl.id = 'logbook-waypoint-root';
    hostEl.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      pointer-events: none !important;
      z-index: 2147483647 !important;
      overflow: visible !important;
    `;

    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    // Inject styles synchronously
    const styleEl = document.createElement('style');
    styleEl.textContent = WAYPOINT_STYLES;
    shadowRoot.appendChild(styleEl);

    if (hidden) hostEl.style.display = 'none';

    document.body.appendChild(hostEl);

    // Contain composed events at shadow boundary — prevents frameworks
    // from interpreting shadow DOM interactions as "outside clicks"
    for (const type of ['pointerdown', 'mousedown', 'click', 'focusin', 'focusout']) {
      hostEl.addEventListener(type, (e) => e.stopPropagation());
    }

    return shadowRoot;
  }

  function getRoot() {
    return shadowRoot;
  }

  function getHost() {
    return hostEl;
  }

  function destroy() {
    if (hostEl && hostEl.parentNode) {
      hostEl.parentNode.removeChild(hostEl);
    }
    hostEl = null;
    shadowRoot = null;
  }

  function animateToolbar(opening) {
    const toolbar = shadowRoot?.querySelector('.waypoint-toolbar');
    if (!toolbar?.animate) return null;

    visibilityAnimation?.cancel();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const visible = reducedMotion
      ? { opacity: 1 }
      : { opacity: 1, transform: 'translateY(0) scale(1)' };
    const tucked = reducedMotion
      ? { opacity: 0 }
      : { opacity: 0, transform: 'translateY(-6px) scale(0.96)' };

    visibilityAnimation = toolbar.animate(
      opening ? [tucked, visible] : [visible, tucked],
      {
        duration: reducedMotion ? 120 : 180,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        fill: 'both',
      },
    );
    return visibilityAnimation;
  }

  function hide() {
    if (!hostEl || hidden) return;
    hidden = true;
    const animation = animateToolbar(false);
    if (animation) {
      animation.finished.catch(() => {}).then(() => {
        if (hidden && hostEl) hostEl.style.display = 'none';
      });
    } else {
      hostEl.style.display = 'none';
    }
    WaypointAPI.saveOverlayHidden(true);
  }

  function show() {
    if (!hostEl || !hidden) return;
    hidden = false;
    hostEl.style.display = '';
    animateToolbar(true);
    WaypointAPI.saveOverlayHidden(false);
  }

  function isVisible() {
    return Boolean(hostEl && !hidden);
  }

  function toggle() {
    if (isVisible()) { hide(); } else { show(); }
  }

  return { init, getRoot, getHost, destroy, hide, show, isVisible, toggle };
})();
