// Logbook Waypoint V2 — Entry Point
// Orchestrates all modules loaded via manifest.json content_scripts
// Modules are loaded in order and share execution context (no build step)
console.log('[Waypoint] content.js loaded');

(async function WaypointAnnotationsV2() {
  'use strict';

  // --- State ---
  let annotations = [];
  let localSaveCount = 0;

  // --- Font injection (on main document — fonts cascade into shadow DOM) ---
  function injectFontFace() {
    if (document.querySelector('[data-waypoint-font]')) return;
    const style = document.createElement('style');
    style.setAttribute('data-waypoint-font', 'true');
    const fontUrl = chrome.runtime.getURL('assets/fonts/InterVariable.woff2');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        src: url('${fontUrl}') format('woff2-variations');
        font-weight: 100 900;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  // --- Initialize all modules ---
  async function init() {
    injectFontFace();

    const overlayClosed = await WaypointAPI.getOverlayHidden();

    // 1. Shadow host + styles
    WaypointShadowHost.init(overlayClosed);

    // 2. Theme
    await WaypointThemeManager.init();

    // 3. Load annotations
    annotations = await WaypointAPI.loadAnnotations();

    // 4. Initialize modules
    WaypointBadgeManager.init();
    WaypointInspectionMode.init();
    WaypointAnnotationPopover.init();
    await WaypointToolbar.init();

    // 5. Set up message listener (popup ↔ content)
    setupMessageListener();

    // 7. Set up storage listener for external changes
    setupStorageListener();

    // 7b. Set up SPA route change detection
    setupRouteChangeDetection();

    // 8. Set up keyboard shortcuts
    setupKeyboardShortcuts();

    // 9. Wire up annotation lifecycle events
    setupAnnotationEvents();

    // 10. Wait for hydration, then show badges (skip if overlay is closed)
    if (!overlayClosed) {
      waitForHydrationAndShowAnnotations();
    }
  }

  // --- Message listener (popup communication) ---
  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'startAnnotationMode':
          WaypointEvents.emit('inspection:start');
          sendResponse({ success: true });
          break;

        case 'stopAnnotationMode':
          WaypointEvents.emit('inspection:stop');
          sendResponse({ success: true });
          break;

        case 'getAnnotationModeStatus':
          sendResponse({ success: true, isAnnotationMode: WaypointInspectionMode.isActive() });
          break;

        case 'toggleOverlay':
          WaypointShadowHost.toggle();
          if (WaypointShadowHost.isVisible()) {
            WaypointEvents.emit('overlay:opened');
          } else {
            WaypointEvents.emit('overlay:closed');
          }
          sendResponse({ success: true, visible: WaypointShadowHost.isVisible() });
          break;

        case 'getOverlayState':
          sendResponse({ success: true, visible: WaypointShadowHost.isVisible() });
          break;

        case 'toggleAnnotate':
          if (WaypointInspectionMode.isActive()) {
            WaypointEvents.emit('inspection:stop');
          } else {
            WaypointEvents.emit('inspection:start');
          }
          sendResponse({ success: true });
          break;

        case 'highlightAnnotation':
          WaypointBadgeManager.highlightElement(request.annotation);
          sendResponse({ success: true });
          break;

        case 'targetAnnotationElement':
          WaypointBadgeManager.targetBadge(request.annotation?.id);
          sendResponse({ success: true });
          break;

        case 'annotationsUpdated':
          // Server sync detected changes (e.g. MCP deletion) — reload from storage
          WaypointAPI.loadAnnotations().then(fresh => {
            annotations = fresh;
            if (WaypointShadowHost.isVisible()) {
              WaypointEvents.emit('annotations:render', annotations);
            }
          });
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
      return true;
    });
  }

  // --- SPA route change detection ---
  function setupRouteChangeDetection() {
    let currentURL = window.location.href;

    function onRouteChange() {
      const newURL = window.location.href;
      if (newURL === currentURL) return;
      currentURL = newURL;
      console.log('[Waypoint] SPA route change detected:', newURL);
      reloadAnnotationsForCurrentRoute();
    }

    // Back/forward navigation
    window.addEventListener('popstate', onRouteChange);

    // Hash-based routers
    window.addEventListener('hashchange', onRouteChange);

    // Poll for URL changes caused by pushState/replaceState.
    // Content scripts run in an isolated world so we can't monkey-patch
    // the page's history object, and inline script injection gets blocked
    // by CSP on many sites. Polling is reliable regardless of CSP or framework.
    setInterval(onRouteChange, 300);
  }

  async function reloadAnnotationsForCurrentRoute() {
    annotations = await WaypointAPI.loadAnnotations();
    badgesShown = false;
    if (WaypointShadowHost.isVisible()) {
      WaypointBadgeManager.clearAll();
      // Immediately update toolbar count so it doesn't show stale numbers
      WaypointEvents.emit('badges:rendered', { count: 0, total: annotations.length });

      // Wait briefly for new route's DOM to render, then show badges
      waitForDOMStability(() => {
        badgesShown = true;
        showAnnotationsWithRetry();
      });
    }
  }

  // --- Storage listener ---
  function setupStorageListener() {
    WaypointAPI.onAnnotationsChanged((allAnnotations) => {
      if (localSaveCount > 0) {
        localSaveCount--;
        return;
      }
      annotations = (allAnnotations || []).filter(a => a.url === window.location.href);
      // Don't re-render if overlay is closed (styles should stay stripped)
      if (WaypointShadowHost.isVisible()) {
        WaypointEvents.emit('annotations:render', annotations);
      }
    });
  }

  // --- Keyboard shortcuts ---
  function setupKeyboardShortcuts() {
    let customShortcut = null;

    // Load custom shortcut from storage
    WaypointAPI.getCustomShortcut().then(s => { customShortcut = s; });

    // Listen for storage changes to update live
    chrome.storage.onChanged.addListener((changes, ns) => {
      if (ns === 'local' && changes.waypointCustomShortcut) {
        customShortcut = changes.waypointCustomShortcut.newValue || null;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (WaypointKeyboardTarget.isEditableEvent(e)) return;

      // ESC — stop annotation mode
      if (e.key === 'Escape' && WaypointInspectionMode.isActive()) {
        WaypointEvents.emit('inspection:stop');
        return;
      }

      // Custom shortcut — toggle annotation mode
      if (customShortcut && matchesShortcut(e, customShortcut)) {
        e.preventDefault();
        if (WaypointInspectionMode.isActive()) {
          WaypointEvents.emit('inspection:stop');
        } else {
          WaypointEvents.emit('inspection:start');
        }
      }
    });
  }

  function matchesShortcut(e, shortcut) {
    return e.key === shortcut.key
      && e.ctrlKey === !!shortcut.ctrlKey
      && e.metaKey === !!shortcut.metaKey
      && e.shiftKey === !!shortcut.shiftKey
      && e.altKey === !!shortcut.altKey;
  }

  // --- Annotation lifecycle ---
  function setupAnnotationEvents() {
    // New annotation saved
    WaypointEvents.on('annotation:saved', ({ annotation, element }) => {
      localSaveCount++;
      // Deduplicate — storage listener may have already added it
      if (!annotations.some(a => a.id === annotation.id)) {
        annotations.push(annotation);
      }
      // Re-render all badges to get consistent numbering
      WaypointEvents.emit('annotations:render', annotations);
    });

    // Annotation updated
    WaypointEvents.on('annotation:updated', ({ id, comment, pending_changes, css }) => {
      localSaveCount++;
      const idx = annotations.findIndex(a => a.id === id);
      if (idx !== -1) {
        const updates = { comment, updated_at: new Date().toISOString() };
        if (pending_changes !== undefined) updates.pending_changes = pending_changes;
        if (css !== undefined) updates.css = css;
        annotations[idx] = { ...annotations[idx], ...updates };
      }
    });

    WaypointEvents.on('annotation:variant-updated', ({ annotation }) => {
      localSaveCount++;
      const index = annotations.findIndex(candidate => candidate.id === annotation.id);
      if (index !== -1) annotations[index] = annotation;
      WaypointEvents.emit('annotations:render', annotations);
    });

    // Annotation deleted
    WaypointEvents.on('annotation:deleted', ({ id }) => {
      localSaveCount++;
      annotations = annotations.filter(a => a.id !== id);
      // Re-render to update numbering
      WaypointEvents.emit('annotations:render', annotations);
    });

    // Overlay closed — strip all visual changes from page
    WaypointEvents.on('overlay:closed', () => {
      WaypointBadgeManager.clearAll(annotations);
    });

    // Overlay opened — re-apply visual changes
    WaypointEvents.on('overlay:opened', () => {
      badgesShown = false;
      showAnnotationsWithRetry();
    });

    // All annotations cleared
    WaypointEvents.on('annotations:cleared', ({ count } = {}) => {
      // Each delete triggers a storage change; suppress all of them
      localSaveCount += count || annotations.length || 1;
      WaypointBadgeManager.clearAll(annotations);
      annotations = [];
      WaypointEvents.emit('badges:rendered', { count: 0, total: 0 });
    });
  }

  // --- Hydration waiting (framework support) ---
  let badgesShown = false;
  function waitForHydrationAndShowAnnotations() {
    const showBadges = () => {
      if (badgesShown) return;
      badgesShown = true;
      showAnnotationsWithRetry();
    };

    if (document.readyState === 'complete') {
      waitForDOMStability(showBadges);
    } else {
      window.addEventListener('load', () => waitForDOMStability(showBadges), { once: true });
    }

    // Fallback
    setTimeout(showBadges, 8000);
  }

  function waitForDOMStability(callback) {
    let stabilityTimer;
    let mutationCount = 0;
    const maxMutations = 10;
    const stabilityDelay = 1500;

    const observer = new MutationObserver(() => {
      mutationCount++;
      clearTimeout(stabilityTimer);
      if (mutationCount > maxMutations) {
        observer.disconnect();
        setTimeout(callback, 500);
        return;
      }
      stabilityTimer = setTimeout(() => { observer.disconnect(); callback(); }, stabilityDelay);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    stabilityTimer = setTimeout(() => { observer.disconnect(); callback(); }, stabilityDelay);
  }

  let lazyObserver = null;
  function showAnnotationsWithRetry(maxAttempts = 5, delay = 500) {
    // Clean up previous lazy observer
    if (lazyObserver) { lazyObserver.disconnect(); lazyObserver = null; }

    const elementAnnotations = annotations.filter(a => a.type !== 'stylesheet');
    let attempts = 0;
    const tryShow = () => {
      attempts++;
      WaypointEvents.emit('annotations:render', annotations);
      const found = WaypointBadgeManager.getCount();
      if (found < elementAnnotations.length && attempts < maxAttempts) {
        setTimeout(tryShow, delay);
      }
      // After retries exhausted, if still missing badges, watch for lazy-loaded content
      if (attempts >= maxAttempts && found < elementAnnotations.length) {
        startLazyElementObserver();
      }
    };
    tryShow();
  }

  // Persistent observer for code-split / lazy-loaded components that arrive late
  function startLazyElementObserver() {
    if (lazyObserver) lazyObserver.disconnect();

    let debounceTimer = null;
    const elementCount = annotations.filter(a => a.type !== 'stylesheet').length;
    lazyObserver = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        WaypointEvents.emit('annotations:render', annotations);
        const found = WaypointBadgeManager.getCount();
        // All badges found — stop watching
        if (found >= elementCount) {
          lazyObserver.disconnect();
          lazyObserver = null;
          console.log('[Waypoint] All badges resolved via lazy observer');
        }
      }, 300);
    });

    lazyObserver.observe(document.body, { childList: true, subtree: true });

    // Safety: stop after 30s to avoid indefinite observation
    setTimeout(() => {
      if (lazyObserver) {
        lazyObserver.disconnect();
        lazyObserver = null;
      }
    }, 30000);
  }

  // --- Boot ---
  function safeBoot() {
    init().catch(err => console.error('[Waypoint] Init failed:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeBoot);
  } else {
    safeBoot();
  }
})();
