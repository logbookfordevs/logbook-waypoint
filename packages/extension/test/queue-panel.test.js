import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

const queuePanelUrl = new URL('../.output/chrome-mv3/content/modules/queue-panel.js', import.meta.url);
const toolbarUrl = new URL('../public/content/modules/floating-toolbar.js', import.meta.url);
const statusUrl = new URL('../.output/chrome-mv3/annotation-status.js', import.meta.url);

function createHarness(annotations, {
  projectAnnotations,
  siteAccess = true,
  syncStatus = { connected: true, pending_count: 0 },
  syncNow = async () => ({ connected: true, pending_count: 0 }),
} = {}) {
  const { window } = parseHTML('<html><body><div id="root"></div><button id="target">Target</button></body></html>');
  window.innerHeight = 900;
  window.innerWidth = 1200;
  window.location = new URL('http://localhost:3000/settings/members');
  const listeners = new Map();
  const emitted = [];
  const root = window.document.querySelector('#root');
  const clipboardWrites = [];
  const downloads = [];
  const downloadBlobs = [];
  const discarded = [];
  const deleted = [];
  class HarnessURL extends URL {}
  HarnessURL.createObjectURL = blob => {
    downloadBlobs.push(blob);
    return 'blob:waypoint-export';
  };
  HarnessURL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function click() {
    downloads.push({ filename: this.download, href: this.href });
  };
  const context = vm.createContext({
    window,
    document: window.document,
    navigator: { platform: 'MacIntel', clipboard: { writeText: async value => clipboardWrites.push(value) } },
    chrome: { runtime: { getURL: path => path, getManifest: () => ({ version: '1.0.0' }) } },
    Blob,
    URL: HarnessURL,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout,
    clearTimeout,
    globalThis: null,
  });
  context.globalThis = context;
  root.host = { style: { setProperty: () => {} } };
  context.WaypointShadowHost = { getRoot: () => root };
  context.WaypointThemeManager = { getPreference: () => 'system' };
  context.WaypointExportCodec = {
    createExportEnvelope: (selectedAnnotations, options) => ({
      waypoint_annotations_export: true,
      annotations: selectedAnnotations,
      ...options,
    }),
    formatAnnotationsAsMarkdown: selectedAnnotations => selectedAnnotations.map(annotation => annotation.comment).join('\n'),
    getAnnotationRoute: annotation => new URL(annotation.url).pathname,
  };
  context.WaypointElementContext = {
    findElementBySelector: () => context.document.querySelector('#target'),
  };
  context.WaypointEvents = {
    on: (name, listener) => listeners.set(name, listener),
    emit: (name, payload) => emitted.push({ name, payload }),
  };
  context.WaypointAPI = {
    getToolbarCollapsed: async () => false,
    getClearOnCopy: async () => false,
    getScreenshotEnabled: async () => true,
    getShowDesignActions: async () => true,
    getBadgeColor: async () => '#4b5563',
    getCustomShortcut: async () => null,
    checkServerStatus: async () => ({ connected: true }),
    getToolbarPosition: async () => null,
    getSkipDeleteConfirm: async () => true,
    hasCurrentSiteAccess: async () => siteAccess,
    requestOptionalSitePermission: async () => true,
    getSyncStatus: async () => syncStatus,
    syncNow,
    loadAnnotations: async () => annotations,
    loadProjectAnnotations: async () => projectAnnotations || [
      ...annotations,
      {
        id: 'waypoint_1750000000009_otherroute',
        url: 'http://localhost:3000/dashboard?tab=activity#today',
        status: 'claimed',
        comment: 'Other route request',
        selector: 'main',
      },
    ],
    discardAnnotation: async (id, owner, url) => {
      discarded.push({ id, owner, url });
      return { ...annotations.find(annotation => annotation.id === id), status: 'discarded' };
    },
    deleteAnnotation: async id => {
      deleted.push(id);
      return true;
    },
    deleteAnnotationsByUrl: async () => true,
  };

  return {
    clipboardWrites,
    context,
    deleted,
    discarded,
    downloadBlobs,
    downloads,
    emitted,
    root,
  };
}

async function openQueue(annotations, options) {
  const harness = createHarness(annotations, options);
  const [statusSource, queuePanelSource, toolbarSource] = await Promise.all([
    readFile(statusUrl, 'utf8'),
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(statusSource, harness.context, { filename: 'annotation-status.js' });
  vm.runInContext(queuePanelSource, harness.context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, harness.context, { filename: 'floating-toolbar.js' });
  await harness.context.WaypointToolbar.init();
  harness.root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));
  return harness;
}

