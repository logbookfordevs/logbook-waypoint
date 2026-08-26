var WaypointMultiTargetSelection = (() => {
  const MAX_TARGETS = 8;
  let active = false;
  let composing = false;
  let selections = [];
  let tray = null;
  let draft = null;
  let rafId = null;

  function init() {
    WaypointEvents.on('inspection:elementClicked', onElementClicked);
    WaypointEvents.on('multi-target:edit-selection', onEditSelection);
    WaypointEvents.on('multi-target:saved', reset);
    WaypointEvents.on('inspection:stopped', onInspectionStopped);
  }

  function shouldHandle(shiftKey = false) {
    return active || shiftKey;
  }

  async function onElementClicked({ element, clientX, clientY, shiftKey = false }) {
    if (!shouldHandle(shiftKey) || composing) return false;
    active = true;
    const context = await WaypointElementContext.generate(element);
    const existingIndex = selections.findIndex(selection => selection.context.selector === context.selector);
    if (existingIndex >= 0) {
      selections.splice(existingIndex, 1);
    } else if (selections.length >= MAX_TARGETS) {
      render('Up to 8 Targets can share one Annotation.');
      return true;
    } else {
      selections.push({ element, context, clientX, clientY });
    }
    render();
    return true;
  }

  function ensureTray() {
    if (tray) return tray;
    const root = WaypointShadowHost.getRoot();
    if (!root) return null;
    tray = document.createElement('section');
    tray.className = 'waypoint-target-selection-tray';
    tray.setAttribute('role', 'region');
    tray.setAttribute('aria-label', 'Multi-Target selection');
    root.appendChild(tray);
    return tray;
  }

  function render(message = '') {
    const root = WaypointShadowHost.getRoot();
    const currentTray = ensureTray();
    if (!root || !currentTray) return;
    root.querySelectorAll('.waypoint-target-selection-pin').forEach(pin => pin.remove());
    selections.forEach((selection, index) => {
      const pin = document.createElement('div');
      pin.className = 'waypoint-target-selection-pin';
      pin.textContent = String.fromCharCode(97 + index);
      pin.dataset.targetOrdinal = String(index);
      root.appendChild(pin);
      selection.pin = pin;
      positionPin(selection);
    });

    const count = selections.length;
    currentTray.innerHTML = `
      <span class="waypoint-target-selection-count">${count} Target${count === 1 ? '' : 's'}</span>
      <span class="waypoint-target-selection-message" role="status" aria-live="polite">${message || (count < 2 ? 'Choose one more Target' : '')}</span>
      <button class="waypoint-target-selection-cancel" type="button">Cancel</button>
      <button class="waypoint-target-selection-annotate" type="button" ${count < 2 ? 'disabled' : ''}>Annotate</button>
    `;
    currentTray.querySelector('.waypoint-target-selection-cancel').addEventListener('click', cancel);
    currentTray.querySelector('.waypoint-target-selection-annotate').addEventListener('click', compose);
    startPositioning();
  }

  function positionPin(selection) {
    if (!selection.pin || !selection.element?.isConnected) return;
    const rect = selection.element.getBoundingClientRect();
    const x = Number.isFinite(selection.clientX) ? selection.clientX - rect.left : rect.width / 2;
    const y = Number.isFinite(selection.clientY) ? selection.clientY - rect.top : 0;
    selection.pin.style.left = `${rect.left + x}px`;
    selection.pin.style.top = `${rect.top + y - 11}px`;
  }

  function startPositioning() {
    if (rafId) return;
    const tick = () => {
      selections.forEach(positionPin);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function stopPositioning() {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function compose() {
    if (selections.length < 2) return;
    composing = true;
    tray?.remove();
    tray = null;
    WaypointEvents.emit('multi-target:compose', { selections: getSelections(), draft });
  }

  function onEditSelection(nextDraft) {
    draft = nextDraft;
    composing = false;
    active = true;
    render();
    WaypointInspectionMode.reEnable();
  }

  function hasDraftContent() {
    return Boolean(
      draft?.comment?.trim()
      || draft?.attachments?.length
      || draft?.design_intent
      || draft?.variant_intent,
    );
  }

  function onInspectionStopped() {
    if (hasDraftContent() && !window.confirm('Discard this shared Annotation draft?')) {
      WaypointInspectionMode.reEnable();
      return;
    }
    reset();
  }

  function cancel() {
    if (hasDraftContent() && !window.confirm('Discard this shared Annotation draft?')) return;
    reset();
    WaypointEvents.emit('multi-target:cancelled');
  }

  function handleEscape() {
    if (!active || composing) return false;
    cancel();
    return true;
  }

  function reset() {
    selections.forEach(selection => selection.pin?.remove());
    selections = [];
    tray?.remove();
    tray = null;
    draft = null;
    active = false;
    composing = false;
    stopPositioning();
  }

  function getSelections() {
    return selections.map(({ element, context, clientX, clientY }) => ({ element, context, clientX, clientY }));
  }

  return {
    getSelections,
    handleEscape,
    init,
    isActive: () => active,
    isComposing: () => composing,
    reset,
    shouldHandle,
  };
})();
