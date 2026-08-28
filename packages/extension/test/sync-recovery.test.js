import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const backgroundUrl = new URL('../public/background/background.js', import.meta.url);
const queueSyncUrl = new URL('../public/background/queue-sync.js', import.meta.url);
const siteAccessUrl = new URL('../public/background/site-access.js', import.meta.url);
const apiBridgeUrl = new URL('../public/content/modules/api-bridge.js', import.meta.url);
const queuePanelUrl = new URL('../public/content/modules/queue-panel.js', import.meta.url);

test('manual sync detects markerless local-only annotations for the current origin only', async () => {
  const context = vm.createContext({
    URL,
    WaypointAnnotationCollection: {
      canonicalize: annotations => annotations || [],
    },
    WaypointAnnotationId: {
      isValid: id => id.startsWith('waypoint_'),
    },
    WaypointDesignIntent: { preserve: (_source, target) => target },
    WaypointVariantIntent: { preserve: (_source, target) => target },
  });
  vm.runInContext(await readFile(queueSyncUrl, 'utf8'), context);

  const local = [{
    id: 'waypoint_1750000000000_offline',
    status: 'pending',
    comment: 'Created while offline',
    url: 'http://localhost:3000/',
  }, {
    id: 'waypoint_1750000000001_other',
    status: 'pending',
    comment: 'Another project',
    url: 'http://localhost:4000/',
  }];

  assert.deepEqual(
    Array.from(context.WaypointQueueSync.pendingIdsForOrigin(local, [], 'http://localhost:3000')),
    ['waypoint_1750000000000_offline'],
  );
});

test('offline sync status counts only locally proven unsynced annotations', async () => {
  const context = vm.createContext({
    URL,
    WaypointAnnotationCollection: {
      canonicalize: annotations => annotations || [],
    },
  });
  vm.runInContext(await readFile(queueSyncUrl, 'utf8'), context);

  const local = [{
    id: 'waypoint_1750000000000_synced',
    status: 'pending',
    url: 'http://localhost:3000/',
    _synced: true,
  }, {
    id: 'waypoint_1750000000001_unsynced',
    status: 'pending',
    url: 'http://localhost:3000/',
    _synced: false,
  }, {
    id: 'waypoint_1750000000002_other',
    status: 'pending',
    url: 'http://localhost:4000/',
    _synced: false,
  }];

  assert.deepEqual(
    Array.from(context.WaypointQueueSync.statusPendingIdsForOrigin(
      local,
      [],
      'http://localhost:3000',
      false,
    )),
    ['waypoint_1750000000001_unsynced'],
  );
});

test('manual sync pulls resolved server lifecycle into the local Queue before reporting success', async () => {
  const id = 'waypoint_1750000000000_resolved';
  const store = {
    waypointAnnotations: [{
      id,
      url: 'http://localhost:3000/account',
      status: 'pending',
      comment: 'Fix the warning state',
      updated_at: '2026-08-28T11:20:00.000Z',
      _synced: true,
    }],
    waypointDeletedAnnotationIds: [],
    waypointDesignIntentRemovalIds: [],
    waypointVariantIntentRemovalIds: [],
  };
  const serverAnnotation = {
    ...store.waypointAnnotations[0],
    status: 'resolved',
    updated_at: '2026-08-28T11:41:00.000Z',
  };
  delete serverAnnotation._synced;

  const context = vm.createContext({
    URL,
    console,
    importScripts: () => {},
    fetch: async () => ({
      ok: true,
      json: async () => ({ annotations: [serverAnnotation] }),
    }),
    chrome: {
      storage: { local: {
        get: async keys => Object.fromEntries(keys.map(key => [key, store[key]])),
        set: async values => Object.assign(store, values),
      } },
    },
    WaypointAnnotationCollection: { canonicalize: annotations => annotations || [] },
    WaypointAnnotationId: { isValid: candidate => candidate.startsWith('waypoint_') },
    WaypointAnnotationStatus: { normalize: annotation => annotation },
    WaypointDesignIntent: {
      preserve: (_source, target) => target,
      removeIds: (ids, removed) => ids.filter(candidate => !removed.includes(candidate)),
    },
    WaypointVariantIntent: {
      preserve: (_source, target) => target,
      removeIds: (ids, removed) => ids.filter(candidate => !removed.includes(candidate)),
    },
    globalThis: null,
  });
  context.globalThis = context;
  vm.runInContext(await readFile(queueSyncUrl, 'utf8'), context, { filename: 'queue-sync.js' });
  const backgroundSource = await readFile(backgroundUrl, 'utf8');
  vm.runInContext(
    backgroundSource.slice(0, backgroundSource.indexOf('// Initialize the background service worker')),
    context,
    { filename: 'background.js' },
  );
  const background = vm.runInContext('Object.create(WaypointAnnotationsBackground.prototype)', context);
  background.apiServerUrl = 'http://127.0.0.1:3846';
  background._syncCyclePromise = null;
  background._withStorageLock = operation => operation();
  background.assertSyncOrigin = async origin => origin;
  background.checkAPIConnectionStatus = async () => ({ connected: true });
  background.updateAllBadges = async () => {};
  background.getSyncStatus = async () => ({
    connected: true,
    pending_count: store.waypointAnnotations.filter(annotation => annotation.status === 'pending').length,
  });

  const status = await background.syncNow('http://localhost:3000');

  assert.equal(store.waypointAnnotations[0].status, 'resolved');
  assert.equal(store.waypointAnnotations[0]._synced, true);
  assert.equal(status.pending_count, 0);
});