test('toolbar Queue button opens an anchored panel with current-route Annotations', async () => {
  const annotations = [
    {
      id: 'waypoint_1750000000000_abc123xyz',
      url: 'http://localhost:3000/settings/members',
      status: 'pending',
      comment: 'Make the invitation action easier to scan',
      selector: '#target',
      screenshot: { id: 'screenshot_1' },
      attachments: [{ id: 'attachment_1', name: 'reference.png', mime_type: 'image/png', size_bytes: 1200 }],
      design_intent: { schema_version: 1, workflow: 'impeccable', action: 'polish' },
      pending_changes: { width: { original: '576px', value: '678.42px' } },
    },
  ];
  const { root } = await openQueue(annotations);

  const panel = root.querySelector('.waypoint-queue-panel');
  assert.notEqual(panel, null);
  assert.equal(panel.getAttribute('role'), 'dialog');
  assert.match(panel.textContent, /Queue/);
  assert.match(panel.textContent, /Make the invitation action easier to scan/);
  assert.match(panel.textContent, /Pending/);
  const legend = panel.querySelector('.waypoint-queue-signal-key');
  const panelSections = [...panel.children];
  assert.ok(panelSections.indexOf(legend) < panelSections.indexOf(panel.querySelector('.waypoint-queue-views')));
  assert.match(legend.textContent, /Indicators/);
  assert.match(legend.textContent, /File/);
  assert.equal(legend.querySelector('[data-signal="design-action-key"]').getAttribute('aria-label'), 'Design action');
  assert.match(legend.textContent, /CSS/);
  assert.match(legend.textContent, /Screenshot/);

  const signals = panel.querySelector('.waypoint-queue-signals');
  assert.equal(signals.querySelector('[data-signal="attachment"]').getAttribute('aria-label'), '1 uploaded file');
  assert.equal(signals.querySelector('[data-signal="design-action"]').getAttribute('aria-label'), 'Design Action: Polish');
  assert.equal(signals.querySelector('[data-signal="css"]').getAttribute('aria-label'), 'Custom CSS override');
  assert.equal(signals.querySelector('[data-signal="screenshot"]').getAttribute('aria-label'), 'Automatic screenshot');
});

test('Queue remains available on an empty current route so other-route work stays reachable', async () => {
  const { root } = await openQueue([]);
  const queueButton = root.querySelector('.waypoint-tb-queue');
  assert.equal(queueButton.disabled, false);

  assert.match(root.querySelector('.waypoint-queue-list').textContent, /No active annotations on this route/);
  assert.match(root.querySelector('.waypoint-queue-header').textContent, /1 other route/);
});

test('Queue keeps manual synchronization retryable while the server is unavailable', async () => {
  let attempts = 0;
  const { root } = await openQueue([], {
    syncStatus: { connected: false, pending_count: 1 },
    syncNow: async () => {
      attempts += 1;
      return { connected: true, pending_count: 0 };
    },
  });
  const button = root.querySelector('.waypoint-queue-sync-now');

  assert.equal(button.disabled, false);
  button.click();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(attempts, 1);
  assert.equal(button.disabled, false);
  assert.match(root.querySelector('.waypoint-queue-sync-status').textContent, /Up to date/);
});

test('settings show existing site access without an Enable action', async () => {
  const { root } = await openQueue([]);
  root.querySelector('.waypoint-queue-close').click();
  root.querySelector('.waypoint-tb-settings').click();
  await new Promise(resolve => setImmediate(resolve));

  const button = root.querySelector('.waypoint-site-permission-btn');
  assert.equal(button.textContent, 'Enabled');
  assert.equal(button.disabled, true);
  assert.match(root.querySelector('.waypoint-setting-description').textContent, /already enabled/i);
});

test('settings retain Enable when the current site lacks persistent access', async () => {
  const { root } = await openQueue([], { siteAccess: false });
  root.querySelector('.waypoint-queue-close').click();
  root.querySelector('.waypoint-tb-settings').click();
  await new Promise(resolve => setImmediate(resolve));

  const button = root.querySelector('.waypoint-site-permission-btn');
  assert.equal(button.textContent, 'Enable');
  assert.equal(button.disabled, false);
  assert.match(root.querySelector('.waypoint-setting-description').textContent, /enable annotation access/i);
});

test('clicking delete all closes an open Queue through outside-click handling', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_deleteall',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Remove this annotation',
    selector: '#target',
  };
  const { context, root } = await openQueue([annotation]);

  assert.notEqual(root.querySelector('.waypoint-queue-panel'), null);
  const deleteAllButton = root.querySelector('.waypoint-tb-delete');
  deleteAllButton.removeAttribute('disabled');
  deleteAllButton.dispatchEvent(new context.window.Event('click', { bubbles: true, composed: true }));

  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});

