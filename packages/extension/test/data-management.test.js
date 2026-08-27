import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const moduleUrl = new URL('../public/data-management.js', import.meta.url);

async function loadModule() {
  const context = vm.createContext({ URL });
  vm.runInContext(await readFile(moduleUrl, 'utf8'), context, { filename: 'data-management.js' });
  return context.WaypointDataManagement;
}

const day = 86400000;
const now = Date.parse('2026-08-26T12:00:00.000Z');
const annotations = [
  {
    id: 'waypoint_1750000000000_oldpending',
    url: 'http://localhost:3001/settings',
    status: 'pending',
    updated_at: new Date(now - 45 * day).toISOString(),
  },
  {
    id: 'waypoint_1750000000001_recentpending',
    url: 'http://localhost:3001/dashboard',
    status: 'pending',
    updated_at: new Date(now - 2 * day).toISOString(),
  },
  {
    id: 'waypoint_1750000000002_oldhistory',
    url: 'http://127.0.0.1:4300/',
    status: 'resolved',
    updated_at: new Date(now - 60 * day).toISOString(),
  },
];

test('data health summary distinguishes old Pending work from cleanup candidates', async () => {
  const management = await loadModule();

  assert.deepEqual(
    { ...management.summarize(annotations, { now }) },
    {
      project_count: 2,
      annotation_count: 3,
      old_pending_count: 1,
      cleanup_candidate_count: 1,
      review_count: 2,
      oldest_activity_at: new Date(now - 60 * day).toISOString(),
      stale_after_days: 30,
    },
  );
});

test('data manager snapshot groups every origin and exposes deletion selectors', async () => {
  const management = await loadModule();
  const snapshot = management.snapshot(annotations, { now });

  assert.deepEqual(JSON.parse(JSON.stringify(snapshot.projects.map(project => ({
    origin: project.origin,
    annotation_count: project.annotation_count,
    route_count: project.route_count,
    old_pending_count: project.old_pending_count,
  })))), [
    { origin: 'http://localhost:3001', annotation_count: 2, route_count: 2, old_pending_count: 1 },
    { origin: 'http://127.0.0.1:4300', annotation_count: 1, route_count: 1, old_pending_count: 0 },
  ]);
  assert.deepEqual(
    Array.from(management.selectIds(annotations, { scope: 'project', origin: 'http://localhost:3001' })),
    ['waypoint_1750000000000_oldpending', 'waypoint_1750000000001_recentpending'],
  );
  assert.deepEqual(
    Array.from(management.selectIds(annotations, { scope: 'old_history' }, { now })),
    ['waypoint_1750000000002_oldhistory'],
  );
});

test('background bulk deletion removes local records and leaves tombstones for server synchronization', async () => {
  const writes = [];
  const deletedFromServer = [];
  const store = {
    waypointAnnotations: structuredClone(annotations),
    waypointDeletedAnnotationIds: [],
    waypointDesignIntentRemovalIds: [],
    waypointVariantIntentRemovalIds: [],
  };
  const context = vm.createContext({
    URL,
    console,
    fetch,
    importScripts: () => {},
    chrome: {
      storage: { local: {
        get: async keys => Object.fromEntries(keys.map(key => [key, store[key]])),
        set: async value => {
          Object.assign(store, value);
          writes.push(value);
        },
      } },
    },
    WaypointAnnotationCollection: { canonicalize: value => value || [] },
    WaypointDataManagement: await loadModule(),
    WaypointVariantPolicy: { assertDeleteAllowed: () => {} },
    WaypointDesignIntent: { removeIds: (ids, removed) => ids.filter(id => !removed.includes(id)) },
    WaypointVariantIntent: { removeIds: (ids, removed) => ids.filter(id => !removed.includes(id)) },
    globalThis: null,
  });
  context.globalThis = context;
  const backgroundSource = await readFile(new URL('../public/background/background.js', import.meta.url), 'utf8');
  vm.runInContext(backgroundSource.slice(0, backgroundSource.indexOf('// Initialize the background service worker')), context);
  const background = vm.runInContext('Object.create(WaypointAnnotationsBackground.prototype)', context);
  background._withStorageLock = operation => operation();
  background.deleteAnnotationFromAPI = async id => { deletedFromServer.push(id); };
  background.updateAllBadges = async () => {};

  const result = await background.deleteDataSelection({ scope: 'project', origin: 'http://localhost:3001' });

  assert.equal(result.deleted_count, 2);
  assert.deepEqual(store.waypointAnnotations.map(annotation => annotation.id), ['waypoint_1750000000002_oldhistory']);
  assert.deepEqual(Array.from(store.waypointDeletedAnnotationIds), [
    'waypoint_1750000000000_oldpending',
    'waypoint_1750000000001_recentpending',
  ]);
  assert.deepEqual(deletedFromServer, Array.from(store.waypointDeletedAnnotationIds));
  assert.equal(writes.some(write => Object.hasOwn(write, 'waypointAnnotations')), true);
});
