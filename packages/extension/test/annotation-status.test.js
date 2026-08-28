import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const statusUrl = new URL('../public/annotation-status.js', import.meta.url);
const collectionUrl = new URL('../public/annotation-collection.js', import.meta.url);
const codecUrl = new URL('../public/export-codec.js', import.meta.url);
const syncUrl = new URL('../public/background/queue-sync.js', import.meta.url);
const backgroundUrl = new URL('../public/background/background.js', import.meta.url);

async function loadStatus() {
  const source = await readFile(statusUrl, 'utf8');
  const context = vm.createContext({ globalThis: null });
  context.globalThis = context;
  vm.runInContext(source, context, { filename: 'annotation-status.js' });
  return context;
}

test('annotation status adapter migrates legacy lifecycle values into canonical statuses', async () => {
  const { WaypointAnnotationStatus: status } = await loadStatus();

  assert.deepEqual(
    JSON.parse(JSON.stringify(status.migrateLegacyAll([
      { id: 'missing' },
      { id: 'completed', status: 'completed' },
      { id: 'archived', status: 'archived' },
      { id: 'claimed', status: 'claimed' },
    ]))),
    [
      { id: 'missing', status: 'pending' },
      { id: 'completed', status: 'resolved' },
      { id: 'archived', status: 'discarded' },
      { id: 'claimed', status: 'claimed' },
    ],
  );
  assert.equal(status.isActionable({ status: 'pending' }), true);
  assert.equal(status.isActionable({ status: 'claimed' }), true);
  assert.equal(status.isActionable({ status: 'resolved' }), false);
  assert.equal(status.isActionable({ status: 'discarded' }), false);
  assert.equal(status.isHistorical({ status: 'pending' }), false);
  assert.equal(status.isHistorical({ status: 'claimed' }), false);
  assert.equal(status.isHistorical({ status: 'resolved' }), true);
  assert.equal(status.isHistorical({ status: 'discarded' }), true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(status.filterRenderable([
      { id: 'pending', status: 'pending' },
      { id: 'ordinary-resolved', status: 'resolved' },
      { id: 'design-resolved', status: 'resolved', design_intent: { schema_version: 1, workflow: 'impeccable', action: null } },
      { id: 'design-discarded', status: 'discarded', design_intent: { schema_version: 1, workflow: 'impeccable', action: null } },
    ]).map(annotation => annotation.id))),
    ['pending'],
  );
  assert.throws(() => status.normalize({ id: 'completed', status: 'completed' }), /invalid annotation status/i);
  assert.throws(() => status.normalize({ id: 'unknown', status: 'future' }), /invalid annotation status/i);
});

test('export, import, and Queue sync reject legacy statuses after one-time migration', async () => {
  const context = await loadStatus();
  context.window = { location: new URL('http://localhost:3000/review') };
  vm.runInContext(await readFile(codecUrl, 'utf8'), context, { filename: 'export-codec.js' });
  context.WaypointAnnotationId = {
    filterValid: annotations => Array.isArray(annotations) ? annotations : [],
    isValid: () => true,
  };
  vm.runInContext(await readFile(collectionUrl, 'utf8'), context, { filename: 'annotation-collection.js' });
  vm.runInContext(await readFile(syncUrl, 'utf8'), context, { filename: 'queue-sync.js' });

  const exported = context.WaypointExportCodec.createExportEnvelope([
    { id: 'resolved', url: 'http://localhost:3000/review', status: 'resolved' },
    { id: 'discarded', url: 'http://localhost:3000/review', status: 'discarded' },
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(exported.annotations.map(annotation => annotation.status))),
    ['resolved', 'discarded'],
  );

  assert.throws(() => context.WaypointExportCodec.normalizeImportEnvelope({
    waypoint_annotations_export: true,
    annotations: [{ id: 'legacy', status: 'completed' }],
  }), /invalid annotation status/i);
  assert.throws(
    () => context.WaypointQueueSync.merge([], [{ id: 'server', status: 'archived' }]),
    /invalid annotation status/i,
  );
});

