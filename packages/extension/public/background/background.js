// Logbook Waypoint Background Service Worker

importScripts('../annotation-id.js');
importScripts('../annotation-status.js');
importScripts('../annotation-validation.js');
importScripts('../export-codec.js');
importScripts('queue-sync.js');
importScripts('source-identity-probe.js');
importScripts('variant-errors.js');
importScripts('variant-policy.js');

const MAX_IMAGE_ATTACHMENT_BYTES = 1024 * 1024;
const MAX_IMAGE_ATTACHMENT_DATA_URL_LENGTH = 1_400_000;
const MAX_IMAGE_ATTACHMENTS = 3;
const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

class WaypointAnnotationsBackground {
  constructor() {
    this.apiServerUrl = 'http://127.0.0.1:3846'; // Updated to match external server
    this.apiConnected = false;
    this._storageQueue = Promise.resolve(); // Serializes chrome.storage read-modify-write ops
    this.init();
  }

  // Serialize all storage mutations to prevent concurrent read-modify-write races
  _withStorageLock(fn) {
    this._storageQueue = this._storageQueue.then(fn, fn);
    return this._storageQueue;
  }

  init() {

    // Set up event listeners
    this.setupInstallListener();
    this.setupMessageListener();
    this.setupTabListener();
    this.setupStorageListener();

    // Re-register content scripts for user-enabled sites
    this.restoreEnabledSites();

    // One-time migration: mark existing annotations as synced
    this.migrateAnnotationStatuses().then(() => this.migrateSyncFlags());

    // Start API server connection monitoring
    this.startAPIConnectionMonitoring();
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
        
      if (details.reason === 'install') {
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });
  }

  async handleFirstInstall() {
    
    // Initialize storage with empty annotations array
    try {
      await chrome.storage.local.set({
        waypointAnnotations: [],
        waypointSettings: {
          version: '0.1.0',
          firstInstall: Date.now(),
          apiEnabled: false
        }
      });
      
    } catch (error) {
      console.error('Error setting up initial storage:', error);
    }
  }

  async handleUpdate(previousVersion) {
    try {
      const result = await chrome.storage.local.get(['waypointSettings']);
      const settings = result.waypointSettings || {};
      settings.lastUpdate = Date.now();
      settings.previousVersion = previousVersion;
      await chrome.storage.local.set({ waypointSettings: settings });
    } catch (error) {
      console.error('Error during update migration:', error);
    }
  }

  async migrateSyncFlags() {
    const result = await chrome.storage.local.get(['waypointAnnotations', 'waypointSyncFlagsMigrated']);
    if (result.waypointSyncFlagsMigrated) return;
    const annotations = WaypointAnnotationId.filterValid(result.waypointAnnotations);
    if (annotations.length) {
      let changed = false;
      for (const a of annotations) {
        if (!a._synced) { a._synced = true; changed = true; }
      }
      if (changed) await chrome.storage.local.set({ waypointAnnotations: annotations });
    }
    await chrome.storage.local.set({ waypointSyncFlagsMigrated: true });
  }

  async migrateAnnotationStatuses() {
    const result = await chrome.storage.local.get(['waypointAnnotations', 'waypointAnnotationStatusMigrated']);
    if (result.waypointAnnotationStatusMigrated) return;
    const annotations = WaypointAnnotationId.filterValid(result.waypointAnnotations);
    const normalized = WaypointAnnotationStatus.migrateLegacyAll(annotations);
    const updates = { waypointAnnotationStatusMigrated: true };
    if (JSON.stringify(annotations) !== JSON.stringify(normalized)) updates.waypointAnnotations = normalized;
    await chrome.storage.local.set(updates);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      
      switch (request.action) {
        case 'probeSourceIdentity':
          WaypointSourceIdentityProbe.run(request.targetId, sender)
            .then(result => sendResponse({ success: true, result }))
            .catch(() => sendResponse({ success: false, result: null }));
          break;

        case 'getAnnotations':
          this.getAnnotations(request.url)
            .then(annotations => sendResponse({ success: true, annotations }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'saveAnnotation':
          this.saveAnnotation(request.annotation)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'deleteAnnotation':
          this.deleteAnnotation(request.id)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'deleteAnnotationsByUrl':
          this.deleteAnnotationsByUrl(request.url)
            .then(({ count }) => sendResponse({ success: true, count }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;

        case 'updateAnnotation':
          this.updateAnnotation(request.id, request.updates)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;

        case 'claimAnnotation':
        case 'releaseAnnotation':
        case 'resolveAnnotation':
        case 'discardAnnotation':
          this.runLifecycleOperation(request.action, request.id, request.owner, request.url)
            .then(annotation => sendResponse({ success: true, annotation }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;

        case 'activateVariant':
        case 'discardVariant':
        case 'finalizeVariant':
          this.runVariantOperation(request.action, request.id, request.key)
            .then(annotation => sendResponse({ success: true, annotation }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'exportAnnotations':
          this.exportAnnotations(request.format)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'checkMCPStatus':
          this.checkAPIConnectionStatus()
            .then(status => sendResponse({ success: true, status }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'enableSite':
          this.enableSite(request.originPattern, request.tabId)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;

        case 'requestOptionalSitePermission':
          this.requestOptionalSitePermission(request.originPattern, sender?.tab?.url)
            .then(granted => sendResponse({ success: true, granted }))
            .catch(error => sendResponse({ success: false, granted: false, error: error.message }));
          break;

        case 'openPopupWithFocus':
          this.openPopupWithFocus(request.annotationId)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        case 'importAnnotations':
          this.importAnnotations(request.annotations)
            .then(result => sendResponse({ success: true, ...result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;

        case 'forceMCPSync':
          this.forceAPISync()
            .then(result => sendResponse({ success: true, ...result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
      
      return true; // Keep the message channel open for async response
    });
  }

  setupTabListener() {
    // Update badge when switching tabs
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (await this.isSupportedUrl(tab.url)) {
          await this.updateBadge(tab.id, tab.url);
        } else {
          await this.clearBadge(tab.id);
        }
      } catch (error) {
        console.error('Error updating badge on tab activation:', error);
      }
    });

    // Update badge when URL changes
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        if (await this.isSupportedUrl(tab.url)) {
          await this.updateBadge(tabId, tab.url);
        } else {
          await this.clearBadge(tabId);
        }
      }
    });

  }

  setupStorageListener() {
    // Listen for storage changes to sync data
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.waypointAnnotations) {
        this.onAnnotationsChanged(WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(changes.waypointAnnotations.newValue)));
      }
    });
  }

  async onAnnotationsChanged(annotations) {
    // Update badges for all localhost tabs
    // NOTE: Do NOT sync to server here — that's handled by smartSyncAnnotations (periodic),
    // saveAnnotation, deleteAnnotation, and importAnnotations. Syncing here causes races
    // because this fires on every storage write, including writes from smartSync itself.
    try {
      const tabs = await chrome.tabs.query({});
      const supportedTabs = [];
      for (const tab of tabs) {
        if (await this.isSupportedUrl(tab.url)) supportedTabs.push(tab);
      }

      for (const tab of supportedTabs) {
        await this.updateBadgeFromLocalStorage(tab.id, tab.url);
      }
    } catch (error) {
      console.error('Error updating badges after storage change:', error);
    }
  }

  async syncAnnotationsToAPI(annotations) {
    try {
      const normalized = WaypointAnnotationStatus.normalizeAll(annotations);
      WaypointAnnotationValidation.assertAll(normalized);
      for (const annotation of normalized) {
        this.validateAnnotationAttachments(annotation);
      }
      
      // Use the new sync endpoint to replace all annotations
      const response = await fetch(`${this.apiServerUrl}/api/annotations/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ annotations: normalized })
      });
      
      if (!response.ok) {
        throw new Error(`API sync error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync annotations');
      }
      
      await chrome.storage.local.set({
        waypointApiSyncPending: false,
        waypointApiLastSync: Date.now(),
        waypointApiSyncCount: normalized.length
      });
      
      
    } catch (error) {
      console.error('Error syncing annotations to API:', error);
      
      await chrome.storage.local.set({
        waypointApiSyncPending: true,
        waypointApiSyncError: error.message,
        waypointApiLastSync: Date.now()
      });
      
      throw error;
    }
  }

  async getAnnotations(url = null) {
    try {
      // Get annotations from API server
      let apiUrl = `${this.apiServerUrl}/api/annotations`;
      if (url) {
        apiUrl += `?url=${encodeURIComponent(url)}`;
      }
      
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API server error: ${response.status}`);
      }
      
      const result = await response.json();
      const annotations = WaypointAnnotationStatus.normalizeAll(result.annotations);
      
      
      return annotations;
    } catch (error) {
      console.error('[Background] Error getting annotations from API:', error);
      // Fallback to local storage if API fails
      const result = await chrome.storage.local.get(['waypointAnnotations']);
      const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));
      
      
      if (url) {
        const filtered = annotations.filter(annotation => {
          const match = annotation.url === url;
          return match;
        });
        return filtered;
      }
      
      return annotations;
    }
  }

  async runVariantOperation(action, id, key) {
    const operation = {
      activateVariant: { method: 'POST', suffix: 'activate' },
      discardVariant: { method: 'DELETE', suffix: '' },
      finalizeVariant: { method: 'POST', suffix: 'finalize' },
    }[action];
    if (!operation) throw new Error('Unknown Variant operation');
    const suffix = operation.suffix ? `/${operation.suffix}` : '';
    const response = await fetch(`${this.apiServerUrl}/api/annotations/${encodeURIComponent(id)}/variants/${encodeURIComponent(key)}${suffix}`, {
      method: operation.method,
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    if (!response.ok || !result.annotation) {
      const cleanup = WaypointVariantErrors.formatRemainingCleanup(result.remaining_cleanup);
      const remaining = cleanup ? ` Remaining cleanup: ${cleanup}` : '';
      throw new Error(`${result.error || `Variant operation failed (${response.status})`}${remaining}`);
    }
    await this._withStorageLock(async () => {
      const stored = await chrome.storage.local.get(['waypointAnnotations']);
      const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(stored.waypointAnnotations));
      const index = annotations.findIndex(annotation => annotation.id === id);
      if (index !== -1) {
        annotations[index] = WaypointAnnotationStatus.normalize(result.annotation);
        await chrome.storage.local.set({ waypointAnnotations: annotations });
      }
    });
    return WaypointAnnotationStatus.normalize(result.annotation);
  }

  async runLifecycleOperation(action, id, owner, url) {
    const operation = {
      claimAnnotation: 'claim',
      releaseAnnotation: 'release',
      resolveAnnotation: 'resolve',
      discardAnnotation: 'discard',
    }[action];
    if (!operation) throw new Error('Unknown lifecycle operation');
    if (!WaypointAnnotationId.isValid(id)) throw new Error('Invalid Waypoint annotation ID');

    const response = await fetch(`${this.apiServerUrl}/api/annotations/${encodeURIComponent(id)}/${operation}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, url }),
    });
    const result = await response.json();
    if (!response.ok || !result.annotation) {
      throw new Error(result.error || `Lifecycle operation failed (${response.status})`);
    }

    const annotation = { ...WaypointAnnotationStatus.normalize(result.annotation), _synced: true };
    await this._withStorageLock(async () => {
      const stored = await chrome.storage.local.get(['waypointAnnotations']);
      const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(stored.waypointAnnotations));
      const index = annotations.findIndex(candidate => candidate.id === id);
      if (index !== -1) {
        annotations[index] = annotation;
        await chrome.storage.local.set({ waypointAnnotations: annotations });
      }
    });
    return annotation;
  }

  async saveAnnotation(annotation) {
    return this._withStorageLock(async () => {
      try {
        annotation = WaypointAnnotationStatus.normalize(annotation);
        if (!WaypointAnnotationId.isValid(annotation?.id)) {
          throw new Error('Invalid Waypoint annotation ID');
        }
        this.validateAnnotationAttachments(annotation);
        const result = await chrome.storage.local.get(['waypointAnnotations']);
        const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));

        const existingIndex = annotations.findIndex(a => a.id === annotation.id);
        WaypointVariantPolicy.assertSaveAllowed(annotations[existingIndex], annotation);
        if (existingIndex >= 0) {
          annotations[existingIndex] = annotation;
        } else {
          annotations.push(annotation);
        }

        // Save to local storage FIRST (before API call that might hang)
        await chrome.storage.local.set({ waypointAnnotations: annotations });

        // Then try API server — mark as synced on success
        try {
          const savedAnnotation = await this.saveAnnotationToAPI(annotation);
          // Re-read and update _synced flag
          const fresh = await chrome.storage.local.get(['waypointAnnotations']);
          const arr = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(fresh.waypointAnnotations));
          const targetIndex = arr.findIndex(a => a.id === annotation.id);
          const target = arr[targetIndex];
          if (target && !target._synced) {
            arr[targetIndex] = savedAnnotation && WaypointAnnotationId.isValid(savedAnnotation.id)
              ? { ...WaypointAnnotationStatus.normalize(savedAnnotation), _synced: true }
              : { ...target, _synced: true };
            await chrome.storage.local.set({ waypointAnnotations: arr });
          }
        } catch (apiErr) {
          console.warn('Failed to save to API, will sync later:', apiErr.message);
        }

        // Force badge update for all tabs with this URL
        await this.updateBadgeForUrl(annotation.url);

      } catch (error) {
        console.error('Error saving annotation:', error);
        throw error;
      }
    });
  }

  async saveAnnotationToAPI(annotation) {
    try {
      this.validateAnnotationAttachments(annotation);
      const response = await fetch(`${this.apiServerUrl}/api/annotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(annotation)
      });
      
      if (!response.ok) {
        throw new Error(`API server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save annotation to API');
      }
      return result.annotation;
      
    } catch (error) {
      console.warn('Failed to save to API server, annotation saved locally:', error.message);
      throw error; // Re-throw so caller knows API failed (affects _synced flag)
    }
  }

  async deleteAnnotation(id) {
    return this._withStorageLock(async () => {
      try {
        if (!WaypointAnnotationId.isValid(id)) {
          throw new Error('Invalid Waypoint annotation ID');
        }
        const result = await chrome.storage.local.get(['waypointAnnotations', 'waypointDeletedAnnotationIds']);
        const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));
        const deletedIds = result.waypointDeletedAnnotationIds || [];
        const deletedAnnotation = annotations.find(annotation => annotation.id === id);
        WaypointVariantPolicy.assertDeleteAllowed(deletedAnnotation);

        const filteredAnnotations = annotations.filter(annotation => annotation.id !== id);

        // Track deletion so sync doesn't resurrect it from server
        if (!deletedIds.includes(id)) deletedIds.push(id);

        await chrome.storage.local.set({
          waypointAnnotations: filteredAnnotations,
          waypointDeletedAnnotationIds: deletedIds
        });

        // Also delete from API server
        try {
          await this.deleteAnnotationFromAPI(id);
        } catch (apiError) {
          console.warn('Failed to delete from API server:', apiError.message);
        }

        // Find the deleted annotation's URL to update badge
        if (deletedAnnotation) {
          await this.updateBadgeForUrl(deletedAnnotation.url);
        }

        await this.updateAllBadges();

      } catch (error) {
        console.error('Error deleting annotation:', error);
        throw error;
      }
    });
  }

  async deleteAnnotationsByUrl(url) {
    return this._withStorageLock(async () => {
      const result = await chrome.storage.local.get(['waypointAnnotations', 'waypointDeletedAnnotationIds']);
      const all = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));
      const deletedIds = result.waypointDeletedAnnotationIds || [];

      const toDelete = all.filter(a => a.url === url);
      for (const annotation of toDelete) WaypointVariantPolicy.assertDeleteAllowed(annotation);
      const remaining = all.filter(a => a.url !== url);

      for (const a of toDelete) {
        if (!deletedIds.includes(a.id)) deletedIds.push(a.id);
      }

      await chrome.storage.local.set({
        waypointAnnotations: remaining,
        waypointDeletedAnnotationIds: deletedIds
      });

      // Fire-and-forget API deletes
      for (const a of toDelete) {
        this.deleteAnnotationFromAPI(a.id).catch(() => {});
      }

      await this.updateBadgeForUrl(url);
      await this.updateAllBadges();

      return { count: toDelete.length };
    });
  }

  async deleteAnnotationFromAPI(id) {
    try {
      const response = await fetch(`${this.apiServerUrl}/api/annotations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`API delete error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete annotation from API');
      }
      
      console.log('[Background] Annotation deleted from API:', id);
    } catch (error) {
      console.error('[Background] Error deleting annotation from API:', error);
      throw error;
    }
  }

  async updateAnnotation(id, updates) {
    return this._withStorageLock(async () => {
      try {
        if (!WaypointAnnotationId.isValid(id)) {
          throw new Error('Invalid Waypoint annotation ID');
        }
        if (updates?.id !== undefined && updates.id !== id) {
          throw new Error('Annotation ID cannot be changed');
        }
        updates = WaypointAnnotationStatus.normalizeUpdate(updates);
        const result = await chrome.storage.local.get(['waypointAnnotations']);
        const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));

        const annotationIndex = annotations.findIndex(annotation => annotation.id === id);
        if (annotationIndex === -1) {
          throw new Error('Annotation not found');
        }
        WaypointVariantPolicy.assertUpdateAllowed(annotations[annotationIndex], updates);

        annotations[annotationIndex] = {
          ...annotations[annotationIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };

        await chrome.storage.local.set({ waypointAnnotations: annotations });

        await this.updateBadgeForUrl(annotations[annotationIndex].url);

      } catch (error) {
        console.error('Error updating annotation:', error);
        throw error;
      }
    });
  }

  async exportAnnotations(format = 'json') {
    try {
      const annotations = await this.getAnnotations();
      
      switch (format) {
        case 'json':
          return JSON.stringify(WaypointExportCodec.createExportEnvelope(annotations), null, 2);
          
        case 'csv':
          return this.annotationsToCSV(annotations);
          
        case 'mcp':
          return WaypointExportCodec.createExportEnvelope(annotations);
          
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting annotations:', error);
      throw error;
    }
  }

  annotationsToCSV(annotations) {
    const headers = ['ID', 'URL', 'Comment', 'Status', 'Element', 'Created', 'Updated'];
    const rows = annotations.map(annotation => [
      annotation.id,
      annotation.url,
      `"${annotation.comment.replace(/"/g, '""')}"`,
      annotation.status,
      annotation.selector,
      annotation.created_at,
      annotation.updated_at
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  async updateBadge(tabId, url) {
    try {
      const annotations = await this.getAnnotations(url);
      const counts = WaypointAnnotationStatus.countActionable(annotations);
      const actionableCount = counts.pending + counts.claimed;
      
      
      if (actionableCount > 0) {
        await chrome.action.setBadgeText({
          tabId: tabId,
          text: actionableCount.toString()
        });
        
        // Set badge color based on server status
        const badgeColor = this.apiConnected ? '#10b981' : '#FF7A00'; // Green if online, orange if offline
        await chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: badgeColor
        });
        
        await chrome.action.setTitle({
          tabId: tabId,
          title: `Logbook Waypoint - ${actionableCount} actionable annotation${actionableCount === 1 ? '' : 's'} (${counts.pending} pending, ${counts.claimed} claimed)`
        });
      } else {
        await this.clearBadge(tabId);
      }
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }

  // Direct badge update from local storage (bypasses API)
  async updateBadgeFromLocalStorage(tabId, url) {
    try {
      const result = await chrome.storage.local.get(['waypointAnnotations']);
      const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));
      const urlAnnotations = annotations.filter(a => a.url === url);
      const counts = WaypointAnnotationStatus.countActionable(urlAnnotations);
      const actionableCount = counts.pending + counts.claimed;
      
      
      if (actionableCount > 0) {
        await chrome.action.setBadgeText({
          tabId: tabId,
          text: actionableCount.toString()
        });
        
        // Set badge color based on server status
        const badgeColor = this.apiConnected ? '#10b981' : '#FF7A00'; // Green if online, orange if offline
        await chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: badgeColor
        });
        
        await chrome.action.setTitle({
          tabId: tabId,
          title: `Logbook Waypoint - ${actionableCount} actionable annotation${actionableCount === 1 ? '' : 's'} (${counts.pending} pending, ${counts.claimed} claimed)`
        });
      } else {
        await this.clearBadge(tabId);
      }
    } catch (error) {
      console.error('Error updating badge from local storage:', error);
    }
  }

  async clearBadge(tabId) {
    try {
      await chrome.action.setBadgeText({ tabId: tabId, text: '' });
      await chrome.action.setTitle({ 
        tabId: tabId, 
        title: 'Logbook Waypoint'
      });
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  async updateBadgeForUrl(url) {
    try {
      const tabs = await chrome.tabs.query({ url: url });
      for (const tab of tabs) {
        // Use direct local storage update for immediate response
        await this.updateBadgeFromLocalStorage(tab.id, url);
      }
    } catch (error) {
      console.error('Error updating badge for URL:', url, error);
    }
  }

  async updateAllBadges() {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (await this.isSupportedUrl(tab.url)) {
          await this.updateBadge(tab.id, tab.url);
        }
      }
    } catch (error) {
      console.error('Error updating all badges:', error);
    }
  }

  async checkAPIConnectionStatus() {
    try {
      const response = await fetch(`${this.apiServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        this.apiConnected = true;
        
        // Check version compatibility
        const extensionVersion = chrome.runtime.getManifest().version;
        let versionCompatible = true;
        let compatibilityMessage = null;
        
        if (data.minExtensionVersion) {
          const extensionParts = extensionVersion.split('.').map(Number);
          const minParts = data.minExtensionVersion.split('.').map(Number);
          
          for (let i = 0; i < 3; i++) {
            if ((extensionParts[i] || 0) < (minParts[i] || 0)) {
              versionCompatible = false;
              compatibilityMessage = `Extension update required. Minimum version: ${data.minExtensionVersion}`;
              break;
            }
            if ((extensionParts[i] || 0) > (minParts[i] || 0)) {
              break;
            }
          }
        }

        return {
          connected: true,
          server_url: this.apiServerUrl,
          server_version: data.version,
          server_status: data.status,
          version_compatible: versionCompatible,
          compatibility_message: compatibilityMessage,
          last_check: new Date().toISOString()
        };
      } else {
        this.apiConnected = false;
        return {
          connected: false,
          server_url: this.apiServerUrl,
          error: `Server returned ${response.status}`,
          last_check: new Date().toISOString()
        };
      }
    } catch (error) {
      this.apiConnected = false;
      return {
        connected: false,
        server_url: this.apiServerUrl,
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  startAPIConnectionMonitoring() {
    // Check connection immediately
    this.checkAPIConnectionStatus().then(() => {
      // Update all badges after initial check
      this.updateAllBadges();
    });
    
    // Check connection every 10 seconds and update badges
    setInterval(async () => {
      const wasConnected = this.apiConnected;
      await this.checkAPIConnectionStatus();
      
      // Update badges when connection status changes
      if (wasConnected !== this.apiConnected) {
        await this.updateAllBadges();
      }
      
      // If server is online, smart sync annotations (bidirectional with conflict resolution)
      if (this.apiConnected) {
        await this.smartSyncAnnotations();
      }
    }, 10000);
  }

  async smartSyncAnnotations() {
    // Fetch server state OUTSIDE the lock (network I/O shouldn't block storage writes)
    let serverAnnotations;
    try {
      const response = await fetch(`${this.apiServerUrl}/api/annotations?limit=0`);
      if (!response.ok) return;
      const serverResult = await response.json();
      if (!Array.isArray(serverResult.annotations)) return; // Unexpected response (e.g. multi-project warning) — skip sync
      serverAnnotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(serverResult.annotations));
      for (const annotation of serverAnnotations) {
        this.validateAnnotationAttachments(annotation);
      }
    } catch {
      return; // Server unreachable, skip sync
    }

    // Merge inside the storage lock to serialize against save/delete/import
    return this._withStorageLock(async () => {
      try {
        const localResult = await chrome.storage.local.get(['waypointAnnotations', 'waypointDeletedAnnotationIds']);
        const localAnnotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(localResult.waypointAnnotations));
        const deletedIds = new Set(
          (localResult.waypointDeletedAnnotationIds || []).filter(WaypointAnnotationId.isValid),
        );

        const mergeResult = WaypointQueueSync.merge(localAnnotations, serverAnnotations, deletedIds);
        const merged = mergeResult.annotations;
        const { changed, flagsChanged } = mergeResult;
        const serverMap = new Map(serverAnnotations.map(annotation => [annotation.id, annotation]));

        // Always persist _synced flag updates even if content didn't change
        if (!changed && !flagsChanged) return;

        // Persist merged result locally
        await chrome.storage.local.set({
          waypointAnnotations: merged,
          waypointLastServerSync: Date.now()
        });

        // Push merged result to server only if content changed
        if (changed) {
          try {
            await this.syncAnnotationsToAPI(merged);
            // Mark all as synced
            let needsUpdate = false;
            for (const a of merged) {
              if (!a._synced) { a._synced = true; needsUpdate = true; }
            }
            if (needsUpdate) {
              await chrome.storage.local.set({ waypointAnnotations: merged });
            }
          } catch (e) {
            console.warn('Failed to push merged annotations to server:', e.message);
          }
        }

        // Delete server-side tombstoned annotations
        for (const id of deletedIds) {
          if (serverMap.has(id)) {
            this.deleteAnnotationFromAPI(id).catch(() => {});
          }
        }

        const activeTombstones = [...deletedIds].filter(id => serverMap.has(id));
        await chrome.storage.local.set({ waypointDeletedAnnotationIds: activeTombstones });

        console.log(`[Waypoint] Sync complete — merged: ${merged.length} annotations`);
        await this.updateAllBadges();

        // Notify content scripts to refresh
        try {
          const tabs = await chrome.tabs.query({});
          for (const tab of tabs) {
            if (await this.isSupportedUrl(tab.url)) {
              chrome.tabs.sendMessage(tab.id, { action: 'annotationsUpdated' }).catch(() => {});
            }
          }
        } catch { /* ignore */ }

      } catch (error) {
        console.error('Error during smart sync:', error);
      }
    });
  }


  isLocalhostUrl(url) {
    if (!url) return false;

    try {
      const urlObj = new URL(url);

      // Check localhost URLs
      if (urlObj.hostname === 'localhost' ||
          urlObj.hostname === '127.0.0.1' ||
          urlObj.hostname === '0.0.0.0') {
        return true;
      }

      // Check .local, .test, .localhost development domains
      if (urlObj.hostname.endsWith('.local') ||
          urlObj.hostname.endsWith('.test') ||
          urlObj.hostname.endsWith('.localhost')) {
        return true;
      }

      // Check file URLs - only allow HTML files
      if (urlObj.protocol === 'file:') {
        const path = urlObj.pathname.toLowerCase();
        const htmlExtensions = ['.html', '.htm'];

        // Allow .html/.htm files or files with no extension
        return htmlExtensions.some(ext => path.endsWith(ext)) ||
               (!path.includes('.') || path.endsWith('/'));
      }

      return false;
    } catch {
      return false;
    }
  }

  async isEnabledSite(url) {
    if (!url) return false;
    try {
      const origin = new URL(url).origin + '/*';
      const result = await chrome.storage.local.get(['waypointEnabledSites']);
      const sites = result.waypointEnabledSites || [];
      return sites.includes(origin);
    } catch {
      return false;
    }
  }

  validateAnnotationAttachments(annotation) {
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

  async requestOptionalSitePermission(originPattern, senderUrl) {
    const url = new URL(originPattern);
    const sender = new URL(senderUrl);
    if (
      !['http:', 'https:'].includes(url.protocol)
      || url.pathname !== '/*'
      || url.search
      || url.hash
      || originPattern !== `${url.origin}/*`
      || url.origin !== sender.origin
    ) {
      throw new Error('Invalid optional site origin');
    }

    const granted = await chrome.permissions.request({ origins: [originPattern] });
    if (!granted) return false;
    const result = await chrome.storage.local.get(['waypointEnabledSites']);
    const sites = result.waypointEnabledSites || [];
    if (!sites.includes(originPattern)) {
      await chrome.storage.local.set({ waypointEnabledSites: [...sites, originPattern] });
    }
    await this.enableSite(originPattern, null);
    return true;
  }

  async isSupportedUrl(url) {
    return this.isLocalhostUrl(url) || await this.isEnabledSite(url);
  }

  async restoreEnabledSites() {
    try {
      const result = await chrome.storage.local.get(['waypointEnabledSites']);
      const sites = result.waypointEnabledSites || [];
      for (const originPattern of sites) {
        // Only register if permission is still granted
        const has = await chrome.permissions.contains({ origins: [originPattern] });
        if (has) {
          await this.enableSite(originPattern, null);
        }
      }
    } catch (err) {
      console.error('Error restoring enabled sites:', err);
    }
  }

  async enableSite(originPattern, tabId) {
    // Register dynamic content scripts for this origin
    const scriptId = 'waypoint-' + originPattern.replace(/[^a-zA-Z0-9]/g, '_');
    const legacyPageScriptId = scriptId + '_bridge';

    try {
      // Unregister first in case it already exists
      await chrome.scripting.unregisterContentScripts({ ids: [scriptId] }).catch(() => {});
      await chrome.scripting.unregisterContentScripts({ ids: [legacyPageScriptId] }).catch(() => {});

      await chrome.scripting.registerContentScripts([{
        id: scriptId,
        matches: [originPattern],
        js: [
          'annotation-id.js',
          'annotation-status.js',
          'annotation-validation.js',
          'export-codec.js',
          'agent-setup-config.js',
          'content/modules/event-bus.js',
          'content/modules/styles.js',
          'content/modules/shadow-host.js',
          'content/modules/theme-manager.js',
          'background/variant-policy.js',
          'content/modules/api-bridge.js',
          'content/modules/shadow-dom-utils.js',
          'content/modules/source-identity.js',
          'content/modules/element-context.js',
          'content/modules/badge-manager.js',
          'content/modules/inspection-mode.js',
          'content/modules/keyboard-target.js',
          'content/modules/variant-picker.js',
          'content/modules/annotation-popover.js',
          'content/modules/floating-toolbar.js',
          'content/content.js'
        ],
        runAt: 'document_idle',
        persistAcrossSessions: true
      }]);

    } catch (err) {
      console.error('Failed to register content scripts:', err);
      throw err;
    }

    // Reload the tab so scripts inject cleanly
    if (tabId) {
      await chrome.tabs.reload(tabId);
    }
  }

  async openPopupWithFocus(annotationId) {
    try {
      // Since we can't programmatically open the popup in MV3,
      // we'll just store the focused annotation ID for when the popup is opened
      
      // The focusedAnnotationId is already stored by the content script
      // This method exists mainly for completeness and potential future use
      return true;
    } catch (error) {
      console.error('Error handling popup focus request:', error);
      throw error;
    }
  }

  async forceAPISync() {
    try {
      // Get all annotations from storage
      const result = await chrome.storage.local.get(['waypointAnnotations']);
      const annotations = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));
      
      // Force sync to API
      await this.syncAnnotationsToAPI(annotations);
      
      
      return {
        count: annotations.length,
        message: `Synced ${annotations.length} annotations to API server`
      };
      
    } catch (error) {
      console.error('Error in forced API sync:', error);
      throw error;
    }
  }

  async importAnnotations(newAnnotations) {
    if (!Array.isArray(newAnnotations) || !newAnnotations.length) {
      return { imported: 0 };
    }

    newAnnotations = WaypointAnnotationStatus.normalizeAll(newAnnotations);
    WaypointAnnotationValidation.assertAll(newAnnotations);

    return this._withStorageLock(async () => {
      const result = await chrome.storage.local.get(['waypointAnnotations', 'waypointDeletedAnnotationIds']);
      const all = WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(result.waypointAnnotations));
      const deletedIds = result.waypointDeletedAnnotationIds || [];
      const existingIds = new Set(all.map(a => a.id));

      let imported = 0;
      const importedIds = [];
      for (const a of newAnnotations) {
        if (!WaypointAnnotationId.isValid(a?.id)) {
          throw new Error('Invalid Waypoint annotation ID');
        }
        this.validateAnnotationAttachments(a);
        if (!existingIds.has(a.id)) {
          WaypointVariantPolicy.assertSaveAllowed(null, a);
          all.push(a);
          existingIds.add(a.id);
          importedIds.push(a.id);
          imported++;
        }
      }

      if (imported > 0) {
        // Clear imported IDs from tombstone list so smartSync doesn't remove them
        const cleanedTombstones = deletedIds.filter(id => !importedIds.includes(id));
        await chrome.storage.local.set({
          waypointAnnotations: all,
          waypointDeletedAnnotationIds: cleanedTombstones
        });

        // Sync to server immediately and mark as synced
        try {
          await this.syncAnnotationsToAPI(all);
          let flagsChanged = false;
          for (const a of all) {
            if (!a._synced) { a._synced = true; flagsChanged = true; }
          }
          if (flagsChanged) {
            await chrome.storage.local.set({ waypointAnnotations: all });
          }
        } catch (e) {
          console.warn('Failed to sync imported annotations to server:', e.message);
        }

        await this.updateAllBadges();
      }

      return { imported, total: all.length };
    });
  }

}

// Initialize the background service worker
const bg = new WaypointAnnotationsBackground();

// Keyboard shortcut commands (chrome.commands)
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'toggle-annotate' && tab?.id && await bg.isSupportedUrl(tab.url)) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleAnnotate' });
    } catch { /* Content script not loaded */ }
  }
});

// No onClicked handler — popup.html handles all interaction
