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

  return { handleClick, clearIntervention };
})();