test('lifecycle API calls delegate transitions to the background and normalize its response', async () => {
  const context = await loadStatus();
  const messages = [];
  context.chrome = {
    runtime: {
      sendMessage: async message => {
        messages.push(message);
        return { success: true, annotation: { id: message.id, status: 'resolved' } };
      },
    },
  };
  context.window = { location: { href: 'http://localhost:3000/review' } };
  vm.runInContext(await readFile(new URL('../public/content/modules/api-bridge.js', import.meta.url), 'utf8'), context, {
    filename: 'api-bridge.js',
  });

  for (const [method, action] of [
    ['claimAnnotation', 'claimAnnotation'],
    ['releaseAnnotation', 'releaseAnnotation'],
    ['resolveAnnotation', 'resolveAnnotation'],
    ['discardAnnotation', 'discardAnnotation'],
  ]) {
    const annotation = await context.WaypointAPI[method]('waypoint_1750000000000_abc123xyz', 'agent-one');
    assert.equal(annotation.status, 'resolved');
    assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))), {
      action,
      id: 'waypoint_1750000000000_abc123xyz',
      owner: 'agent-one',
      url: 'http://localhost:3000/review',
    });
  }

  await context.WaypointAPI.dismissWorkNotice('waypoint_1750000000000_abc123xyz');
  assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))), {
    action: 'dismissWorkNotice',
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/review',
  });


  await context.WaypointAPI.releaseAnnotation(
    'waypoint_1750000000000_abc123xyz',
    'agent-one',
    {
      code: 'workflow_unavailable',
      summary: 'Install Impeccable, then claim to retry.',
    },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))), {
    action: 'releaseAnnotation',
    id: 'waypoint_1750000000000_abc123xyz',
    owner: 'agent-one',
    reason: {
      code: 'workflow_unavailable',
      summary: 'Install Impeccable, then claim to retry.',
    },
    url: 'http://localhost:3000/review',
  });
});

test('generic extension updates reject lifecycle state and Claim changes', async () => {
  const context = await loadStatus();

  assert.throws(
    () => context.WaypointAnnotationStatus.normalizeUpdate({ status: 'resolved' }),
    /lifecycle operations/i,
  );
  assert.throws(
    () => context.WaypointAnnotationStatus.normalizeUpdate({ claim: { owner: 'agent-one' } }),
    /lifecycle operations/i,
  );
  assert.throws(
    () => context.WaypointAnnotationStatus.normalizeUpdate({ work_notice: null }),
    /lifecycle operations/i,
  );
  assert.throws(
    () => context.WaypointAnnotationStatus.assertUpdateAllowed({ status: 'claimed' }),
    /Pending/i,
  );
  assert.doesNotThrow(
    () => context.WaypointAnnotationStatus.assertUpdateAllowed({ status: 'pending' }),
  );
});

test('extension saves cannot create or replace lifecycle-owned state', async () => {
  const { WaypointAnnotationStatus: status } = await loadStatus();
  const pending = { id: 'waypoint_1750000000000_abc123xyz', status: 'pending', comment: 'Original' };

  assert.doesNotThrow(() => status.assertSaveAllowed(null, pending));
  assert.throws(
    () => status.assertSaveAllowed(null, { ...pending, status: 'resolved' }),
    /must start Pending/i,
  );
  assert.throws(
    () => status.assertSaveAllowed(null, { ...pending, claim: { owner: 'agent-one' } }),
    /must start Pending/i,
  );
  assert.doesNotThrow(() => status.assertSaveAllowed(pending, { ...pending, comment: 'Edited' }));
  assert.throws(
    () => status.assertSaveAllowed(pending, { ...pending, status: 'discarded' }),
    /lifecycle operations/i,
  );
});

test('annotation collection adapter combines canonical ID and lifecycle validation', async () => {
  const context = await loadStatus();
  context.WaypointAnnotationId = {
    filterValid: annotations => annotations.filter(annotation => annotation.id.startsWith('waypoint_')),
  };
  vm.runInContext(await readFile(collectionUrl, 'utf8'), context, { filename: 'annotation-collection.js' });

  const annotations = context.WaypointAnnotationCollection.canonicalize([
    { id: 'waypoint_valid', status: 'pending' },
    { id: 'vibe_invalid', status: 'pending' },
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(annotations)), [{ id: 'waypoint_valid', status: 'pending' }]);
  assert.throws(
    () => context.WaypointAnnotationCollection.canonicalize([{ id: 'waypoint_invalid', status: 'completed' }]),
    /invalid annotation status/i,
  );
});

test('background startup completes schema migrations before enabling Queue consumers', async () => {
  const source = await readFile(backgroundUrl, 'utf8');
  const migration = source.indexOf('await this.migrateAnnotationStatuses()');
  const syncFlags = source.indexOf('await this.migrateSyncFlags()');
  const messages = source.indexOf('this.setupMessageListener()');
  const monitoring = source.indexOf('this.startAPIConnectionMonitoring()');

  assert.match(source, /this\.initialization = this\.init\(\)\.catch\(/);
  assert.ok(migration > -1);
  assert.ok(migration < syncFlags);
  assert.ok(syncFlags < messages);
  assert.ok(messages < monitoring);
  assert.match(source, /WaypointAnnotationStatus\.assertSaveAllowed\(annotations\[existingIndex\], annotation\)/);
});
