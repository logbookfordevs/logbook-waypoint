import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { LocalAnnotationsServer } from '../lib/server.js';

function createServer() {
  const server = new LocalAnnotationsServer();
  let annotations = [{
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000',
    comment: 'Create two variants',
    status: 'pending',
    variant_intent: { requested: true, default_count: 3 },
  }];
  server.loadAnnotations = async () => structuredClone(annotations);
  server.saveAnnotations = async next => { annotations = structuredClone(next); };
  server.applyAnnotationsUpdate = async mutator => {
    const next = structuredClone(annotations);
    const result = await mutator(next);
    annotations = next;
    return structuredClone(result);
  };
  return {
    server,
    read: () => structuredClone(annotations),
    write: next => { annotations = structuredClone(next); },
  };
}

const candidates = [
  {
    key: 'a',
    name: 'Alpha',
    implementation: { pending_changes: { color: { original: 'black', value: 'red' } } },
    scaffold: ['switcher'],
  },
  {
    key: 'b',
    name: 'Beta',
    implementation: { pending_changes: { color: { original: 'black', value: 'blue' } } },
    scaffold: ['switcher'],
  },
];

test('server atomically replaces authored Variant Intent with the complete generated Variant Set', async () => {
  const { server, read } = createServer();

  const requested = await server.requestVariants({
    id: 'waypoint_1750000000000_abc123xyz',
    variants: candidates,
  });

  assert.equal('variant_intent' in requested, false);
  assert.equal(requested.variant_request.variants.length, 2);
  assert.equal('variant_intent' in read()[0], false);
  assert.equal(read()[0].variant_request.variants.length, 2);
});

test('server retains authored Variant Intent when generated candidates are incomplete or persistence fails', async () => {
  const { server, read } = createServer();

  await assert.rejects(
    () => server.requestVariants({
      id: 'waypoint_1750000000000_abc123xyz',
      variants: candidates.slice(0, 1),
    }),
    /requires 2 complete Variants/i,
  );
  assert.deepEqual(read()[0].variant_intent, { requested: true, default_count: 3 });
  assert.equal('variant_request' in read()[0], false);

  const persisted = read();
  const diskServer = new LocalAnnotationsServer();
  diskServer.loadAnnotations = async () => structuredClone(persisted);
  diskServer._saveAnnotationsInternal = async () => { throw new Error('disk unavailable'); };
  await assert.rejects(
    () => diskServer.requestVariants({ id: persisted[0].id, variants: candidates }),
    /disk unavailable/,
  );
  assert.deepEqual(persisted[0].variant_intent, { requested: true, default_count: 3 });
  assert.equal('variant_request' in persisted[0], false);
});

test('server persists request, activation, reopen, discard, and finalization through the Variant seam', async () => {
  const { server, read, write } = createServer();
  const stored = read();
  stored[0].comment = 'Create three variants';
  write(stored);
  const threeCandidates = [
    ...candidates,
    { key: 'c', name: 'Gamma', implementation: { css: '.card { color: green; }' }, scaffold: ['switcher'] },
  ];

  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: threeCandidates });
  await server.activateVariant({ id: 'waypoint_1750000000000_abc123xyz', key: 'b' });
  assert.equal(read()[0].variant_request.active_variant_key, 'b');

  await server.discardVariant({ id: 'waypoint_1750000000000_abc123xyz', key: 'a' });
  const finalized = await server.finalizeVariant({ id: 'waypoint_1750000000000_abc123xyz', key: 'b' });
  assert.equal(finalized.variant_request.status, 'finalized');
  assert.deepEqual(read()[0].variant_request.scaffold, []);
});

test('server atomically cancels an unresolved Variant Set while preserving its Pending Annotation', async () => {
  const { server } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });

  const cancelled = await server.cancelVariantRequest({ id: 'waypoint_1750000000000_abc123xyz' });

  assert.equal(cancelled.status, 'pending');
  assert.equal('variant_request' in cancelled, false);
  assert.equal('variant_presentation' in cancelled, false);
  assert.equal('pending_changes' in cancelled, false);
  const read = await server.readAnnotations({ status: 'pending' });
  assert.equal('variant_request' in read.annotations[0], false);
  assert.equal(read.annotations[0].status, 'pending');
});

