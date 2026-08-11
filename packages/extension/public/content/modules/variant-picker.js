globalThis.WaypointVariantPicker = (() => {
  function handles(annotation) {
    return annotation?.variant_request?.status === 'unresolved';
  }

  function escapeHTML(value) {
    const node = document.createElement('div');
    node.textContent = String(value);
    return node.innerHTML;
  }

  function show(annotation, targetElement) {
    const root = VibeShadowHost.getRoot();
    if (!root || !handles(annotation)) return false;

    root.querySelector('.waypoint-variant-picker-anchor')?.remove();
    const request = annotation.variant_request;
    const anchor = document.createElement('div');
    anchor.className = 'vibe-popover-anchor waypoint-variant-picker-anchor';
    anchor.innerHTML = `
      <section class="vibe-popover waypoint-variant-picker" aria-label="Variants">
        <div class="vibe-drag-handle"></div>
        <div class="vibe-popover-title"><span>Variants</span></div>
        <div class="waypoint-variant-list">
          ${request.variants.map(variant => `
            <div class="waypoint-variant-row" data-variant-key="${escapeHTML(variant.key)}">
              <button class="vibe-btn ${variant.state === 'active' ? 'vibe-btn-primary' : 'vibe-btn-secondary'} waypoint-variant-activate" type="button" aria-pressed="${variant.state === 'active'}">
                ${escapeHTML(variant.name)}${variant.state === 'active' ? ' · Active' : ''}
              </button>
              <button class="vibe-btn-icon waypoint-variant-discard" type="button" title="Discard ${escapeHTML(variant.name)}" ${variant.state === 'active' ? 'disabled' : ''}>×</button>
            </div>
          `).join('')}
        </div>
        <div class="vibe-popover-footer">
          <div class="vibe-footer-left"><span class="waypoint-variant-status">Choose the implementation to present.</span></div>
          <div class="vibe-footer-right">
            <button class="vibe-btn vibe-btn-secondary waypoint-variant-close" type="button">Close</button>
            <button class="vibe-btn vibe-btn-primary waypoint-variant-finalize" type="button">Finalize Active</button>
          </div>
        </div>
      </section>`;
    root.appendChild(anchor);

    anchor.querySelector('.waypoint-variant-close').addEventListener('click', () => anchor.remove());
    anchor.querySelectorAll('.waypoint-variant-activate').forEach(button => button.addEventListener('click', async () => {
      const key = button.closest('[data-variant-key]').dataset.variantKey;
      if (key === request.active_variant_key) return;
      const updated = await VibeAPI.activateVariant(annotation.id, key);
      VibeEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      anchor.remove();
      show(updated, targetElement);
    }));
    anchor.querySelectorAll('.waypoint-variant-discard').forEach(button => button.addEventListener('click', async () => {
      const key = button.closest('[data-variant-key]').dataset.variantKey;
      const updated = await VibeAPI.discardVariant(annotation.id, key);
      VibeEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      anchor.remove();
      show(updated, targetElement);
    }));
    anchor.querySelector('.waypoint-variant-finalize').addEventListener('click', async () => {
      const updated = await VibeAPI.finalizeVariant(annotation.id, request.active_variant_key);
      VibeEvents.emit('annotation:variant-updated', { annotation: updated, element: targetElement });
      anchor.remove();
    });
    return true;
  }

  return { handles, show };
})();
