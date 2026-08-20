var WaypointActionController = (() => {
  const INTERVENTION_POPUP = 'intervention.html';

  async function handleClick(tab) {
    if (!tab?.id) return { direct: false };

    try {
      const state = await chrome.tabs.sendMessage(tab.id, { action: 'getOverlayState' });
      if (!state?.success) throw new Error('Waypoint content is unavailable');
      const toggled = await chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
      return { direct: true, visible: Boolean(toggled?.visible) };
    } catch {
      await chrome.action.setPopup({ tabId: tab.id, popup: INTERVENTION_POPUP });
      try {
        await chrome.action.openPopup({ windowId: tab.windowId });
      } catch {
        // The assigned popup remains available on the next click in older browsers.
      }
      return { direct: false };
    }
  }

  async function clearIntervention(tabId) {
    if (tabId) await chrome.action.setPopup({ tabId, popup: '' });
  }

  const COMMAND_ACTIONS = Object.freeze({
    'toggle-annotate': 'toggleAnnotate',
    'toggle-toolbar-collapse': 'toggleToolbarCollapse',
    'toggle-toolbar-settings': 'toggleToolbarSettings',
    'toggle-waypoint-visibility': 'toggleOverlay',
  });

  async function handleCommand(command, tab, isSupportedUrl) {
    const action = COMMAND_ACTIONS[command];
    if (!action || !tab?.id || !await isSupportedUrl(tab.url)) return false;
    try {
      await chrome.tabs.sendMessage(tab.id, { action });
      return true;
    } catch {
      return false;
    }
  }

  return { handleClick, handleCommand, clearIntervention };
})();