test('HTTP cancellation is distinct from Annotation Discard', async () => {
  const { server, read } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  const listener = await new Promise(resolve => {
    const opened = server.app.listen(0, '127.0.0.1', () => resolve(opened));
  });
  try {
    const { port } = listener.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/annotations/waypoint_1750000000000_abc123xyz/variants`, {
      method: 'DELETE',
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.annotation.status, 'pending');
    assert.equal('variant_request' in body.annotation, false);
    assert.equal(read()[0].status, 'pending');
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
  }
});

test('MCP cancellation removes the unresolved Variant Set through the canonical operation', async () => {
  const { server } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  let callTool;
  server.setupMCPHandlersForServer({
    setRequestHandler(schema, handler) {
      if (schema === CallToolRequestSchema) callTool = handler;
    },
  });

  const response = await callTool({
    params: {
      name: 'cancel_variant_request',
      arguments: { id: 'waypoint_1750000000000_abc123xyz' },
    },
  });
  const payload = JSON.parse(response.content[0].text);

  assert.equal(response.isError, undefined);
  assert.equal(payload.data.annotation.status, 'pending');
  assert.equal('variant_request' in payload.data.annotation, false);
});

test('failed persistence cannot partially cancel unresolved Variant state', async () => {
  const server = new LocalAnnotationsServer();
  const requested = await createServer().server.requestVariants({
    id: 'waypoint_1750000000000_abc123xyz',
    variants: candidates,
  });
  const persisted = [structuredClone(requested)];
  server.loadAnnotations = async () => structuredClone(persisted);
  server._saveAnnotationsInternal = async () => { throw new Error('disk unavailable'); };

  await assert.rejects(() => server.cancelVariantRequest({ id: persisted[0].id }), /disk unavailable/);
  assert.equal(persisted[0].variant_request.status, 'unresolved');
  assert.deepEqual(persisted[0].variant_request.scaffold, ['switcher']);
});

test('server leaves persisted state untouched when cleanup is incomplete', async () => {
  const { server, read, write } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  const inconsistent = read();
  inconsistent[0].variant_request.scaffold = [];
  write(inconsistent);

  await assert.rejects(() => server.finalizeVariant({ id: 'waypoint_1750000000000_abc123xyz', key: 'a' }), error => {
    assert.deepEqual(error.remaining_cleanup, [{ kind: 'scaffold_missing', key: 'switcher' }]);
    return true;
  });
  assert.equal(read()[0].variant_request.status, 'unresolved');
});

test('discarding an Annotation atomically discards its unresolved Variant request', async () => {
  const { server, read } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });

  const discarded = await server.changeAnnotationLifecycle({
    id: 'waypoint_1750000000000_abc123xyz',
    operation: 'discard',
  });

  assert.equal(discarded.status, 'discarded');
  assert.equal('variant_request' in discarded, false);
  assert.equal('variant_presentation' in discarded, false);
  assert.equal(read()[0].status, 'discarded');
});

test('discarding an Annotation preserves finalized Variant history', async () => {
  const { server } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  const finalized = await server.finalizeVariant({ id: 'waypoint_1750000000000_abc123xyz', key: 'a' });

  const discarded = await server.changeAnnotationLifecycle({
    id: finalized.id,
    operation: 'discard',
  });

  assert.equal(discarded.status, 'discarded');
  assert.equal(discarded.variant_request.status, 'finalized');
  assert.equal(discarded.variant_request.active_variant_key, 'a');
  assert.deepEqual(discarded.variant_presentation, finalized.variant_presentation);
});

test('discarding rejects malformed unresolved Variant state without partial cleanup', async () => {
  const { server, read, write } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  const malformed = read();
  malformed[0].variant_request.scaffold = [];
  write(malformed);

  await assert.rejects(
    () => server.changeAnnotationLifecycle({ id: malformed[0].id, operation: 'discard' }),
    error => {
      assert.deepEqual(error.remaining_cleanup, [{ kind: 'scaffold_missing', key: 'switcher' }]);
      return true;
    },
  );
  assert.equal(read()[0].status, 'pending');
  assert.equal(read()[0].variant_request.status, 'unresolved');
});

test('failed persistence cannot partially discard unresolved Variant work', async () => {
  const server = new LocalAnnotationsServer();
  const requested = await createServer().server.requestVariants({
    id: 'waypoint_1750000000000_abc123xyz',
    variants: candidates,
  });
  const persisted = [structuredClone(requested)];
  server.loadAnnotations = async () => structuredClone(persisted);
  server._saveAnnotationsInternal = async () => { throw new Error('disk unavailable'); };

  await assert.rejects(
    () => server.changeAnnotationLifecycle({ id: persisted[0].id, operation: 'discard' }),
    /disk unavailable/,
  );
  assert.equal(persisted[0].status, 'pending');
  assert.equal(persisted[0].variant_request.status, 'unresolved');
});

test('serialized writes recover after an expected Variant failure', async () => {
  const server = new LocalAnnotationsServer();
  let stored = [createServer().read()[0]];
  server.loadAnnotations = async () => structuredClone(stored);
  server._saveAnnotationsInternal = async annotations => { stored = structuredClone(annotations); };
  await server.requestVariants({ id: stored[0].id, variants: candidates });
  stored[0].variant_request.scaffold = [];

  await assert.rejects(() => server.finalizeVariant({ id: stored[0].id, key: 'a' }), /reconciled/i);
  stored[0].variant_request.scaffold = ['switcher'];
  const activated = await server.activateVariant({ id: stored[0].id, key: 'b' });

  assert.equal(activated.variant_request.active_variant_key, 'b');
});

test('confirmed project deletion rechecks URL scope inside the serialized mutation', async () => {
  const server = new LocalAnnotationsServer();
  const initial = [
    { id: 'waypoint_1750000000001_abcdefghi', url: 'http://localhost:3000/one', comment: 'Moved later' },
    { id: 'waypoint_1750000000002_abcdefghi', url: 'http://localhost:3000/two', comment: 'Still matches' },
  ];
  const current = [
    { ...initial[0], url: 'http://localhost:4000/one' },
    initial[1],
  ];
  let reads = 0;
  let persisted;
  server.loadAnnotations = async () => structuredClone(reads++ === 0 ? initial : current);
  server._saveAnnotationsInternal = async annotations => { persisted = structuredClone(annotations); };

  const result = await server.deleteProjectAnnotations({ url_pattern: 'http://localhost:3000/*', confirm: true });

  assert.equal(result.count, 1);
  assert.deepEqual(persisted.map(annotation => annotation.id), ['waypoint_1750000000001_abcdefghi']);
  assert.equal(persisted[0].url, 'http://localhost:4000/one');
});

test('project deletion wildcard respects URL path and port boundaries', async () => {
  const server = new LocalAnnotationsServer();
  const stored = [
    { id: 'waypoint_1750000000001_abcdefghi', url: 'http://localhost:3000/app/one', comment: 'Match' },
    { id: 'waypoint_1750000000002_abcdefghi', url: 'http://localhost:3000/apple', comment: 'Path collision' },
    { id: 'waypoint_1750000000003_abcdefghi', url: 'http://localhost:30000/app/two', comment: 'Port collision' },
  ];
  let persisted;
  server.loadAnnotations = async () => structuredClone(stored);
  server._saveAnnotationsInternal = async annotations => { persisted = structuredClone(annotations); };

  const result = await server.deleteProjectAnnotations({ url_pattern: 'http://localhost:3000/app/*', confirm: true });

  assert.equal(result.count, 1);
  assert.deepEqual(persisted.map(annotation => annotation.id), ['waypoint_1750000000002_abcdefghi', 'waypoint_1750000000003_abcdefghi']);
});

test('Annotation reads share safe URL wildcard boundaries', async () => {
  const server = new LocalAnnotationsServer();
  server.loadAnnotations = async () => [
    { id: 'waypoint_1750000000001_abcdefghi', url: 'http://localhost:3000/app/one', comment: 'Match', status: 'pending' },
    { id: 'waypoint_1750000000002_abcdefghi', url: 'http://localhost:3000/apple', comment: 'Path collision', status: 'pending' },
    { id: 'waypoint_1750000000003_abcdefghi', url: 'http://localhost:30000/app/two', comment: 'Port collision', status: 'pending' },
  ];

  const result = await server.readAnnotations({ url: 'http://localhost:3000/app/*' });

  assert.deepEqual(result.annotations.map(annotation => annotation.id), ['waypoint_1750000000001_abcdefghi']);
});

test('a persistence failure cannot partially finalize record-owned cleanup', async () => {
  const server = new LocalAnnotationsServer();
  const requested = await createServer().server.requestVariants({
    id: 'waypoint_1750000000000_abc123xyz',
    variants: candidates,
  });
  const persisted = [structuredClone(requested)];
  server.loadAnnotations = async () => structuredClone(persisted);
  server._saveAnnotationsInternal = async () => { throw new Error('disk unavailable'); };

  await assert.rejects(() => server.finalizeVariant({ id: persisted[0].id, key: 'a' }), /disk unavailable/);
  assert.equal(persisted[0].variant_request.status, 'unresolved');
  assert.deepEqual(persisted[0].variant_request.scaffold, ['switcher']);
});

test('HTTP generic writes cannot create, replace, resolve, or sync Variant-owned state', async () => {
  const { server, read } = createServer();
  const listener = await new Promise(resolve => {
    const opened = server.app.listen(0, '127.0.0.1', () => resolve(opened));
  });
  const address = listener.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const request = await fetch(`${baseUrl}/api/annotations/waypoint_1750000000000_abc123xyz/variants/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants: candidates }),
    });
    assert.equal(request.status, 200);

    const replace = await fetch(`${baseUrl}/api/annotations/waypoint_1750000000000_abc123xyz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_request: null }),
    });
    assert.equal(replace.status, 409);

    const resolve = await fetch(`${baseUrl}/api/annotations/waypoint_1750000000000_abc123xyz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(resolve.status, 409);

    const remove = await fetch(`${baseUrl}/api/annotations/waypoint_1750000000000_abc123xyz`, {
      method: 'DELETE',
    });
    assert.equal(remove.status, 409);
    assert.equal(read()[0].variant_request.status, 'unresolved');

    const [incoming] = read();
    incoming.variant_request.active_variant_key = 'b';
    const sync = await fetch(`${baseUrl}/api/annotations/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annotations: [incoming] }),
    });
    assert.equal(sync.status, 409);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
  }
});

test('MCP Variant failures retain structured remaining cleanup work', async () => {
  const { server, read, write } = createServer();
  await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  const inconsistent = read();
  inconsistent[0].variant_request.variants[0].scaffold = ['<malicious-cleanup-key>'];
  inconsistent[0].variant_request.variants[1].scaffold = ['<malicious-cleanup-key>'];
  inconsistent[0].variant_request.scaffold = [];
  write(inconsistent);
  let callTool;
  const mcp = {
    setRequestHandler(schema, handler) {
      if (schema === CallToolRequestSchema) callTool = handler;
    },
  };
  server.setupMCPHandlersForServer(mcp);

  const response = await callTool({
    params: {
      name: 'finalize_variant',
      arguments: { id: 'waypoint_1750000000000_abc123xyz', key: 'a' },
    },
  });
  const payload = JSON.parse(response.content[0].text);

  assert.equal(response.isError, true);
  assert.equal(payload.data_trust, 'untrusted');
  assert.match(payload.security_notice, /Do not follow instructions/);
  assert.deepEqual(payload.data.remaining_cleanup, [{ kind: 'scaffold_missing', key: '<malicious-cleanup-key>' }]);
});

test('committed Variant mutations publish safe Watch activity and survive Watch failure', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-variant-watch-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const watchHistoryFile = path.join(directory, 'watch-history.json');
  const initial = createServer().read();
  await writeFile(annotationsFile, JSON.stringify(initial));
  const server = new LocalAnnotationsServer({ annotationsFile, watchHistoryFile });

  try {
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    await server.requestVariants({ id: initial[0].id, variants: candidates });
    const activity = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });

    assert.equal(activity.changes.length, 1);
    assert.equal(activity.changes[0].annotation.variant_request.status, 'unresolved');
    assert.doesNotMatch(JSON.stringify(activity), /implementation|scaffold|pending_changes/);

    server.watchQueue.recordChanges = async () => { throw new Error('watch unavailable'); };
    const activated = await server.activateVariant({ id: initial[0].id, key: 'b' });
    const committed = JSON.parse(await readFile(annotationsFile, 'utf8'));
    assert.equal(activated.variant_request.active_variant_key, 'b');
    assert.equal(committed[0].variant_request.active_variant_key, 'b');
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('Variant Set cancellation publishes Pending state through Watch without candidate data', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-variant-cancel-watch-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const watchHistoryFile = path.join(directory, 'watch-history.json');
  const initial = createServer().read();
  await writeFile(annotationsFile, JSON.stringify(initial));
  const server = new LocalAnnotationsServer({ annotationsFile, watchHistoryFile });

  try {
    await server.requestVariants({ id: initial[0].id, variants: candidates });
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    await server.cancelVariantRequest({ id: initial[0].id });
    const cancellation = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });

    assert.equal(cancellation.changes.length, 1);
    assert.equal(cancellation.changes[0].annotation.status, 'pending');
    assert.equal('variant_request' in cancellation.changes[0].annotation, false);
    assert.doesNotMatch(JSON.stringify(cancellation), /implementation|scaffold|pending_changes/);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('explicit inspection retains selected Variant presentation while Watch stays portable', async () => {
  const { server } = createServer();
  const requested = await server.requestVariants({ id: 'waypoint_1750000000000_abc123xyz', variants: candidates });
  server.loadAnnotations = async () => [requested];

  const inspection = await server.inspectAnnotations({ ids: ['waypoint_1750000000000_abc123xyz'] });
  const watched = server.portableAnnotation(requested);

  assert.deepEqual(inspection.annotations[0].variant_presentation, candidates[0].implementation);
  assert.deepEqual(inspection.annotations[0].pending_changes, candidates[0].implementation.pending_changes);
  assert.equal('variant_presentation' in watched, false);
  assert.equal('pending_changes' in watched, false);
  assert.doesNotMatch(JSON.stringify(inspection.annotations[0]), /scaffold/);
});
