// Floating navigation toolbar — always visible, bottom-right by default
// Draggable, collapsible, position persisted to storage
// Settings dropdown with theme toggle, MCP status, clear-on-copy

var WaypointToolbar = (() => {
  let toolbarEl = null;
  let settingsDropdown = null;
  let activeRecordingCleanup = null;
  let isAnnotating = false;
  let isCollapsed = false;
  let serverOnline = false;
  let serverCompatibilityMessage = null;
  let annotationCount = 0;
  let styleAnnotationCount = 0;
  let clearOnCopy = false;
  let screenshotEnabled = true;
  let showDesignActions = true;
  let badgeColor = '#4b5563';

  const BADGE_COLORS = ['#4b5563', '#d97757', '#3b82f6', '#22c55e', '#a855f7'];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const defaultShortcutHint = isMac ? '\u2318\u21E7,' : 'Ctrl+Shift+,';
  let shortcutHint = defaultShortcutHint;
  let collapseShortcutHint = '';
  let settingsShortcutHint = '';
  let customShortcut = null;

  const ICONS = {
    annotate: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    stop: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
    copy: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    queue: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
    trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>',
    settings: '',
    collapse: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    collapsed: '',
    eyeOff: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>',
    power: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
    // Theme icons
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    system: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    // Links
    github: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',
    server: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    camera: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    keyboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>',
    newspaper: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>',
    palette: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.3-.3-.4-.7-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/></svg>',
    rocket: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    clipboard: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    chevronRight: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    webpage: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
    globe: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    robot: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
    book: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>'
  };

  const THEME_ICONS = { light: ICONS.sun, dark: ICONS.moon, system: ICONS.system };
  const THEME_CYCLE = ['light', 'dark', 'system'];

  async function init() {
    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    isCollapsed = await WaypointAPI.getToolbarCollapsed();
    clearOnCopy = await WaypointAPI.getClearOnCopy();
    screenshotEnabled = await WaypointAPI.getScreenshotEnabled();
    showDesignActions = await WaypointAPI.getShowDesignActions();
    badgeColor = await WaypointAPI.getBadgeColor();
    applyBadgeColor(badgeColor);
    const [savedShortcut, commandShortcuts] = await Promise.all([
      WaypointAPI.getCustomShortcut(),
      WaypointAPI.getCommandShortcuts(),
    ]);
    customShortcut = savedShortcut;
    if (customShortcut) shortcutHint = formatShortcut(customShortcut);
    collapseShortcutHint = formatBrowserShortcut(commandShortcuts['toggle-toolbar-collapse']);
    settingsShortcutHint = formatBrowserShortcut(commandShortcuts['toggle-toolbar-settings']);
    await refreshServerStatus();

    buildToolbar(root);
    await restorePosition();

    // Listen for events
    WaypointEvents.on('inspection:started', () => { isAnnotating = true; updateUI(); });
    WaypointEvents.on('inspection:stopped', () => { isAnnotating = false; updateUI(); });
    WaypointEvents.on('badges:rendered', ({ total, styleCount }) => {
      styleAnnotationCount = styleCount || 0;
      annotationCount = Math.max(0, (total || 0) - styleAnnotationCount);
      updateUI();
    });
    WaypointEvents.on('annotations:cleared', () => { annotationCount = 0; styleAnnotationCount = 0; updateUI(); });

    // Periodic server status check
    setInterval(refreshServerStatus, 10000);
  }

  function buildToolbar(root) {
    const collapsedUrl = chrome.runtime.getURL('assets/thelu/thelu-waypoint-collapsed.png');
    const settingsUrl = chrome.runtime.getURL('assets/thelu/thelu-settings.png');
    ICONS.collapsed = `<img class="waypoint-collapsed-icon" src="${collapsedUrl}" alt="">`;
    ICONS.settings = `<img class="waypoint-branded-settings-icon" src="${settingsUrl}" alt="">`;

    toolbarEl = document.createElement('div');
    toolbarEl.className = 'waypoint-toolbar' + (isCollapsed ? ' collapsed' : '');

    toolbarEl.innerHTML = `
      <button class="waypoint-toolbar-btn waypoint-tb-collapse" title="${commandLabel(isCollapsed ? 'Expand' : 'Collapse', collapseShortcutHint)}">
        ${isCollapsed ? ICONS.collapsed : ICONS.collapse}
        <span class="waypoint-toolbar-tip">${commandLabel(isCollapsed ? 'Expand' : 'Collapse', collapseShortcutHint)}</span>
      </button>
      <div class="waypoint-toolbar-inner">
        <div class="waypoint-toolbar-divider"></div>
        <button class="waypoint-toolbar-btn waypoint-tb-annotate" title="Annotate (${shortcutHint})">
          ${ICONS.annotate}
          <span class="waypoint-toolbar-tip">Annotate</span>
        </button>
        <button class="waypoint-toolbar-btn waypoint-tb-copy" title="Copy all annotations" disabled>
          ${ICONS.copy}
          <span class="waypoint-toolbar-tip">Copy all</span>
        </button>
        <button class="waypoint-toolbar-btn waypoint-tb-queue" title="Open Queue">
          ${ICONS.queue}
          <span class="waypoint-toolbar-tip">Queue</span>
        </button>
        <button class="waypoint-toolbar-btn waypoint-tb-delete" title="Delete all annotations" disabled>
          ${ICONS.trash}
          <span class="waypoint-toolbar-tip">Delete all</span>
        </button>
        <div class="waypoint-toolbar-drag-handle" title="Drag to move"></div>
        <button class="waypoint-toolbar-btn waypoint-tb-settings" title="${commandLabel('Settings', settingsShortcutHint)}">
          ${ICONS.settings}
          <span class="waypoint-toolbar-tip">${commandLabel('Settings', settingsShortcutHint)}</span>
        </button>
      </div>
    `;

    root.appendChild(toolbarEl);
    wireButtons();
    setupDrag();
    updateUI();
  }

  function wireButtons() {
    // Collapse/expand
    toolbarEl.querySelector('.waypoint-tb-collapse').addEventListener('click', toggleCollapse);

    // Annotate toggle
    toolbarEl.querySelector('.waypoint-tb-annotate').addEventListener('click', () => {
      if (isAnnotating) {
        WaypointEvents.emit('inspection:stop');
      } else {
        WaypointEvents.emit('inspection:start');
      }
    });

    // Copy all
    toolbarEl.querySelector('.waypoint-tb-copy').addEventListener('click', async () => {
      const annotations = await WaypointAPI.loadAnnotations();
      if (!annotations.length) return;
      await copyAnnotations(annotations);

      // Clear on copy if setting is enabled
      if (clearOnCopy) {
        // Reset count immediately so UI stays consistent
        annotationCount = 0;
        styleAnnotationCount = 0;
        WaypointEvents.emit('annotations:cleared', { count: annotations.length });
        await WaypointAPI.deleteAnnotationsByUrl();
      }
    });

    toolbarEl.querySelector('.waypoint-tb-queue').addEventListener('click', (event) => {
      event.stopPropagation();
      closeSettings();
      WaypointQueuePanel.toggle(toolbarEl, {
        copy: copyAnnotations,
        delete: deleteAnnotation,
        discard: discardAnnotations,
        navigate: annotation => { window.location.href = annotation.url; },
        open: openAnnotation,
      });
    });

    // Delete all
    toolbarEl.querySelector('.waypoint-tb-delete').addEventListener('click', async () => {
      const root = WaypointShadowHost.getRoot();
      if (!root) return;

      const skip = await WaypointAPI.getSkipDeleteConfirm();
      if (!skip) {
        const confirmed = await showDeleteConfirm(root);
        if (!confirmed) return;
      }

      const annotations = await WaypointAPI.loadAnnotations();
      annotationCount = 0;
      styleAnnotationCount = 0;
      WaypointEvents.emit('annotations:cleared', { count: annotations.length });
      await WaypointAPI.deleteAnnotationsByUrl();
    });

    // Settings
    toolbarEl.querySelector('.waypoint-tb-settings').addEventListener('click', (e) => {
      e.stopPropagation();
      WaypointQueuePanel.close();
      toggleSettings();
    });
  }

  // --- Settings dropdown ---

  function toggleSettings() {
    if (settingsDropdown) {
      closeSettings();
    } else {
      openSettings();
    }
  }

  function openSettings() {
    closeSettings();

    const version = chrome.runtime.getManifest().version;
    const currentTheme = WaypointThemeManager.getPreference();
    const themeIcon = THEME_ICONS[currentTheme] || THEME_ICONS.system;
    const route = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    settingsDropdown = document.createElement('div');
    const rect = toolbarEl.getBoundingClientRect();
    const inLowerHalf = rect.top > window.innerHeight / 2;
    settingsDropdown.className = 'waypoint-settings-dropdown' + (inLowerHalf ? ' above' : '');

    settingsDropdown.innerHTML = `
      <div class="waypoint-settings-header">
        <div>
          <span class="waypoint-settings-title">${escapeHTML(route)}</span>
          <span class="waypoint-settings-version">v${escapeHTML(version)}</span>
        </div>
        <div class="waypoint-settings-header-right">
          <button class="waypoint-theme-btn" title="${capitalize(currentTheme)} theme">
            ${themeIcon}
          </button>
        </div>
      </div>
      <div class="waypoint-settings-body">
        <button class="waypoint-settings-link waypoint-get-started-btn" type="button">
          ${ICONS.book}
          <span>Documentation</span>
          <span style="margin-left:auto;color:var(--waypoint-text-secondary);">${ICONS.chevronRight}</span>
        </button>
        <div class="waypoint-settings-separator"></div>
        <div class="waypoint-settings-item">
          <div class="waypoint-settings-item-left">
            ${ICONS.server}
            <span>MCP Server</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="waypoint-status-dot ${serverOnline ? 'online' : 'offline'}"></span>
            <span class="waypoint-server-status-text" style="font-size:12px;color:var(--waypoint-text-secondary);">${escapeHTML(serverCompatibilityMessage || (serverOnline ? 'Connected' : 'Offline'))}</span>
          </div>
        </div>
        <div class="waypoint-settings-item waypoint-site-permission">
          <div class="waypoint-settings-item-left">
            ${ICONS.globe}
            <div>
              <span>Site access</span>
              <div class="waypoint-setting-description">Enable annotation access for this site</div>
            </div>
          </div>
          <button class="waypoint-btn waypoint-btn-secondary waypoint-site-permission-btn" type="button">Enable</button>
        </div>
        <p class="waypoint-site-permission-status" aria-live="polite"></p>
        <div class="waypoint-settings-separator"></div>
        <div class="waypoint-settings-item">
          <div class="waypoint-settings-item-left">
            ${ICONS.palette}
            <span>Pin color</span>
          </div>
          <div class="waypoint-color-picker" style="display:flex;gap:6px;">
            ${BADGE_COLORS.map(c => `<button class="waypoint-color-dot${c === badgeColor ? ' active' : ''}" data-color="${c}" style="background:${c};" type="button"></button>`).join('')}
          </div>
        </div>
        <div class="waypoint-settings-item">
          <div class="waypoint-settings-item-left">
            ${ICONS.copy}
            <span>Clear after copy</span>
          </div>
          <button class="waypoint-toggle waypoint-clear-on-copy-toggle ${clearOnCopy ? 'on' : ''}" type="button"></button>
        </div>
        <div class="waypoint-settings-item">
          <div class="waypoint-settings-item-left">
            ${ICONS.camera}
            <div>
              <span>Screenshots</span>
              <div style="font-size:11px;color:var(--waypoint-text-secondary);margin-top:1px;">Automatically capture the selected Target for MCP context. Manual reference images stay available.</div>
            </div>
          </div>
          <button class="waypoint-toggle waypoint-screenshot-toggle ${screenshotEnabled ? 'on' : ''}" type="button"></button>
        </div>
        <div class="waypoint-settings-item">
          <div class="waypoint-settings-item-left">
            ${ICONS.palette}
            <div>
              <span>Show Design Actions</span>
              <div class="waypoint-setting-description">Show Impeccable-powered controls for new Annotations. Saved Design Intent stays visible.</div>
              <a href="https://github.com/pbakaus/impeccable" target="_blank" rel="noopener" class="waypoint-setting-help">Requires Impeccable</a>
            </div>
          </div>
          <button class="waypoint-toggle waypoint-design-actions-toggle ${showDesignActions ? 'on' : ''}" type="button" aria-label="Show Design Actions" aria-pressed="${showDesignActions}"></button>
        </div>
        <div class="waypoint-settings-item">
          <div class="waypoint-settings-item-left">
            ${ICONS.keyboard}
            <span>Trigger hotkey</span>
          </div>
          <button class="waypoint-shortcut-btn" type="button">${escapeHTML(shortcutHint)}</button>
        </div>
        <div class="waypoint-settings-separator"></div>
        <button class="waypoint-settings-link waypoint-export-btn" type="button">
          ${ICONS.upload}
          <span>Export annotations</span>
        </button>
        <button class="waypoint-settings-link waypoint-import-btn" type="button">
          ${ICONS.download}
          <span>Import annotations</span>
        </button>
        <div class="waypoint-settings-separator"></div>
        <button class="waypoint-settings-link waypoint-close-overlay" type="button">
          ${ICONS.power}
          <span>Close Logbook Waypoint</span>
        </button>
      </div>
    `;

    toolbarEl.appendChild(settingsDropdown);

    // Theme toggle
    settingsDropdown.querySelector('.waypoint-theme-btn').addEventListener('click', () => {
      const current = WaypointThemeManager.getPreference();
      const idx = THEME_CYCLE.indexOf(current);
      const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
      WaypointThemeManager.setPreference(next);

      // Update icon
      const btn = settingsDropdown.querySelector('.waypoint-theme-btn');
      btn.innerHTML = THEME_ICONS[next];
      btn.title = `${capitalize(next)} theme`;
    });

    // Clear on copy toggle
    settingsDropdown.querySelector('.waypoint-clear-on-copy-toggle').addEventListener('click', async (e) => {
      clearOnCopy = !clearOnCopy;
      e.currentTarget.classList.toggle('on', clearOnCopy);
      await WaypointAPI.saveClearOnCopy(clearOnCopy);
    });

    // Screenshot toggle
    settingsDropdown.querySelector('.waypoint-screenshot-toggle').addEventListener('click', async (e) => {
      screenshotEnabled = !screenshotEnabled;
      e.currentTarget.classList.toggle('on', screenshotEnabled);
      await WaypointAPI.saveScreenshotEnabled(screenshotEnabled);
    });

    settingsDropdown.querySelector('.waypoint-design-actions-toggle').addEventListener('click', async (e) => {
      showDesignActions = !showDesignActions;
      e.currentTarget.classList.toggle('on', showDesignActions);
      e.currentTarget.setAttribute('aria-pressed', String(showDesignActions));
      await WaypointAPI.saveShowDesignActions(showDesignActions);
    });

    const permissionButton = settingsDropdown.querySelector('.waypoint-site-permission-btn');
    const permissionStatus = settingsDropdown.querySelector('.waypoint-site-permission-status');
    permissionButton.addEventListener('click', async () => {
      permissionButton.disabled = true;
      permissionStatus.textContent = 'Requesting site access…';
      try {
        const granted = await WaypointAPI.requestOptionalSitePermission();
        if (granted) {
          permissionButton.textContent = 'Enabled';
          permissionStatus.textContent = 'Site access enabled. Refresh this page to start annotating.';
        } else {
          permissionButton.disabled = false;
          permissionStatus.textContent = 'Site access was not granted.';
        }
      } catch {
        permissionButton.disabled = false;
        permissionStatus.textContent = 'Could not request site access. Try again from the extension popup.';
      }
    });

    // Shortcut key recorder
    const shortcutBtn = settingsDropdown.querySelector('.waypoint-shortcut-btn');
    let recording = false;
    shortcutBtn.addEventListener('click', () => {
      if (recording) {
        // Cancel recording
        recording = false;
        shortcutBtn.textContent = shortcutHint;
        shortcutBtn.classList.remove('recording');
        return;
      }
      recording = true;
      shortcutBtn.textContent = 'Press keys\u2026';
      shortcutBtn.classList.add('recording');

      function onKey(e) {
        // Ignore lone modifier keys
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();

        const sc = {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey
        };

        customShortcut = sc;
        shortcutHint = formatShortcut(sc);
        shortcutBtn.textContent = shortcutHint;
        shortcutBtn.classList.remove('recording');
        recording = false;
        document.removeEventListener('keydown', onKey, true);
        activeRecordingCleanup = null;
        WaypointAPI.saveCustomShortcut(sc);
      }

      document.addEventListener('keydown', onKey, true);
      activeRecordingCleanup = () => document.removeEventListener('keydown', onKey, true);
    });

    // Badge color picker
    settingsDropdown.querySelectorAll('.waypoint-color-dot').forEach(dot => {
      dot.addEventListener('click', async () => {
        badgeColor = dot.dataset.color;
        settingsDropdown.querySelectorAll('.waypoint-color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        applyBadgeColor(badgeColor);
        await WaypointAPI.saveBadgeColor(badgeColor);
      });
    });

    // Documentation
    settingsDropdown.querySelector('.waypoint-get-started-btn').addEventListener('click', () => {
      showDocumentation();
    });

    // Export
    settingsDropdown.querySelector('.waypoint-export-btn').addEventListener('click', () => {
      closeSettings();
      showExportModal();
    });

    // Import
    settingsDropdown.querySelector('.waypoint-import-btn').addEventListener('click', () => {
      closeSettings();
      triggerImport();
    });

    // Close overlay — strip all visual changes from page
    settingsDropdown.querySelector('.waypoint-close-overlay').addEventListener('click', () => {
      closeSettings();
      WaypointEvents.emit('overlay:closed');
      WaypointShadowHost.hide();
    });

    // Prevent clicks inside dropdown from triggering outside-click close
    settingsDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close on outside click (next tick to avoid immediate close)
    setTimeout(() => {
      document.addEventListener('click', onOutsideClick);
    }, 0);
  }

  function showDocumentation() {
    if (!settingsDropdown) return;
    const header = settingsDropdown.querySelector('.waypoint-settings-header');
    const body = settingsDropdown.querySelector('.waypoint-settings-body');
    if (!header || !body) return;

    const version = chrome.runtime.getManifest().version;

    // Replace header with back navigation
    header.innerHTML = `
      <button class="waypoint-guide-back-btn" type="button" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--waypoint-text-secondary);font-family:var(--waypoint-font);font-size:13px;padding:0;">
        ${ICONS.back}
        <span style="color:var(--waypoint-text-primary);font-weight:600;">Documentation</span>
      </button>
    `;

    // Replace body with documentation links
    body.innerHTML = `
      <button class="waypoint-settings-link waypoint-get-started-guide-btn" type="button">
        ${ICONS.rocket}
        <span>Get started</span>
        <span style="margin-left:auto;color:var(--waypoint-text-secondary);">${ICONS.chevronRight}</span>
      </button>
      <div class="waypoint-settings-separator"></div>
      <button class="waypoint-settings-link waypoint-workflow-btn" data-workflow="single-page" type="button">
        ${ICONS.webpage}
        <span>Editing a single page</span>
        <span style="margin-left:auto;color:var(--waypoint-text-secondary);">${ICONS.chevronRight}</span>
      </button>
      <button class="waypoint-settings-link waypoint-workflow-btn" data-workflow="multi-page" type="button">
        ${ICONS.globe}
        <span>Editing multiple pages</span>
        <span style="margin-left:auto;color:var(--waypoint-text-secondary);">${ICONS.chevronRight}</span>
      </button>
      <button class="waypoint-settings-link waypoint-workflow-btn" data-workflow="collaborate" type="button">
        ${ICONS.users}
        <span>Collaborating</span>
        <span style="margin-left:auto;color:var(--waypoint-text-secondary);">${ICONS.chevronRight}</span>
      </button>
      <div class="waypoint-settings-separator"></div>
      <a href="https://github.com/logbookfordevs/logbook-waypoint" target="_blank" rel="noopener" class="waypoint-settings-link">
        ${ICONS.github}
        <span>Contribute to Logbook Waypoint</span>
      </a>
    `;

    // Back button — restores full settings
    header.querySelector('.waypoint-guide-back-btn').addEventListener('click', () => {
      closeSettings();
      openSettings();
    });

    // Get started guide
    body.querySelector('.waypoint-get-started-guide-btn').addEventListener('click', () => showGetStartedGuide());

    // Workflow navigation buttons
    body.querySelectorAll('.waypoint-workflow-btn').forEach(btn => {
      btn.addEventListener('click', () => showWorkflow(btn.dataset.workflow));
    });
  }

  function showGetStartedGuide() {
    if (!settingsDropdown) return;
    const header = settingsDropdown.querySelector('.waypoint-settings-header');
    const body = settingsDropdown.querySelector('.waypoint-settings-body');
    if (!header || !body) return;

    header.innerHTML = `
      <button class="waypoint-guide-back-btn" type="button" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--waypoint-text-secondary);font-family:var(--waypoint-font);font-size:13px;padding:0;">
        ${ICONS.back}
        <span style="color:var(--waypoint-text-primary);font-weight:600;">Get started</span>
      </button>
    `;

    const agentSetup = globalThis.WaypointAgentSetup;
    body.innerHTML = `
      <div class="waypoint-guide">
        <div class="waypoint-guide-section">
          <div class="waypoint-guide-label">1. Start annotating</div>
          <p class="waypoint-guide-text">Click the <strong>pencil button</strong> or your configured hotkey to enter inspection mode. Click any element to add a comment or modify its design.</p>
        </div>

        <div class="waypoint-guide-section">
          <div class="waypoint-guide-label">2. Send to your agent</div>
          <p class="waypoint-guide-text">Hit <strong>Copy</strong> in the toolbar and paste into any AI chat, or <strong>Export</strong> to share a file. No server needed.</p>
        </div>

        <div class="waypoint-guide-section">
          <div class="waypoint-guide-label">3. Install MCP server <span style="font-weight:400;color:var(--waypoint-text-secondary);">(optional)</span></div>
          <p class="waypoint-guide-text">Let your coding agent fetch and resolve annotations automatically.</p>
          <div class="waypoint-guide-cmd" data-cmd="pnpm add --global @logbookfordevs/waypoint">
            <code>pnpm add --global @logbookfordevs/waypoint</code>
            <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
          </div>
          <div class="waypoint-guide-cmd" data-cmd="waypoint start">
            <code>waypoint start</code>
            <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
          </div>
          <p class="waypoint-guide-text" style="margin-top:8px;">Then connect your agent:</p>
          <div class="waypoint-guide-tabs">
            <button class="waypoint-guide-tab active" data-tab="claude">Claude Code</button>
            <button class="waypoint-guide-tab" data-tab="cursor">Cursor</button>
            <button class="waypoint-guide-tab" data-tab="windsurf">Windsurf</button>
            <button class="waypoint-guide-tab" data-tab="codex">Codex</button>
            <button class="waypoint-guide-tab" data-tab="pi">Pi</button>
            <button class="waypoint-guide-tab" data-tab="opencode">OpenCode</button>
          </div>
          <div class="waypoint-guide-panel active" data-panel="claude">
            <div class="waypoint-guide-cmd" data-cmd="claude mcp add --transport http logbook-waypoint http://127.0.0.1:3846/mcp">
              <code>claude mcp add --transport http logbook-waypoint http://127.0.0.1:3846/mcp</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
          <div class="waypoint-guide-panel" data-panel="cursor">
            <p class="waypoint-guide-text">Add to <strong>.cursor/mcp.json</strong>:</p>
            <div class="waypoint-guide-cmd" data-cmd='{"mcpServers":{"logbook-waypoint":{"url":"http://127.0.0.1:3846/mcp"}}}'>
              <code>{"mcpServers":{"logbook-waypoint":{"url":"http://127.0.0.1:3846/mcp"}}}</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
          <div class="waypoint-guide-panel" data-panel="windsurf">
            <p class="waypoint-guide-text">Add to Windsurf MCP settings:</p>
            <div class="waypoint-guide-cmd" data-cmd='{"mcpServers":{"logbook-waypoint":{"serverUrl":"http://127.0.0.1:3846/mcp"}}}'>
              <code>{"mcpServers":{"logbook-waypoint":{"serverUrl":"http://127.0.0.1:3846/mcp"}}}</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
          <div class="waypoint-guide-panel" data-panel="codex">
            <p class="waypoint-guide-text">${agentSetup.codex.introduction} <strong>${agentSetup.codex.path}</strong>:</p>
            <div class="waypoint-guide-cmd" data-cmd="${encodeURIComponent(agentSetup.codex.command)}">
              <code>${agentSetup.codex.display}</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
          <div class="waypoint-guide-panel" data-panel="pi">
            <p class="waypoint-guide-text">${agentSetup.pi.introduction} <strong>${agentSetup.pi.path}</strong>:</p>
            <div class="waypoint-guide-cmd" data-cmd="${encodeURIComponent(agentSetup.pi.command)}">
              <code>${agentSetup.pi.display}</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
          <div class="waypoint-guide-panel" data-panel="opencode">
            <p class="waypoint-guide-text">${agentSetup.opencode.introduction} <strong>${agentSetup.opencode.path}</strong>:</p>
            <div class="waypoint-guide-cmd" data-cmd="${encodeURIComponent(agentSetup.opencode.command)}">
              <code>${agentSetup.opencode.display}</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Back → return to Documentation
    header.querySelector('.waypoint-guide-back-btn').addEventListener('click', () => showDocumentation());

    // Tab switching
    body.querySelectorAll('.waypoint-guide-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        body.querySelectorAll('.waypoint-guide-tab').forEach(t => t.classList.remove('active'));
        body.querySelectorAll('.waypoint-guide-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        body.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('active');
      });
    });

    // Copy buttons
    body.querySelectorAll('.waypoint-guide-copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const encodedCommand = btn.closest('.waypoint-guide-cmd').dataset.cmd;
        const cmd = encodedCommand.includes('%') ? decodeURIComponent(encodedCommand) : encodedCommand;
        await navigator.clipboard.writeText(cmd);
        btn.innerHTML = ICONS.check;
        setTimeout(() => { btn.innerHTML = ICONS.clipboard; }, 1500);
      });
    });
  }

  function showWorkflow(type) {
    if (!settingsDropdown) return;
    const header = settingsDropdown.querySelector('.waypoint-settings-header');
    const body = settingsDropdown.querySelector('.waypoint-settings-body');
    if (!header || !body) return;

    const workflows = {
      'single-page': {
        title: 'Editing a single page',
        content: `
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Best for quick edits</div>
            <p class="waypoint-guide-text">For a few annotations on one page, <strong>copy & paste</strong> is the fastest option. No server, no setup.</p>
          </div>
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Workflow</div>
            <p class="waypoint-guide-text">1. Annotate elements on the page (comments, CSS tweaks, text changes)</p>
            <p class="waypoint-guide-text">2. Click <strong>Copy</strong> in the toolbar</p>
            <p class="waypoint-guide-text">3. Paste into any AI chat (Claude, ChatGPT, Cursor...) and ask the agent to implement the changes</p>
          </div>
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Tips</div>
            <p class="waypoint-guide-text">Enable <strong>Clear on copy</strong> in settings to auto-delete annotations after copying. Keeps things clean between iterations.</p>
            <p class="waypoint-guide-text">Each annotation includes the selector, your comment, element context, and any pending changes. The agent gets everything it needs to locate and edit the right code.</p>
          </div>
        `
      },
      'multi-page': {
        title: 'Editing multiple pages',
        content: `
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Best for cross-page changes</div>
            <p class="waypoint-guide-text">When you're annotating across multiple routes, the <strong>MCP server</strong> is preferable. Your coding agent can read and resolve annotations from all pages at once, without manual copy-paste per route.</p>
          </div>
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Setup</div>
            <div class="waypoint-guide-cmd" data-cmd="pnpm add --global @logbookfordevs/waypoint">
              <code>pnpm add --global @logbookfordevs/waypoint</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
            <div class="waypoint-guide-cmd" data-cmd="waypoint start">
              <code>waypoint start</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
            <p class="waypoint-guide-text" style="margin-top:8px;">Then connect your agent (e.g. Claude Code):</p>
            <div class="waypoint-guide-cmd" data-cmd="claude mcp add --transport http logbook-waypoint http://127.0.0.1:3846/mcp">
              <code>claude mcp add --transport http logbook-waypoint http://127.0.0.1:3846/mcp</code>
              <button class="waypoint-guide-copy" type="button">${ICONS.clipboard}</button>
            </div>
          </div>
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Workflow</div>
            <p class="waypoint-guide-text">1. Navigate your app and annotate elements across as many routes as needed</p>
            <p class="waypoint-guide-text">2. Tell your agent: <em>"read Logbook Waypoint annotations and implement the changes"</em></p>
            <p class="waypoint-guide-text">3. The agent pulls pending annotations via MCP, edits your source files, then resolves each completed annotation as retained history</p>
          </div>
        `
      },
      collaborate: {
        title: 'Collaborating with annotations',
        content: `
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Annotations as a feedback tool</div>
            <p class="waypoint-guide-text">Anyone can annotate a website: add comments, tweak styles, edit text. Then <strong>export</strong> the annotations as a .json file and share it with a teammate.</p>
          </div>
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Workflow</div>
            <p class="waypoint-guide-text">1. A reviewer annotates the live site (staging, production, or localhost)</p>
            <p class="waypoint-guide-text">2. They click <strong>Export</strong> and share the .json file (Slack, email, etc.)</p>
            <p class="waypoint-guide-text">3. A developer clicks <strong>Import</strong> on their localhost. Annotations, badges, and style previews appear instantly.</p>
            <p class="waypoint-guide-text">4. The developer copies or uses MCP to send the annotations to their coding agent</p>
          </div>
          <div class="waypoint-guide-section">
            <div class="waypoint-guide-label">Cross-origin remap</div>
            <p class="waypoint-guide-text">Importing annotations from a public URL into localhost? The extension offers to <strong>remap URLs</strong> automatically so annotations anchor to your local dev server.</p>
          </div>
        `
      }
    };

    const wf = workflows[type];
    if (!wf) return;

    header.innerHTML = `
      <button class="waypoint-guide-back-btn" type="button" style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;color:var(--waypoint-text-secondary);font-family:var(--waypoint-font);font-size:13px;padding:0;">
        ${ICONS.back}
        <span style="color:var(--waypoint-text-primary);font-weight:600;">${wf.title}</span>
      </button>
    `;

    body.innerHTML = `<div class="waypoint-guide">${wf.content}</div>`;

    // Back → return to Documentation
    header.querySelector('.waypoint-guide-back-btn').addEventListener('click', () => showDocumentation());

    // Copy buttons (for MCP workflow)
    body.querySelectorAll('.waypoint-guide-copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cmd = btn.closest('.waypoint-guide-cmd').dataset.cmd;
        await navigator.clipboard.writeText(cmd);
        btn.innerHTML = ICONS.check;
        setTimeout(() => { btn.innerHTML = ICONS.clipboard; }, 1500);
      });
    });
  }

  function closeSettings() {
    if (activeRecordingCleanup) { activeRecordingCleanup(); activeRecordingCleanup = null; }
    if (settingsDropdown) {
      settingsDropdown.remove();
      settingsDropdown = null;
    }
    document.removeEventListener('click', onOutsideClick);
  }

  function onOutsideClick(e) {
    if (settingsDropdown && !settingsDropdown.contains(e.target) && !e.target.closest('.waypoint-tb-settings')) {
      closeSettings();
    }
  }

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
    toolbarEl.classList.toggle('collapsed', isCollapsed);
    closeSettings();
    WaypointQueuePanel.close();

    const btn = toolbarEl.querySelector('.waypoint-tb-collapse');
    const collapseLabel = commandLabel(isCollapsed ? 'Expand' : 'Collapse', collapseShortcutHint);
    btn.innerHTML = (isCollapsed ? ICONS.collapsed : ICONS.collapse) +
      `<span class="waypoint-toolbar-tip">${collapseLabel}</span>`;
    btn.title = collapseLabel;

    WaypointAPI.saveToolbarCollapsed(isCollapsed);
  }

  function toggleSettingsFromCommand() {
    if (!toolbarEl) return;
    if (isCollapsed) toggleCollapse();
    toggleSettings();
  }

  function updateUI() {
    if (!toolbarEl) return;

    // Annotate button active state
    const annotateBtn = toolbarEl.querySelector('.waypoint-tb-annotate');
    if (annotateBtn) {
      annotateBtn.classList.toggle('active', isAnnotating);
      annotateBtn.innerHTML = (isAnnotating ? ICONS.stop : ICONS.annotate) +
        `<span class="waypoint-toolbar-tip">${isAnnotating ? 'Stop' : 'Annotate'} (${shortcutHint})</span>`;
    }

    // Enable/disable copy + delete, badge on copy
    const totalCount = annotationCount + styleAnnotationCount;
    const copyBtn = toolbarEl.querySelector('.waypoint-tb-copy');
    const deleteBtn = toolbarEl.querySelector('.waypoint-tb-delete');
    if (copyBtn) {
      copyBtn.disabled = totalCount === 0;
      copyBtn.innerHTML = ICONS.copy +
        (annotationCount > 0 ? `<span class="waypoint-toolbar-count">${annotationCount}</span>` : '') +
        (styleAnnotationCount > 0 ? `<span class="waypoint-toolbar-style-count">${styleAnnotationCount}</span>` : '') +
        '<span class="waypoint-toolbar-tip">Copy all</span>';
    }
    if (deleteBtn) deleteBtn.disabled = totalCount === 0;
  }

  async function refreshServerStatus() {
    const status = await WaypointAPI.checkServerStatus();
    const changed = serverOnline !== status.connected || serverCompatibilityMessage !== status.compatibility_message;
    serverOnline = status.connected;
    serverCompatibilityMessage = status.compatibility_message || null;
    if (changed) {
      updateUI();
      // Update settings dropdown if open
      if (settingsDropdown) {
        const dot = settingsDropdown.querySelector('.waypoint-status-dot');
        if (dot) dot.className = `waypoint-status-dot ${serverOnline ? 'online' : 'offline'}`;
        const text = settingsDropdown.querySelector('.waypoint-server-status-text');
        if (text) text.textContent = serverCompatibilityMessage || (serverOnline ? 'Connected' : 'Offline');
      }
    }
  }

  function showCopyFeedback() {
    const btn = toolbarEl.querySelector('.waypoint-tb-copy');
    if (!btn) return;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(() => { updateUI(); }, 1200);
  }

  async function copyAnnotations(annotations) {
    const text = formatAnnotationsForClipboard(annotations);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    showCopyFeedback();
  }

  async function discardAnnotations(annotations) {
    for (const annotation of annotations) {
      await WaypointAPI.discardAnnotation(annotation.id, annotation.claim?.owner, annotation.url);
    }
  }

  async function deleteAnnotation(annotation) {
    await WaypointAPI.deleteAnnotation(annotation.id);
  }

  function openAnnotation(annotation) {
    const element = WaypointElementContext.findElementBySelector(annotation);
    if (!element) {
      WaypointBadgeManager.highlightElement(annotation);
      return;
    }
    WaypointEvents.emit('annotation:edit', { annotation, element });
  }

  // --- Drag ---

  function setupDrag() {
    let isDragging = false;
    let didDrag = false;
    let startX, startY, startLeft, startTop;
    const DRAG_THRESHOLD = 4;

    toolbarEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('.waypoint-toolbar-btn') && !e.target.closest('.waypoint-tb-collapse')) return;

      isDragging = true;
      didDrag = false;
      toolbarEl.classList.add('dragging');
      const rect = toolbarEl.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (!didDrag && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        didDrag = true;
      }

      const newRight = window.innerWidth - (startLeft + toolbarEl.offsetWidth) - dx;
      const newTop = startTop + dy;

      const clampedRight = Math.max(8, Math.min(newRight, window.innerWidth - toolbarEl.offsetWidth - 8));
      const clampedTop = Math.max(8, Math.min(newTop, window.innerHeight - toolbarEl.offsetHeight - 8));

      toolbarEl.style.right = `${clampedRight}px`;
      toolbarEl.style.top = `${clampedTop}px`;
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      toolbarEl.classList.remove('dragging');

      if (didDrag) {
        WaypointAPI.saveToolbarPosition({
          right: toolbarEl.style.right,
          top: toolbarEl.style.top
        });
      }
    });

    // Suppress click on collapse button if it was actually a drag
    toolbarEl.querySelector('.waypoint-tb-collapse').addEventListener('click', (e) => {
      if (didDrag) {
        e.stopImmediatePropagation();
        didDrag = false;
      }
    }, true);
  }

  async function restorePosition() {
    const pos = await WaypointAPI.getToolbarPosition();
    if (pos && toolbarEl) {
      toolbarEl.style.right = pos.right;
      toolbarEl.style.top = pos.top;
    }
  }

  // --- Delete confirm ---

  function showDeleteConfirm(root) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'waypoint-confirm-backdrop';
      backdrop.innerHTML = `
        <div class="waypoint-confirm">
          <div class="waypoint-confirm-title">Delete all annotations?</div>
          <div class="waypoint-confirm-msg">All annotations on this page will be permanently deleted.</div>
          <label class="waypoint-confirm-skip" style="display:flex;align-items:center;gap:6px;margin:8px 0 4px;font-size:12px;color:var(--waypoint-text-secondary,#6b7280);cursor:pointer;user-select:none;">
            <input type="checkbox" class="waypoint-confirm-skip-cb" style="margin:0;">
            Don't ask again
          </label>
          <div class="waypoint-confirm-actions">
            <button class="waypoint-btn waypoint-btn-secondary waypoint-confirm-no">Cancel</button>
            <button class="waypoint-btn waypoint-btn-danger waypoint-confirm-yes">Delete All</button>
          </div>
        </div>
      `;
      root.appendChild(backdrop);

      backdrop.querySelector('.waypoint-confirm-no').addEventListener('click', () => { backdrop.remove(); resolve(false); });
      backdrop.querySelector('.waypoint-confirm-yes').addEventListener('click', () => {
        const skipCb = backdrop.querySelector('.waypoint-confirm-skip-cb');
        if (skipCb && skipCb.checked) {
          WaypointAPI.saveSkipDeleteConfirm(true);
        }
        backdrop.remove();
        resolve(true);
      });
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    });
  }

  // --- Import / Export ---

  function showExportModal() {
    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'waypoint-confirm-backdrop';
    backdrop.innerHTML = `
      <div class="waypoint-confirm">
        <div class="waypoint-confirm-title">Export annotations</div>
        <div class="waypoint-confirm-msg">Choose the scope, status, and share format.</div>
        <label class="waypoint-export-field">Scope
          <select class="waypoint-export-scope">
            <option value="page">This page only</option>
            <option value="project">All from this site</option>
          </select>
        </label>
        <label class="waypoint-export-field">Status
          <select class="waypoint-export-status">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="claimed">Claimed</option>
            <option value="resolved">Resolved</option>
            <option value="discarded">Discarded</option>
          </select>
        </label>
        <div class="waypoint-confirm-actions waypoint-export-actions">
          <button class="waypoint-btn waypoint-btn-secondary waypoint-export-json" type="button">Download JSON</button>
          <button class="waypoint-btn waypoint-btn-primary waypoint-export-markdown" type="button">Download Markdown</button>
          <button class="waypoint-btn waypoint-btn-secondary waypoint-export-share" type="button">Share Markdown</button>
        </div>
        <div class="waypoint-confirm-actions" style="margin-top:8px;justify-content:flex-start;">
          <button class="waypoint-btn waypoint-btn-secondary waypoint-export-cancel">Cancel</button>
        </div>
      </div>
    `;
    root.appendChild(backdrop);

    backdrop.querySelector('.waypoint-export-cancel').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

    const runExport = async (format, share) => {
      const scope = backdrop.querySelector('.waypoint-export-scope').value;
      const status = backdrop.querySelector('.waypoint-export-status').value;
      const annotations = scope === 'page'
        ? await WaypointAPI.loadAnnotations()
        : await WaypointAPI.loadProjectAnnotations();
      const filtered = WaypointExportCodec.filterAnnotationsByStatus(annotations, status);
      if (!filtered.length) {
        backdrop.remove();
        showInfoModal('Nothing to export', `No ${status === 'all' ? '' : `${status} `}annotations in this scope.`);
        return;
      }
      await doExport(filtered, { scope, status, format, share });
      backdrop.remove();
    };

    backdrop.querySelector('.waypoint-export-json').addEventListener('click', () => runExport('json', false));
    backdrop.querySelector('.waypoint-export-markdown').addEventListener('click', () => runExport('markdown', false));
    backdrop.querySelector('.waypoint-export-share').addEventListener('click', () => runExport('markdown', true));
  }

  async function doExport(annotations, { scope, status, format, share }) {
    const loc = window.location;
    const exportData = WaypointExportCodec.createExportEnvelope(annotations, { scope, status, source: loc });

    const dateStr = new Date().toISOString().slice(0, 10);
    const hostStr = loc.hostname + (loc.port ? '-' + loc.port : '');
    const isMarkdown = format === 'markdown';
    const content = isMarkdown
      ? WaypointExportCodec.formatAnnotationsAsMarkdown(exportData.annotations, { scope, status, formatGroups: formatAnnotationsForClipboard })
      : JSON.stringify(exportData, null, 2);
    const type = isMarkdown ? 'text/markdown' : 'application/json';
    const filename = `logbook-waypoint-${hostStr}-${dateStr}.${isMarkdown ? 'md' : 'json'}`;
    const file = new File([content], filename, { type });

    if (share && typeof navigator.share === 'function') {
      const shareData = { title: 'Logbook Waypoint annotations', text: 'Annotations exported from Logbook Waypoint.' };
      if (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ ...shareData, files: [file] });
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', async () => {
      const file = input.files[0];
      input.remove();
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await processImport(data);
      } catch {
        showInfoModal('Invalid file', 'The selected file is not valid JSON.');
      }
    });

    input.click();
  }

  async function processImport(data) {
    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    const importedData = WaypointExportCodec.normalizeImportEnvelope(data);

    // Validate envelope
    if (!importedData) {
      showInfoModal('Invalid format', 'This file is not a Logbook Waypoint export.');
      return;
    }

    if (!importedData.annotations.every(annotation => WaypointAnnotationId.isValid(annotation?.id))) {
      showInfoModal('Invalid format', 'This export contains a non-Waypoint annotation ID.');
      return;
    }

    // Validate origin match — offer remap if importing public URL annotations into localhost
    const currentOrigin = window.location.origin;
    let remapFrom = null;
    if (importedData.source?.origin && importedData.source.origin !== currentOrigin) {
      if (isLocalDev()) {
        const accepted = await showRemapConfirm(root, importedData.source.origin, currentOrigin);
        if (!accepted) return;
        remapFrom = importedData.source.origin;
      } else {
        showInfoModal(
          'Origin mismatch',
          `These annotations were exported from ${importedData.source.origin} but you are on ${currentOrigin}. Origins must match to import.`
        );
        return;
      }
    }

    // Remap URLs if importing from a different origin
    if (remapFrom) {
      for (const a of importedData.annotations) {
        if (a.url) a.url = a.url.replace(remapFrom, currentOrigin);
        if (a.url_path) { /* url_path is an origin-less route, so it does not need remapping */ }
      }
    }

    try {
      WaypointAnnotationValidation.assertAll(importedData.annotations);
    } catch (error) {
      showInfoModal('Invalid format', error.message);
      return;
    }

    // Deduplicate against existing
    const existing = await WaypointAPI.loadProjectAnnotations();
    const existingIds = new Set(existing.map(a => a.id));
    const newAnnotations = importedData.annotations.filter(a => !existingIds.has(a.id));
    const skipped = importedData.annotations.length - newAnnotations.length;

    if (newAnnotations.length === 0) {
      showInfoModal('Nothing to import', `All ${importedData.annotations.length} annotation${importedData.annotations.length !== 1 ? 's' : ''} already exist locally.`);
      return;
    }

    // Confirm
    const confirmed = await showImportConfirm(root, {
      total: importedData.annotations.length,
      newCount: newAnnotations.length,
      skipped
    });
    if (!confirmed) return;

    // Import via background script (handles storage lock + server sync)
    await chrome.runtime.sendMessage({ action: 'importAnnotations', annotations: newAnnotations });
    // Storage listener in content.js handles re-render automatically
  }

  function showImportConfirm(root, { total, newCount, skipped }) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'waypoint-confirm-backdrop';
      const skipText = skipped > 0 ? `<br>${skipped} already exist and will be skipped.` : '';
      backdrop.innerHTML = `
        <div class="waypoint-confirm">
          <div class="waypoint-confirm-title">Import annotations</div>
          <div class="waypoint-confirm-msg">${newCount} annotation${newCount !== 1 ? 's' : ''} will be imported.${skipText}</div>
          <div class="waypoint-confirm-actions">
            <button class="waypoint-btn waypoint-btn-secondary waypoint-confirm-no">Cancel</button>
            <button class="waypoint-btn waypoint-btn-primary waypoint-confirm-yes">Import</button>
          </div>
        </div>
      `;
      root.appendChild(backdrop);

      backdrop.querySelector('.waypoint-confirm-no').addEventListener('click', () => { backdrop.remove(); resolve(false); });
      backdrop.querySelector('.waypoint-confirm-yes').addEventListener('click', () => { backdrop.remove(); resolve(true); });
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    });
  }

  function isLocalDev() {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0'
      || h.endsWith('.local') || h.endsWith('.test') || h.endsWith('.localhost');
  }

  function showRemapConfirm(root, sourceOrigin, currentOrigin) {
    return new Promise(resolve => {
      const backdrop = document.createElement('div');
      backdrop.className = 'waypoint-confirm-backdrop';
      backdrop.innerHTML = `
        <div class="waypoint-confirm">
          <div class="waypoint-confirm-title">Remap annotations?</div>
          <div class="waypoint-confirm-msg">
            These annotations were exported from <strong>${escapeHTML(sourceOrigin)}</strong>.
            Remap URLs to <strong>${escapeHTML(currentOrigin)}</strong> for local development?
          </div>
          <div style="font-size:12px;color:var(--waypoint-text-secondary);margin-top:8px;margin-bottom:4px;line-height:1.5;">
            Important: Annotations might not perfectly anchor or apply the styling changes if the selectors aren't identical.
          </div>
          <div class="waypoint-confirm-actions">
            <button class="waypoint-btn waypoint-btn-secondary waypoint-confirm-no">Cancel</button>
            <button class="waypoint-btn waypoint-btn-primary waypoint-confirm-yes">Remap & Import</button>
          </div>
        </div>
      `;
      root.appendChild(backdrop);

      backdrop.querySelector('.waypoint-confirm-no').addEventListener('click', () => { backdrop.remove(); resolve(false); });
      backdrop.querySelector('.waypoint-confirm-yes').addEventListener('click', () => { backdrop.remove(); resolve(true); });
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    });
  }

  function showInfoModal(title, message) {
    const root = WaypointShadowHost.getRoot();
    if (!root) return;

    const backdrop = document.createElement('div');
    backdrop.className = 'waypoint-confirm-backdrop';
    backdrop.innerHTML = `
      <div class="waypoint-confirm">
        <div class="waypoint-confirm-title">${escapeHTML(title)}</div>
        <div class="waypoint-confirm-msg">${escapeHTML(message)}</div>
        <div class="waypoint-confirm-actions">
          <button class="waypoint-btn waypoint-btn-secondary waypoint-confirm-no">OK</button>
        </div>
      </div>
    `;
    root.appendChild(backdrop);

    backdrop.querySelector('.waypoint-confirm-no').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });
  }

  // --- Helpers ---

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function formatShortcut(sc) {
    const parts = [];
    if (sc.ctrlKey) parts.push(isMac ? '\u2303' : 'Ctrl');
    if (sc.metaKey) parts.push(isMac ? '\u2318' : 'Win');
    if (sc.altKey) parts.push(isMac ? '\u2325' : 'Alt');
    if (sc.shiftKey) parts.push(isMac ? '\u21E7' : 'Shift');
    // Friendly key name
    const keyMap = { ',': ',', '.': '.', '/': '/', ' ': 'Space', ArrowUp: '\u2191', ArrowDown: '\u2193', ArrowLeft: '\u2190', ArrowRight: '\u2192' };
    const keyLabel = keyMap[sc.key] || (sc.key.length === 1 ? sc.key.toUpperCase() : sc.key);
    parts.push(keyLabel);
    return isMac ? parts.join('') : parts.join('+');
  }

  function formatBrowserShortcut(shortcut) {
    if (!shortcut) return '';
    if (!isMac) return shortcut;

    const keyLabels = {
      Command: '\u2318',
      MacCtrl: '\u2303',
      Ctrl: '\u2303',
      Alt: '\u2325',
      Option: '\u2325',
      Shift: '\u21E7',
      Up: '\u2191',
      Down: '\u2193',
      Left: '\u2190',
      Right: '\u2192',
    };
    return shortcut.split('+').map(part => keyLabels[part] || part).join('');
  }

  function commandLabel(label, shortcut) {
    return shortcut ? `${label} (${shortcut})` : label;
  }

  // --- Clipboard format ---

  const TRIVIAL_STYLES = {
    display: 'block',
    position: 'static',
    fontSize: '16px',
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    margin: '0px',
    padding: '0px'
  };

  function formatAnnotationsForClipboard(annotations) {
    const groups = new Map();
    for (const annotation of annotations) {
      const route = WaypointExportCodec.getAnnotationRoute(annotation, window.location.href);
      const group = groups.get(route) || [];
      group.push(annotation);
      groups.set(route, group);
    }

    return [...groups.entries()]
      .map(([route, routeAnnotations]) => `## Route: ${route}\n\n${formatAnnotationsForRoute(routeAnnotations, route)}`)
      .join('\n\n---\n\n');
  }

  function formatAnnotationsForRoute(annotations, route) {
    const loc = window.location;
    const host = loc.host;
    const vp = annotations[0]?.viewport;
    const vpStr = vp ? `${vp.width}\u00D7${vp.height}` : '';
    const count = annotations.length;

    let header = `# Logbook Waypoint \u2014 ${route}`;
    header += `\n${host}`;
    if (vpStr) header += ` \u00B7 ${vpStr}`;
    header += ` \u00B7 ${count} annotation${count !== 1 ? 's' : ''}`;

    const blocks = annotations.map((a, i) => {
      const ec = a.element_context || {};
      const tag = ec.tag ? `<${ec.tag}>` : '';
      const text = ec.text ? truncate(ec.text, 40) : '';
      const identity = [tag, text ? `"${text}"` : ''].filter(Boolean).join(' ');

      const lines = [];
      lines.push(`${i + 1}. ${identity}`);
      lines.push(`   Comment: ${a.comment || ''}`);
      lines.push(`   Selector: ${a.selector}`);

      // Styles — only non-trivial
      const styleStr = formatStyles(ec.styles);
      if (styleStr) lines.push(`   Styles: ${styleStr}`);

      // Size from position
      const pos = ec.position;
      if (pos && pos.width && pos.height) {
        lines.push(`   Size: ${Math.round(pos.width)}\u00D7${Math.round(pos.height)}`);
      }

      const parent = a.parent_chain?.[0];
      if (parent) {
        const parentIdentity = parent.id
          ? `#${parent.id}`
          : [parent.tag, ...(parent.classes || []).slice(0, 2).map(cls => `.${cls}`)].join('');
        if (parentIdentity) lines.push(`   Context: inside ${parentIdentity}`);
      }

      // Design changes
      const pc = a.pending_changes;
      if (pc) {
        const changes = [];
        // Text props
        if (pc.fontSize) changes.push(`font-size: ${pc.fontSize.original} \u2192 ${pc.fontSize.value}`);
        if (pc.fontWeight) changes.push(`font-weight: ${pc.fontWeight.original} \u2192 ${pc.fontWeight.value}`);
        if (pc.lineHeight) changes.push(`line-height: ${pc.lineHeight.original} \u2192 ${pc.lineHeight.value}`);
        if (pc.textAlign) changes.push(`text-align: ${pc.textAlign.original} \u2192 ${pc.textAlign.value}`);
        // Container props
        ['paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft'].filter(p => pc[p]).forEach(p => {
          changes.push(`${camelToKebab(p)}: ${pc[p].original} \u2192 ${pc[p].value}`);
        });
        if (pc.display) changes.push(`display: ${pc.display.original} \u2192 ${pc.display.value}`);
        if (pc.flexDirection) changes.push(`flex-direction: ${pc.flexDirection.original} \u2192 ${pc.flexDirection.value}`);
        if (pc.flexWrap) changes.push(`flex-wrap: ${pc.flexWrap.original} \u2192 ${pc.flexWrap.value}`);
        if (pc.justifyContent) changes.push(`justify-content: ${pc.justifyContent.original} \u2192 ${pc.justifyContent.value}`);
        if (pc.alignItems) changes.push(`align-items: ${pc.alignItems.original} \u2192 ${pc.alignItems.value}`);
        if (pc.gridTemplateColumns) changes.push(`grid-template-columns: ${pc.gridTemplateColumns.original} \u2192 ${pc.gridTemplateColumns.value}`);
        if (pc.gridTemplateRows) changes.push(`grid-template-rows: ${pc.gridTemplateRows.original} \u2192 ${pc.gridTemplateRows.value}`);
        if (pc.gap) changes.push(`gap: ${pc.gap.original} \u2192 ${pc.gap.value}`);
        if (pc.columnGap) changes.push(`column-gap: ${pc.columnGap.original} \u2192 ${pc.columnGap.value}`);
        if (pc.rowGap) changes.push(`row-gap: ${pc.rowGap.original} \u2192 ${pc.rowGap.value}`);
        if (pc.borderWidth) changes.push(`border-width: ${pc.borderWidth.original} \u2192 ${pc.borderWidth.value}`);
        if (pc.borderRadius) changes.push(`border-radius: ${pc.borderRadius.original} \u2192 ${pc.borderRadius.value}`);
        // Colors — include variable name if present
        if (pc.color) changes.push(`color: ${pc.color.original} \u2192 ${pc.color.variable ? `var(${pc.color.variable})` : pc.color.value}`);
        if (pc.backgroundColor) changes.push(`background-color: ${pc.backgroundColor.original} \u2192 ${pc.backgroundColor.variable ? `var(${pc.backgroundColor.variable})` : pc.backgroundColor.value}`);
        if (pc.borderColor) changes.push(`border-color: ${pc.borderColor.original} \u2192 ${pc.borderColor.variable ? `var(${pc.borderColor.variable})` : pc.borderColor.value}`);
        // Sizing
        if (pc.width) changes.push(`width: ${pc.width.original} \u2192 ${pc.width.value}`);
        if (pc.minWidth) changes.push(`min-width: ${pc.minWidth.original} \u2192 ${pc.minWidth.value}`);
        if (pc.maxWidth) changes.push(`max-width: ${pc.maxWidth.original} \u2192 ${pc.maxWidth.value}`);
        if (pc.height) changes.push(`height: ${pc.height.original} \u2192 ${pc.height.value}`);
        if (pc.minHeight) changes.push(`min-height: ${pc.minHeight.original} \u2192 ${pc.minHeight.value}`);
        if (pc.maxHeight) changes.push(`max-height: ${pc.maxHeight.original} \u2192 ${pc.maxHeight.value}`);
        // Catch extra raw CSS changes not covered above
        const standardProps = new Set(['fontSize','fontWeight','lineHeight','textAlign','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','display','flexDirection','flexWrap','justifyContent','alignItems','gridTemplateColumns','gridTemplateRows','gap','columnGap','rowGap','borderWidth','borderRadius','borderStyle','color','backgroundColor','borderColor','width','minWidth','maxWidth','height','minHeight','maxHeight']);
        for (const [prop, change] of Object.entries(pc)) {
          if (!standardProps.has(prop) && change.original && change.value) {
            changes.push(`${camelToKebab(prop)}: ${change.original} \u2192 ${change.value}`);
          }
        }
        if (changes.length) {
          lines.push(`   Design changes: ${changes.join(', ')}`);
        }
      }

      // CSS rules (pseudo-elements, :hover, @media, etc.)
      if (a.css) {
        lines.push(`   CSS rules:\n${a.css.split('\n').map(l => '      ' + l).join('\n')}`);
      }

      return lines.join('\n');
    });

    return header + '\n\nFollow my instructions on these elements.\nWhen applying design changes, map values to the project design system (Tailwind classes, CSS variables, or design tokens).\n\n---\n\n' + blocks.join('\n\n');
  }

  function formatStyles(styles) {
    if (!styles) return '';
    const STYLE_KEYS = {
      display: 'display',
      fontSize: 'font-size',
      color: 'color',
      backgroundColor: 'background-color',
      padding: 'padding',
      margin: 'margin',
      position: 'position'
    };
    const parts = [];
    for (const [key, cssName] of Object.entries(STYLE_KEYS)) {
      const val = styles[key];
      if (!val) continue;
      if (TRIVIAL_STYLES[key] === val) continue;
      parts.push(`${cssName}:${val}`);
    }
    return parts.join(' \u00B7 ');
  }

  function applyBadgeColor(color) {
    const root = WaypointShadowHost.getRoot();
    if (root) root.host.style.setProperty('--waypoint-badge-bg', color);
  }

  function camelToKebab(str) {
    return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  }

  function truncate(str, max) {
    const clean = str.replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    return clean.substring(0, max) + '\u2026';
  }

  return {
    init,
    toggleCollapse,
    toggleSettings: toggleSettingsFromCommand,
    createExportEnvelope: (...args) => WaypointExportCodec.createExportEnvelope(...args),
    normalizeImportEnvelope: (...args) => WaypointExportCodec.normalizeImportEnvelope(...args),
    formatAnnotationsAsMarkdown: (annotations, options) => WaypointExportCodec.formatAnnotationsAsMarkdown(annotations, { ...options, formatGroups: formatAnnotationsForClipboard }),
  };
})();