test('Queue separates actionable Annotations from retained History', async () => {
  const annotations = [
    { id: 'waypoint_1750000000000_pending', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'Pending request', selector: '#target' },
    { id: 'waypoint_1750000000001_claimed', url: 'http://localhost:3000/settings/members', status: 'claimed', comment: 'Claimed request', selector: '#target', claim: { owner: 'agent' } },
    { id: 'waypoint_1750000000002_resolved', url: 'http://localhost:3000/settings/members', status: 'resolved', comment: 'Resolved request', selector: '#target' },
    { id: 'waypoint_1750000000003_discarded', url: 'http://localhost:3000/settings/members', status: 'discarded', comment: 'Discarded request', selector: '#target' },
  ];
  const { root } = await openQueue(annotations);

  const list = root.querySelector('.waypoint-queue-list');
  assert.match(list.textContent, /Pending request/);
  assert.match(list.textContent, /Claimed request/);
  assert.doesNotMatch(list.textContent, /Resolved request/);
  assert.doesNotMatch(list.textContent, /Discarded request/);

  root.querySelector('.waypoint-queue-history-view').click();
  const historyList = root.querySelector('.waypoint-queue-list');
  assert.doesNotMatch(historyList.textContent, /Pending request/);
  assert.doesNotMatch(historyList.textContent, /Claimed request/);
  assert.match(historyList.textContent, /Resolved request/);
  assert.match(historyList.textContent, /Discarded request/);
});

test('Queue summarizes captured Target context and pending Variant Intent', async () => {
  const annotations = [
    {
      id: 'waypoint_1750000000000_context',
      url: 'http://localhost:3000/settings/members',
      status: 'pending',
      comment: 'Try multiple treatments',
      selector: '#opaque-generated-selector',
      element_context: { tag: 'button', text: 'Send invitation', classes: ['primary'] },
      variant_intent: { requested: true, default_count: 3 },
    },
    {
      id: 'waypoint_1750000000001_component',
      url: 'http://localhost:3000/settings/members',
      status: 'pending',
      comment: 'Polish the checkout action',
      selector: '#checkout-action',
      component_name: 'CheckoutButton',
    },
  ];
  const { root } = await openQueue(annotations);

  const queueText = root.querySelector('.waypoint-queue-list').textContent;
  assert.match(queueText, /<button> “Send invitation”/);
  assert.match(queueText, /Variants requested/);
  assert.match(queueText, /CheckoutButton/);
  assert.doesNotMatch(queueText, /opaque-generated-selector|checkout-action/);
});

test('Queue gives commentless text edits a meaningful title', async () => {
  const annotation = {
    id: 'waypoint_1750000000002_commentless',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: '',
    selector: '#target',
    element_context: { tag: 'button', text: 'Old' },
    pending_changes: {
      copyChange: { original: 'Old', value: 'New' },
    },
  };
  const { root } = await openQueue([annotation]);

  const title = root.querySelector('.waypoint-queue-comment');
  assert.equal(title.textContent, 'Text content edit');
  assert.doesNotMatch(root.querySelector('.waypoint-queue-list').textContent, /undefined|untitled/i);
});

test('Queue keeps permanent deletion secondary and requires an explicit confirmation', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'discarded',
    comment: 'Historical request',
    selector: '#target',
  };
  const { deleted, root } = await openQueue([annotation]);
  root.querySelector('.waypoint-queue-history-view').click();
  root.querySelector('.waypoint-queue-delete').click();
  assert.equal(deleted.length, 0);
  assert.match(root.querySelector('.waypoint-queue-row-menu').textContent, /Delete this annotation permanently\?/);

  root.querySelector('.waypoint-queue-confirm-delete').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(deleted, [annotation.id]);
  assert.notEqual(root.querySelector('.waypoint-queue-panel'), null);
  assert.equal(root.querySelector('.waypoint-queue-history-view').getAttribute('aria-pressed'), 'true');
  assert.match(root.querySelector('.waypoint-queue-list').textContent, /No history on this route/);
});

