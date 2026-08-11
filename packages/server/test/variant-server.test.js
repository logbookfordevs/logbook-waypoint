import assert from 'node:assert/strict';
import test from 'node:test';

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
  server.variantScaffoldOperations = { remove: async keys => ({ removed: keys, remaining: [] }) };
  return { server, read: () => structuredClone(annotations) };
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
  const { server, read } = createServer();
  await server.requestVariants({ id: 'vibe_1750000000000_abc123xyz', variants: candidates });
  server.variantScaffoldOperations = { remove: async () => ({ removed: [], remaining: ['switcher'] }) };

  await assert.rejects(() => server.finalizeVariant({ id: 'vibe_1750000000000_abc123xyz', key: 'a' }), error => {
    assert.deepEqual(error.remaining_cleanup, ['switcher']);
    return true;
  });
  assert.equal(read()[0].variant_request.status, 'unresolved');
});
