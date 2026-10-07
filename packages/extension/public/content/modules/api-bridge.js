// Wraps all chrome.runtime.sendMessage and chrome.storage calls
// Single interface for data operations used by all modules

var WaypointAPI = (() => {
  let statusCache = null;
  let statusCacheTime = 0;
  const CACHE_TTL = 2000;
  const MAX_IMAGE_ATTACHMENT_BYTES = 1024 * 1024;
  const MAX_IMAGE_ATTACHMENT_DATA_URL_LENGTH = 1_400_000;
  const MAX_IMAGE_ATTACHMENTS = 3;
  const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

  function isFileProtocol() {
    return window.location.protocol === 'file:';
  }

  function validateAnnotationAttachments(annotation) {
    const attachments = annotation?.attachments;
    if (attachments === undefined) return;
    if (!Array.isArray(attachments) || attachments.length > MAX_IMAGE_ATTACHMENTS) {
      throw new Error('An annotation can include up to three image attachments');
    }

    let totalDataUrlLength = 0;
    for (const attachment of attachments) {
      if (!attachment || typeof attachment !== 'object') throw new Error('Invalid image attachment');
      const mimeType = attachment.mime_type;
      if (!IMAGE_MIME_TYPES.has(mimeType)) throw new Error('Unsupported image attachment type');

      if (attachment.data_url === undefined) continue;
      if (typeof attachment.data_url !== 'string' || !attachment.data_url.startsWith(`data:${mimeType};base64,`)) {
        throw new Error('Invalid image attachment payload');
      }
      if (!Number.isInteger(attachment.size_bytes) || attachment.size_bytes < 0 || attachment.size_bytes > MAX_IMAGE_ATTACHMENT_BYTES) {
        throw new Error('Image attachment exceeds the 1 MB limit');
      }
      if (attachment.data_url.length > MAX_IMAGE_ATTACHMENT_DATA_URL_LENGTH) {
        throw new Error('Image attachment payload exceeds the limit');
      }
      totalDataUrlLength += attachment.data_url.length;
    }
    if (totalDataUrlLength > MAX_IMAGE_ATTACHMENT_DATA_URL_LENGTH * MAX_IMAGE_ATTACHMENTS) {
      throw new Error('Combined image attachment payload exceeds the limit');
    }
  }

  async function requestOptionalSitePermission() {
    try {
      const origin = window.location?.origin;
      if (!origin || origin === 'null') return false;
      const url = new URL(origin);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      const response = await chrome.runtime.sendMessage({
        action: 'requestOptionalSitePermission',
        originPattern: `${url.origin}/*`,
      });
      return response?.success === true && response.granted === true;
    } catch {
      return false;
    }
  }

  async function hasCurrentSiteAccess() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCurrentSiteAccess' });
      return response?.success === true && response.granted === true;
    } catch {
      return false;
    }
  }

  // --- Server status ---

  async function checkServerStatus() {
    const now = Date.now();
    if (statusCache && (now - statusCacheTime) < CACHE_TTL) return statusCache;

    let status;

    status = await _checkViaBg();

    statusCache = status;
    statusCacheTime = now;
    return status;
  }

  async function _checkViaBg() {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'checkMCPStatus' });
      if (!r?.success || !r.status) return { connected: false };
      return r.status;
    } catch {
      return { connected: false };
    }
  }

  function clearStatusCache() {
    statusCache = null;
    statusCacheTime = 0;
  }

  async function getSyncStatus() {
    const response = await chrome.runtime.sendMessage({
      action: 'getSyncStatus',
      origin: window.location.origin,
    });
    if (!response?.success || !response.status) {
      throw new Error(response?.error || 'Could not check sync status');
    }
    return response.status;
  }

  async function syncNow() {
    const response = await chrome.runtime.sendMessage({
      action: 'syncNow',
      origin: window.location.origin,
    });
    if (!response?.success || !response.status) {
      throw new Error(response?.error || 'Could not sync annotations');
    }
    return response.status;
  }

  async function getDataHealthSummary() {
    const response = await chrome.runtime.sendMessage({ action: 'getDataHealthSummary' });
    if (!response?.success || !response.summary) {
      throw new Error(response?.error || 'Could not load Data & Storage summary');
    }
    return response.summary;
  }

  async function getDataManagerSnapshot() {
    const response = await chrome.runtime.sendMessage({ action: 'getDataManagerSnapshot' });
    if (!response?.success || !response.snapshot) {
      throw new Error(response?.error || 'Could not load Data & Storage');
    }
    return response.snapshot;
  }

  async function deleteDataSelection(selection) {
    const response = await chrome.runtime.sendMessage({ action: 'deleteDataSelection', selection });
    if (!response?.success) throw new Error(response?.error || 'Could not delete annotations');
    return response;
  }

  // --- Annotations CRUD ---

  async function loadAnnotations() {
    try {
      const result = await chrome.storage.local.get(['waypointAnnotations']);
      const all = WaypointAnnotationCollection.canonicalize(result.waypointAnnotations);
      all.forEach(WaypointDesignIntent.assertAnnotation);
      return all.filter(a => WaypointAnnotationPage.matches(a.url, window.location.href));
    } catch {
      return [];
    }
  }

  async function loadProjectAnnotations() {
    try {
      const result = await chrome.storage.local.get(['waypointAnnotations']);
      const all = WaypointAnnotationCollection.canonicalize(result.waypointAnnotations);
      all.forEach(WaypointDesignIntent.assertAnnotation);
      const origin = window.location.origin;
      return all.filter(a => {
        try { return new URL(a.url).origin === origin; } catch { return false; }
      });
    } catch {
      return [];
    }
  }

  async function saveAnnotation(annotation) {
    annotation = WaypointAnnotationTargets.normalize(WaypointAnnotationStatus.normalize(annotation));
    WaypointDesignIntent.assertAnnotation(annotation);
    validateAnnotationAttachments(annotation);
    try {
      const r = await chrome.runtime.sendMessage({ action: 'saveAnnotation', annotation });
      if (!r || !r.success) throw new Error(r?.error || 'save failed');
      return true;
    } catch (e) {
      // Fallback: direct storage
      console.warn('saveAnnotation bg failed, using storage fallback', e);
      if (!WaypointAnnotationId.isValid(annotation?.id)) {
        throw new Error('Invalid Waypoint annotation ID');
      }
      const result = await chrome.storage.local.get(['waypointAnnotations']);
      const all = WaypointAnnotationCollection.canonicalize(result.waypointAnnotations);
      const existingIndex = all.findIndex(candidate => candidate.id === annotation.id);
      WaypointAnnotationStatus.assertSaveAllowed(all[existingIndex], annotation);
      WaypointVariantPolicy.assertSaveAllowed(all[existingIndex], annotation);
      const pendingAnnotation = { ...annotation, _synced: false };
      if (existingIndex === -1) all.push(pendingAnnotation);
      else all[existingIndex] = pendingAnnotation;
      await chrome.storage.local.set({ waypointAnnotations: all });
      return true;
    }
  }

  async function updateAnnotation(id, updates) {
    updates = WaypointAnnotationStatus.normalizeUpdate(updates);
    try {
      const r = await chrome.runtime.sendMessage({ action: 'updateAnnotation', id, updates });
      if (!r || !r.success) throw new Error(r?.error || 'update failed');
      return true;
    } catch (e) {
      console.warn('updateAnnotation bg failed, using storage fallback', e);
      if (!WaypointAnnotationId.isValid(id)) {
        throw new Error('Invalid Waypoint annotation ID');
      }
      if (updates?.id !== undefined && updates.id !== id) {
        throw new Error('Annotation ID cannot be changed');
      }
      const result = await chrome.storage.local.get([
        'waypointAnnotations',
        'waypointDesignIntentRemovalIds',
        'waypointVariantIntentRemovalIds'
      ]);
      const all = WaypointAnnotationCollection.canonicalize(result.waypointAnnotations);
      const idx = all.findIndex(a => a.id === id);
      if (idx !== -1) {
        WaypointAnnotationStatus.assertUpdateAllowed(all[idx]);
        WaypointVariantPolicy.assertUpdateAllowed(all[idx], updates);
        const updatedDesignIntent = WaypointDesignIntent.applyUpdate(all[idx], updates);
        const variantIntentUpdate = Object.hasOwn(updates, 'variant_intent')
          ? { variant_intent: updates.variant_intent }
          : {};
        const updatedAnnotation = WaypointVariantIntent.applyUpdate(updatedDesignIntent, variantIntentUpdate);
        all[idx] = { ...updatedAnnotation, _synced: false };
        const designIntentRemovalIds = WaypointDesignIntent.updateRemovalIds(
          result.waypointDesignIntentRemovalIds || [],
          id,
          updates
        );
        const variantIntentRemovalIds = WaypointVariantIntent.updateRemovalIds(
          result.waypointVariantIntentRemovalIds || [],
          id,
          updates
        );
        await chrome.storage.local.set({
          waypointAnnotations: all,
          waypointDesignIntentRemovalIds: designIntentRemovalIds,
          waypointVariantIntentRemovalIds: variantIntentRemovalIds
        });
      }
      return true;
    }
  }

  async function deleteAnnotation(id) {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'deleteAnnotation', id });
      if (!r || !r.success) throw new Error(r?.error || 'delete failed');
      return true;
    } catch (e) {
      console.warn('deleteAnnotation bg failed, using storage fallback', e);
      if (!WaypointAnnotationId.isValid(id)) {
        throw new Error('Invalid Waypoint annotation ID');
      }
      const result = await chrome.storage.local.get([
        'waypointAnnotations',
        'waypointDeletedAnnotationIds',
      ]);
      const all = WaypointAnnotationCollection.canonicalize(result.waypointAnnotations);
      WaypointVariantPolicy.assertDeleteAllowed(all.find(annotation => annotation.id === id));
      const filtered = all.filter(a => a.id !== id);
      const deletedIds = result.waypointDeletedAnnotationIds || [];
      if (!deletedIds.includes(id)) deletedIds.push(id);
      await chrome.storage.local.set({
        waypointAnnotations: filtered,
        waypointDeletedAnnotationIds: deletedIds,
      });
      return true;
    }
  }

  async function runVariantOperation(action, id, key) {
    const request = { action, id };
    if (key !== undefined) request.key = key;
    const response = await chrome.runtime.sendMessage(request);
    if (!response?.success || !response.annotation) throw new Error(response?.error || `${action} failed`);
    return response.annotation;
  }

  function activateVariant(id, key) {
    return runVariantOperation('activateVariant', id, key);
  }

  function discardVariant(id, key) {
    return runVariantOperation('discardVariant', id, key);
  }

  function cancelVariantRequest(id) {
    return runVariantOperation('cancelVariantRequest', id);
  }

  function finalizeVariant(id, key) {
    return runVariantOperation('finalizeVariant', id, key);
  }

  async function runLifecycleOperation(action, id, { owner, reason, url = window.location?.href } = {}) {
    const request = { action, id };
    if (owner !== undefined) request.owner = owner;
    if (reason !== undefined) request.reason = reason;
    if (url) request.url = url;
    const response = await chrome.runtime.sendMessage(request);
    if (!response?.success || !response.annotation) throw new Error(response?.error || `${action} failed`);
    return WaypointAnnotationStatus.normalize(response.annotation);
  }

  function claimAnnotation(id, owner, url) {
    return runLifecycleOperation('claimAnnotation', id, { owner, url });
  }

  function releaseAnnotation(id, owner, reason, url) {
    return runLifecycleOperation('releaseAnnotation', id, { owner, reason, url });
  }

  function resolveAnnotation(id, owner, url) {
    return runLifecycleOperation('resolveAnnotation', id, { owner, url });
  }

  function discardAnnotation(id, owner, url) {
    return runLifecycleOperation('discardAnnotation', id, { owner, url });
  }

  function dismissWorkNotice(id, url) {
    return runLifecycleOperation('dismissWorkNotice', id, { url });
  }

  async function deleteAnnotationsByUrl() {
    try {
      const r = await chrome.runtime.sendMessage({ action: 'deleteAnnotationsByUrl', url: window.location.href });
      if (!r || !r.success) throw new Error(r?.error || 'bulk delete failed');
      return r.count || 0;
    } catch (e) {
      console.warn('deleteAnnotationsByUrl bg failed, using storage fallback', e);
      const result = await chrome.storage.local.get([
        'waypointAnnotations',
        'waypointDeletedAnnotationIds',
      ]);
      const all = WaypointAnnotationCollection.canonicalize(result.waypointAnnotations);
      const removed = all.filter(candidate => WaypointAnnotationPage.matches(candidate.url, window.location.href));
      for (const annotation of removed) {
        WaypointVariantPolicy.assertDeleteAllowed(annotation);
      }
      const remaining = all.filter(a => !WaypointAnnotationPage.matches(a.url, window.location.href));
      const deletedIds = result.waypointDeletedAnnotationIds || [];
      for (const annotation of removed) {
        if (!deletedIds.includes(annotation.id)) deletedIds.push(annotation.id);
      }
      await chrome.storage.local.set({
        waypointAnnotations: remaining,
        waypointDeletedAnnotationIds: deletedIds,
      });
      return all.length - remaining.length;
    }
  }

  // --- Storage listeners ---

  function onAnnotationsChanged(cb) {
    chrome.storage.onChanged.addListener((changes, ns) => {
      if (ns === 'local' && changes.waypointAnnotations) {
        cb(WaypointAnnotationCollection.canonicalize(changes.waypointAnnotations.newValue));
      }
    });
  }

  // --- Settings ---

  async function getScreenshotEnabled() {
    try {
      const r = await chrome.storage.local.get(['waypointScreenshotEnabled']);
      return r.waypointScreenshotEnabled !== undefined ? r.waypointScreenshotEnabled : true;
    } catch {
      return true;
    }
  }

  async function saveScreenshotEnabled(enabled) {
    try {
      await chrome.storage.local.set({ waypointScreenshotEnabled: enabled });
    } catch {}
  }

  async function getShowDesignActions() {
    try {
      const result = await chrome.storage.local.get(['waypointShowDesignActions']);
      return result.waypointShowDesignActions !== false;
    } catch {
      return true;
    }
  }

  async function saveShowDesignActions(enabled) {
    try {
      await chrome.storage.local.set({ waypointShowDesignActions: Boolean(enabled) });
    } catch { /* ignore */ }
  }

  async function getShowTargetControls() {
    try {
      const result = await chrome.storage.local.get(['waypointShowTargetControls']);
      return result.waypointShowTargetControls !== false;
    } catch {
      return true;
    }
  }

  async function saveShowTargetControls(enabled) {
    try {
      await chrome.storage.local.set({ waypointShowTargetControls: Boolean(enabled) });
    } catch { /* ignore */ }
  }

  async function getAnnotationExperienceExpanded() {
    try {
      const result = await chrome.storage.local.get(['waypointAnnotationExperienceExpanded']);
      return result.waypointAnnotationExperienceExpanded !== false;
    } catch {
      return true;
    }
  }

  async function saveAnnotationExperienceExpanded(expanded) {
    try {
      await chrome.storage.local.set({ waypointAnnotationExperienceExpanded: Boolean(expanded) });
    } catch { /* ignore */ }
  }

  async function getToolbarPosition() {
    try {
      const r = await chrome.storage.local.get(['waypointToolbarPos']);
      return r.waypointToolbarPos || null;
    } catch {
      return null;
    }
  }

  async function saveToolbarPosition(pos) {
    try {
      await chrome.storage.local.set({ waypointToolbarPos: pos });
    } catch { /* ignore */ }
  }

  async function getToolbarCollapsed() {
    try {
      const r = await chrome.storage.local.get(['waypointToolbarCollapsed']);
      return !!r.waypointToolbarCollapsed;
    } catch {
      return false;
    }
  }

  async function saveToolbarCollapsed(collapsed) {
    try {
      await chrome.storage.local.set({ waypointToolbarCollapsed: collapsed });
    } catch { /* ignore */ }
  }

  async function getClearOnCopy() {
    try {
      const r = await chrome.storage.local.get(['waypointClearOnCopy']);
      return !!r.waypointClearOnCopy;
    } catch {
      return false;
    }
  }

  async function saveClearOnCopy(enabled) {
    try {
      await chrome.storage.local.set({ waypointClearOnCopy: enabled });
    } catch { /* ignore */ }
  }

  async function getBadgeColor() {
    try {
      const r = await chrome.storage.local.get(['waypointBadgeColor']);
      return r.waypointBadgeColor || '#173f5f';
    } catch {
      return '#173f5f';
    }
  }

  async function saveBadgeColor(color) {
    try {
      await chrome.storage.local.set({ waypointBadgeColor: color });
    } catch { /* ignore */ }
  }

  async function getOverlayHidden() {
    try {
      const result = await chrome.storage.local.get(['waypointOverlayHidden']);
      return Boolean(result.waypointOverlayHidden);
    } catch {
      return false;
    }
  }

  async function saveOverlayHidden(hidden) {
    try {
      await chrome.storage.local.set({ waypointOverlayHidden: Boolean(hidden) });
    } catch { /* ignore */ }
  }

  async function getSkipDeleteConfirm() {
    try {
      const r = await chrome.storage.local.get(['waypointSkipDeleteConfirm']);
      return !!r.waypointSkipDeleteConfirm;
    } catch {
      return false;
    }
  }

  async function saveSkipDeleteConfirm(skip) {
    try {
      await chrome.storage.local.set({ waypointSkipDeleteConfirm: skip });
    } catch { /* ignore */ }
  }

  async function getCustomShortcut() {
    try {
      const r = await chrome.storage.local.get(['waypointCustomShortcut']);
      return r.waypointCustomShortcut || null;
    } catch {
      return null;
    }
  }

  async function saveCustomShortcut(shortcut) {
    try {
      await chrome.storage.local.set({ waypointCustomShortcut: shortcut });
    } catch { /* ignore */ }
  }

  return {
    checkServerStatus,
    clearStatusCache,
    getSyncStatus,
    syncNow,
    getDataHealthSummary,
    getDataManagerSnapshot,
    deleteDataSelection,
    isFileProtocol,
    requestOptionalSitePermission,
    hasCurrentSiteAccess,
    loadAnnotations,
    loadProjectAnnotations,
    saveAnnotation,
    updateAnnotation,
    deleteAnnotation,
    activateVariant,
    claimAnnotation,
    releaseAnnotation,
    resolveAnnotation,
    discardAnnotation,
    dismissWorkNotice,
    discardVariant,
    cancelVariantRequest,
    finalizeVariant,
    deleteAnnotationsByUrl,
    onAnnotationsChanged,
    getScreenshotEnabled,
    saveScreenshotEnabled,
    getShowDesignActions,
    saveShowDesignActions,
    getShowTargetControls,
    saveShowTargetControls,
    getAnnotationExperienceExpanded,
    saveAnnotationExperienceExpanded,
    getToolbarPosition,
    saveToolbarPosition,
    getToolbarCollapsed,
    saveToolbarCollapsed,
    getClearOnCopy,
    saveClearOnCopy,
    getBadgeColor,
    saveBadgeColor,
    getOverlayHidden,
    saveOverlayHidden,
    getSkipDeleteConfirm,
    saveSkipDeleteConfirm,
    getCustomShortcut,
    saveCustomShortcut
  };
})();
