import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const statusUrl = new URL('../public/annotation-status.js', import.meta.url);
const codecUrl = new URL('../public/export-codec.js', import.meta.url);
const syncUrl = new URL('../public/background/queue-sync.js', import.meta.url);

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
    JSON.parse(JSON.stringify(status.normalizeAll([
      { id: 'missing' },
      { id: 'completed', status: 'completed' },
      { id: 'archived', status: 'archived' },
      { id: 'claimed', status: 'claimed' },
      { id: 'unknown', status: 'unknown' },
    ]))),
    [
      { id: 'missing', status: 'pending' },
      { id: 'completed', status: 'resolved' },
      { id: 'archived', status: 'discarded' },
      { id: 'claimed', status: 'claimed' },
      { id: 'unknown', status: 'pending' },
    ],
  );
  assert.equal(status.isActionable({ status: 'pending' }), true);
  assert.equal(status.isActionable({ status: 'claimed' }), true);
  assert.equal(status.isActionable({ status: 'resolved' }), false);
  assert.equal(status.isActionable({ status: 'discarded' }), false);
});

test('export and Queue sync normalize statuses at their public boundaries', async () => {
  const context = await loadStatus();
  context.window = { location: new URL('http://localhost:3000/review') };
  vm.runInContext(await readFile(codecUrl, 'utf8'), context, { filename: 'export-codec.js' });
  context.WaypointAnnotationId = {
    filterValid: annotations => Array.isArray(annotations) ? annotations : [],
    isValid: () => true,
  };
  vm.runInContext(await readFile(syncUrl, 'utf8'), context, { filename: 'queue-sync.js' });

  const exported = context.WaypointExportCodec.createExportEnvelope([
    { id: 'completed', url: 'http://localhost:3000/review', status: 'completed' },
    { id: 'archived', url: 'http://localhost:3000/review', status: 'archived' },
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(exported.annotations.map(annotation => annotation.status))),
    ['resolved', 'discarded'],
  );

  const imported = context.WaypointExportCodec.normalizeImportEnvelope({
    waypoint_annotations_export: true,
    annotations: [{ id: 'legacy', status: 'completed' }],
  });
  assert.equal(imported.annotations[0].status, 'resolved');

  const merged = context.WaypointQueueSync.merge([], [{ id: 'server', status: 'archived' }]);
  assert.equal(merged.annotations[0].status, 'discarded');
});

test('lifecycle API calls delegate transitions to the background and normalize its response', async () => {
  const context = await loadStatus();
  const messages = [];
  context.chrome = {
    runtime: {
      sendMessage: async message => {
        messages.push(message);
        return { success: true, annotation: { id: message.id, status: 'completed' } };
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
});