test('Queue previews and confirms scoped permanent history cleanup', async () => {
  const now = Date.now();
  const annotations = [
    { id: 'waypoint_1750000000000_olddiscarded', url: 'http://localhost:3000/settings/members', status: 'discarded', comment: 'Old discarded', selector: '#target', updated_at: new Date(now - 45 * 86400000).toISOString() },
    { id: 'waypoint_1750000000001_oldresolved', url: 'http://localhost:3000/settings/members', status: 'resolved', comment: 'Old resolved', selector: '#target', updated_at: new Date(now - 45 * 86400000).toISOString() },
    { id: 'waypoint_1750000000002_recentdiscarded', url: 'http://localhost:3000/settings/members', status: 'discarded', comment: 'Recent discarded', selector: '#target', updated_at: new Date(now - 2 * 86400000).toISOString() },
  ];
  const deletedIds = annotations.slice(0, 2).map(annotation => annotation.id);
  const { context, deleted, root } = await openQueue(annotations);
  root.querySelector('.waypoint-queue-history-view').click();
  root.querySelector('.waypoint-queue-clear-history').click();

  const status = root.querySelector('.waypoint-queue-cleanup-status');
  const age = root.querySelector('.waypoint-queue-cleanup-age');
  status.querySelector('[value="discarded"]').removeAttribute('selected');
  status.querySelector('[value="terminal"]').setAttribute('selected', '');
  status.dispatchEvent(new context.window.Event('change'));
  age.dispatchEvent(new context.window.Event('change'));

  assert.match(root.querySelector('.waypoint-queue-cleanup-preview').textContent, /2 annotations/);
  assert.equal(root.querySelector('.waypoint-queue-confirm-cleanup').textContent, 'Delete');
  assert.equal(deleted.length, 0);
  root.querySelector('.waypoint-queue-confirm-cleanup').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(deleted, deletedIds);
  assert.doesNotMatch(root.querySelector('.waypoint-queue-list').textContent, /Old discarded|Old resolved/);
  assert.match(root.querySelector('.waypoint-queue-list').textContent, /Recent discarded/);
});

test('Queue offers compact access to other routes without replacing its route-first opening view', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Current route request',
    selector: '#target',
  };
  const { root } = await openQueue([annotation]);

  assert.match(root.querySelector('.waypoint-queue-list').textContent, /Current route request/);
  assert.doesNotMatch(root.querySelector('.waypoint-queue-list').textContent, /Other route request/);
  root.querySelector('.waypoint-queue-other-routes').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.match(root.querySelector('.waypoint-queue-list').textContent, /\/dashboard\?tab=activity#today/);
  root.querySelector('[data-route="/dashboard?tab=activity#today"]').click();
  assert.match(root.querySelector('.waypoint-queue-list').textContent, /Other route request/);
  assert.match(root.querySelector('.waypoint-queue-header').textContent, /dashboard\?tab=activity#today/);
});

test('Queue navigates to another route without resolving its Target in the current document', async () => {
  const current = {
    id: 'waypoint_1750000000000_current',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Current route request',
    selector: '#target',
  };
  const other = {
    id: 'waypoint_1750000000001_other',
    url: 'http://localhost:3000/dashboard?tab=activity#today',
    status: 'pending',
    comment: 'Other route request',
    selector: '#target',
  };
  const { context, emitted, root } = await openQueue([current], { projectAnnotations: [current, other] });

  root.querySelector('.waypoint-queue-other-routes').click();
  root.querySelector('[data-route="/dashboard?tab=activity#today"]').click();
  const routeAction = root.querySelector('.waypoint-queue-open');
  assert.equal(routeAction.textContent, 'Go to route');
  routeAction.click();

  assert.equal(context.window.location.href, other.url);
  assert.equal(emitted.some(event => event.name === 'annotation:edit'), false);
});

test('Queue history cleanup mutates its route collection so deleted rows do not return after navigation', async () => {
  const old = {
    id: 'waypoint_1750000000000_old',
    url: 'http://localhost:3000/settings/members',
    status: 'discarded',
    comment: 'Delete for good',
    selector: '#target',
    updated_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  };
  const { root } = await openQueue([old]);

  root.querySelector('.waypoint-queue-history-view').click();
  root.querySelector('.waypoint-queue-clear-history').click();
  root.querySelector('.waypoint-queue-cleanup-age [value="30"]').setAttribute('selected', '');
  root.querySelector('.waypoint-queue-confirm-cleanup').click();
  await new Promise(resolve => setImmediate(resolve));
  root.querySelector('.waypoint-queue-other-routes').click();
  root.querySelector('.waypoint-queue-current-route').click();
  root.querySelector('.waypoint-queue-history-view').click();

  assert.doesNotMatch(root.querySelector('.waypoint-queue-list').textContent, /Delete for good/);
});