test('connected server health checks automatically reconcile MCP lifecycle changes', async () => {
  let messageListener;
  let reconciliationCount = 0;
  const context = vm.createContext({
    URL,
    console,
    importScripts: () => {},
    chrome: {
      runtime: {
        onMessage: {
          addListener: listener => { messageListener = listener; },
        },
      },
    },
  });
  const backgroundSource = await readFile(backgroundUrl, 'utf8');
  vm.runInContext(
    backgroundSource.slice(0, backgroundSource.indexOf('// Initialize the background service worker')),
    context,
    { filename: 'background.js' },
  );
  const background = vm.runInContext('Object.create(WaypointAnnotationsBackground.prototype)', context);
  background.checkAPIConnectionStatus = async () => ({ connected: true });
  background.syncAutomatically = async () => { reconciliationCount += 1; };
  background.setupMessageListener();

  const response = await new Promise(resolve => {
    messageListener({ action: 'checkMCPStatus' }, {}, resolve);
  });

  assert.equal(response.success, true);
  assert.equal(response.status.connected, true);
  assert.equal(reconciliationCount, 1);
});

test('site access policy executes every sender URL and permission branch', async () => {
  const context = vm.createContext({ URL });
  vm.runInContext(await readFile(siteAccessUrl, 'utf8'), context);
  const checkedOrigins = [];
  const options = {
    isLocalhostUrl: url => url.startsWith('http://localhost:'),
    containsPermission: async originPattern => {
      checkedOrigins.push(originPattern);
      return originPattern === 'https://enabled.example/*';
    },
  };

  assert.equal(await context.WaypointSiteAccess.hasCurrentSiteAccess(undefined, options), false);
  assert.equal(await context.WaypointSiteAccess.hasCurrentSiteAccess('http://localhost:3000/page', options), true);
  assert.equal(await context.WaypointSiteAccess.hasCurrentSiteAccess('chrome://extensions', options), false);
  assert.equal(await context.WaypointSiteAccess.hasCurrentSiteAccess('https://enabled.example/page', options), true);
  assert.equal(await context.WaypointSiteAccess.hasCurrentSiteAccess('https://disabled.example/page', options), false);
  assert.deepEqual(checkedOrigins, ['https://enabled.example/*', 'https://disabled.example/*']);
});

test('extension exposes manual recovery through its background boundary', async () => {
  const [background, manifestSource] = await Promise.all([
    readFile(backgroundUrl, 'utf8'),
    readFile(new URL('../.output/chrome-mv3/manifest.json', import.meta.url), 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource);

  assert.ok(!manifest.permissions.includes('alarms'));
  assert.doesNotMatch(background, /chrome\.alarms/);
  assert.match(background, /case 'getSyncStatus'/);
  assert.match(background, /case 'syncNow'/);
  assert.match(background, /this\._syncCyclePromise/);
  const manualSync = background.slice(background.indexOf('syncNow(origin)'), background.indexOf('async smartSyncAnnotations()'));
  assert.match(manualSync, /saveAnnotationToAPI/);
  assert.doesNotMatch(manualSync, /syncAnnotationsToAPI/);
  assert.match(background, /tombstonesChanged/);
  assert.doesNotMatch(background, /setInterval\(/);
});

test('Queue makes pending synchronization visible and manually retryable', async () => {
  const [apiBridge, queuePanel] = await Promise.all([
    readFile(apiBridgeUrl, 'utf8'),
    readFile(queuePanelUrl, 'utf8'),
  ]);

  assert.match(apiBridge, /action: 'getSyncStatus'/);
  assert.match(apiBridge, /action: 'syncNow'/);
  assert.match(apiBridge, /origin: window\.location\.origin/);
  assert.match(queuePanel, /waypoint-queue-sync-status/);
  assert.match(queuePanel, /waypoint-queue-sync-now/);
  assert.match(queuePanel, /'change' : 'changes'/);
  assert.match(queuePanel, /not synced/);
});
