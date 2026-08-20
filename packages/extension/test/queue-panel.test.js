import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

const queuePanelUrl = new URL('../.output/chrome-mv3/content/modules/queue-panel.js', import.meta.url);
const toolbarUrl = new URL('../.output/chrome-mv3/content/modules/floating-toolbar.js', import.meta.url);

function createHarness(annotations) {
  const { window } = parseHTML('<html><body><div id="root"></div><button id="target">Target</button></body></html>');
  window.innerHeight = 900;
  window.innerWidth = 1200;
  window.location = new URL('http://localhost:3000/settings/members');
  const listeners = new Map();
  const emitted = [];
  const root = window.document.querySelector('#root');
  const clipboardWrites = [];
  const discarded = [];
  const deleted = [];
  const context = vm.createContext({
    window,
    document: window.document,
    navigator: { platform: 'MacIntel', clipboard: { writeText: async value => clipboardWrites.push(value) } },
    chrome: { runtime: { getURL: path => path, getManifest: () => ({ version: '1.0.0' }) } },
    URL,
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
    loadAnnotations: async () => annotations,
    loadProjectAnnotations: async () => [
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
  };

  return { clipboardWrites, context, deleted, discarded, emitted, root };
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
    },
  ];
  const { context, root } = createHarness(annotations);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));

  const panel = root.querySelector('.waypoint-queue-panel');
  assert.notEqual(panel, null);
  assert.equal(panel.getAttribute('role'), 'dialog');
  assert.match(panel.textContent, /Queue/);
  assert.match(panel.textContent, /Make the invitation action easier to scan/);
  assert.match(panel.textContent, /Pending/);
  assert.match(panel.textContent, /Screenshot/);
});

test('Queue remains available on an empty current route so other-route work stays reachable', async () => {
  const { context, root } = createHarness([]);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  const queueButton = root.querySelector('.waypoint-tb-queue');
  assert.equal(queueButton.disabled, false);
  queueButton.click();
  await new Promise(resolve => setImmediate(resolve));

  assert.match(root.querySelector('.waypoint-queue-list').textContent, /No annotations on this route/);
  assert.match(root.querySelector('.waypoint-queue-header').textContent, /1 other route/);
});

test('Queue keeps permanent deletion secondary and requires an explicit confirmation', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'discarded',
    comment: 'Historical request',
    selector: '#target',
  };
  const { context, deleted, root } = createHarness([annotation]);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));
  root.querySelector('.waypoint-queue-delete').click();
  assert.equal(deleted.length, 0);
  assert.match(root.querySelector('.waypoint-queue-row-menu').textContent, /Delete this annotation permanently\?/);

  root.querySelector('.waypoint-queue-confirm-delete').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(deleted, [annotation.id]);
  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});

test('Queue offers compact access to other routes without replacing its route-first opening view', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Current route request',
    selector: '#target',
  };
  const { context, root } = createHarness([annotation]);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.match(root.querySelector('.waypoint-queue-list').textContent, /Current route request/);
  assert.doesNotMatch(root.querySelector('.waypoint-queue-list').textContent, /Other route request/);
  root.querySelector('.waypoint-queue-other-routes').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.match(root.querySelector('.waypoint-queue-list').textContent, /\/dashboard\?tab=activity#today/);
  root.querySelector('[data-route="/dashboard?tab=activity#today"]').click();
  assert.match(root.querySelector('.waypoint-queue-list').textContent, /Other route request/);
  assert.match(root.querySelector('.waypoint-queue-header').textContent, /dashboard\?tab=activity#today/);
});

test('Queue requires confirmation before discarding selected Annotations through lifecycle operations', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Remove this request',
    selector: '#target',
  };
  const { context, discarded, root } = createHarness([annotation]);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));
  const input = root.querySelector('.waypoint-queue-select');
  input.checked = true;
  input.dispatchEvent(new context.window.Event('click'));
  root.querySelector('.waypoint-queue-discard-selected').click();

  assert.equal(discarded.length, 0);
  assert.match(root.querySelector('.waypoint-queue-actions').textContent, /Discard 1 annotation\?/);

  root.querySelector('.waypoint-queue-confirm-discard').click();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(discarded, [{ id: annotation.id, owner: undefined, url: annotation.url }]);
  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});

test('Queue selection copies only the selected Annotations', async () => {
  const annotations = [
    { id: 'waypoint_1750000000000_abc123xyz', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'First request', selector: '#first' },
    { id: 'waypoint_1750000000001_abc123xyz', url: 'http://localhost:3000/settings/members', status: 'pending', comment: 'Second request', selector: '#second' },
  ];
  const { clipboardWrites, context, root } = createHarness(annotations);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));
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

test('Queue Open resolves the Target and reopens the existing Annotation editor', async () => {
  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/settings/members',
    status: 'pending',
    comment: 'Reopen me',
    selector: '#target',
  };
  const { context, emitted, root } = createHarness([annotation]);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));
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
  const { context, root } = createHarness([annotation]);
  const [queuePanelSource, toolbarSource] = await Promise.all([
    readFile(queuePanelUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  vm.runInContext(queuePanelSource, context, { filename: 'queue-panel.js' });
  vm.runInContext(toolbarSource, context, { filename: 'floating-toolbar.js' });

  await context.WaypointToolbar.init();
  root.querySelector('.waypoint-tb-queue').click();
  await new Promise(resolve => setImmediate(resolve));
  const panel = root.querySelector('.waypoint-queue-panel');
  panel.onkeydown({ key: 'Escape' });

  assert.equal(root.querySelector('.waypoint-queue-panel'), null);
});