test('Queue requires confirmation before discarding selected Annotations through lifecycle operations', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Remove this request',
    selector: '#target',
  };
  const { context, discarded, root } = await openQueue([annotation]);
  const input = root.querySelector('.waypoint-queue-select');
  input.checked = true;
  input.dispatchEvent(new context.window.Event('click'));
  root.querySelector('.waypoint-queue-discard-selected').click();

  assert.equal(discarded.length, 0);
  assert.match(root.querySelector('.waypoint-queue-actions').textContent, /Discard 1 annotation\?/);

  root.querySelector('.waypoint-queue-confirm-discard').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(discarded, [{ id: annotation.id, owner: undefined, url: annotation.url }]);
  assert.notEqual(root.querySelector('.waypoint-queue-panel'), null);
  assert.equal(root.querySelector('.waypoint-queue-active-view').getAttribute('aria-pressed'), 'true');
  assert.match(root.querySelector('.waypoint-queue-list').textContent, /No active annotations on this route/);
  root.querySelector('.waypoint-queue-history-view').click();
  assert.match(root.querySelector('.waypoint-queue-list').textContent, /Remove this request/);
});

test('Queue selection copies only the selected Annotations', async () => {
  const annotations = [
    { id: 'waypoint_1750000000000_abc123xyz', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'First request', selector: '#first' },
    { id: 'waypoint_1750000000001_abc123xyz', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'Second request', selector: '#second' },
  ];
  const { clipboardWrites, context, root } = await openQueue(annotations);
  const selected = root.querySelector(`[value="${annotations[1].id}"]`);
  selected.checked = true;
  selected.dispatchEvent(new context.window.Event('click'));
  root.querySelector('.waypoint-queue-copy-selected').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(clipboardWrites.length, 1);
  assert.doesNotMatch(clipboardWrites[0], /First request/);
  assert.match(clipboardWrites[0], /Second request/);
  const feedback = root.querySelector('.waypoint-queue-copy-feedback');
  assert.equal(feedback.getAttribute('role'), 'status');
  assert.match(feedback.textContent, /Copied/);
  assert.match(root.querySelector('.waypoint-queue-copy-selected').textContent, /Copied/);
});

test('Queue exports only the selected Annotations from a quick menu beside Copy', async () => {
  const annotations = [
    { id: 'waypoint_1750000000000_abc123xyz', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'First request', selector: '#first' },
    { id: 'waypoint_1750000000001_abc123xyz', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'Second request', selector: '#second' },
  ];
  const { context, downloadBlobs, downloads, root } = await openQueue(annotations);
  const copy = root.querySelector('.waypoint-queue-copy-selected');
  const exportButton = root.querySelector('.waypoint-queue-export-selected');
  assert.equal(copy.nextElementSibling.classList.contains('waypoint-queue-export'), true);
  assert.equal(exportButton.textContent.trim(), 'Export');
  assert.equal(exportButton.disabled, true);

  const selected = root.querySelector(`[value="${annotations[1].id}"]`);
  selected.checked = true;
  selected.dispatchEvent(new context.window.Event('click'));
  assert.equal(exportButton.disabled, false);

  exportButton.click();
  const exportMenu = root.querySelector('.waypoint-queue-export-menu');
  assert.equal(exportMenu.hidden, false);
  assert.equal(exportMenu.querySelectorAll('[role="menuitem"]').length, 2);
  assert.doesNotMatch(exportMenu.textContent, /Share/);
  root.querySelector('.waypoint-queue-export-json').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(downloads.length, 1);
  assert.match(downloads[0].filename, /\.json$/);
  assert.equal(downloads[0].href, 'blob:waypoint-export');
  const exportedContent = await downloadBlobs[0].text();
  assert.doesNotMatch(exportedContent, /First request/);
  assert.match(exportedContent, /Second request/);
  assert.equal(exportMenu.hidden, true);
});

test('Queue Open resolves the Target and reopens the existing Annotation editor', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Reopen me',
    selector: '#target',
  };
  const { emitted, root } = await openQueue([annotation]);
  root.querySelector('.waypoint-queue-open').click();

  const editEvent = emitted.find(event => event.name === 'annotation:edit');
  assert.equal(editEvent.payload.annotation.id, annotation.id);
  assert.equal(editEvent.payload.element.id, 'target');
  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});

test('Queue supports keyboard dismissal with Escape', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Keyboard request',
    selector: '#target',
  };
  const { root } = await openQueue([annotation]);
  const panel = root.querySelector('.waypoint-queue-panel');
  panel.onkeydown({ key: 'Escape' });

  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});

test('Queue closes when the user clicks outside it', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Dismissible request',
    selector: '#target',
  };
  const { context, root } = await openQueue([annotation]);

  context.document.body.dispatchEvent(new context.window.Event('click', { bubbles: true }));

  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});
