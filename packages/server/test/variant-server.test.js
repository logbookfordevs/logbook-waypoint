import assert from 'node:assert/strict';
import test from 'node:test';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { LocalAnnotationsServer } from '../lib/server.js';

function createServer() {
  const server = new LocalAnnotationsServer();
  let annotations = [{ id: 'vibe_1750000000000_abc123xyz', url: 'http://localhost:3000', comment: 'Compare', status: 'pending' }];
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

test('server persists request, activation, reopen, discard, and finalization through the Variant seam', async () => {
  const { server, read } = createServer();

  await server.requestVariants({ id: 'vibe_1750000000000_abc123xyz', variants: candidates });
  await server.activateVariant({ id: 'vibe_1750000000000_abc123xyz', key: 'b' });
  assert.equal(read()[0].variant_request.active_variant_key, 'b');

  await server.discardVariant({ id: 'vibe_1750000000000_abc123xyz', key: 'a' });
  const finalized = await server.finalizeVariant({ id: 'vibe_1750000000000_abc123xyz', key: 'b' });
  assert.equal(finalized.variant_request.status, 'finalized');
  assert.deepEqual(read()[0].variant_request.scaffold, []);
});

test('server leaves persisted state untouched when cleanup is incomplete', async () => {
  const { server, read, write } = createServer();
  await server.requestVariants({ id: 'vibe_1750000000000_abc123xyz', variants: candidates });
  const inconsistent = read();
  inconsistent[0].variant_request.scaffold = [];
  write(inconsistent);

  await assert.rejects(() => server.finalizeVariant({ id: 'vibe_1750000000000_abc123xyz', key: 'a' }), error => {
    assert.deepEqual(error.remaining_cleanup, [{ kind: 'scaffold_missing', key: 'switcher' }]);
    return true;
  });
  assert.equal(read()[0].variant_request.status, 'unresolved');
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

test('a persistence failure cannot partially finalize record-owned cleanup', async () => {
  const server = new LocalAnnotationsServer();
  const requested = await createServer().server.requestVariants({
    id: 'vibe_1750000000000_abc123xyz',
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
    const request = await fetch(`${baseUrl}/api/annotations/vibe_1750000000000_abc123xyz/variants/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants: candidates }),
    });
    assert.equal(request.status, 200);

    const replace = await fetch(`${baseUrl}/api/annotations/vibe_1750000000000_abc123xyz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_request: null }),
    });
    assert.equal(replace.status, 409);

    const resolve = await fetch(`${baseUrl}/api/annotations/vibe_1750000000000_abc123xyz`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    assert.equal(resolve.status, 409);

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
  await server.requestVariants({ id: 'vibe_1750000000000_abc123xyz', variants: candidates });
  const inconsistent = read();
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
      arguments: { id: 'vibe_1750000000000_abc123xyz', key: 'a' },
    },
  });
  const payload = JSON.parse(response.content[0].text);

  assert.equal(response.isError, true);
  assert.deepEqual(payload.remaining_cleanup, [{ kind: 'scaffold_missing', key: 'switcher' }]);
});
