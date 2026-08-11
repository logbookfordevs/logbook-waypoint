import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { LocalAnnotationsServer } from '../lib/server.js';

const id = 'waypoint_1750000000000_abc123xyz';

async function fixture(now) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-lifecycle-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3000/app',
    comment: 'Retain me',
    status: 'pending',
  }]));
  return {
    directory,
    server: new LocalAnnotationsServer({
      annotationsFile,
      watchHistoryFile: path.join(directory, 'watch.json'),
      attachmentRoot: path.join(directory, 'attachments'),
      now: () => now.value,
      claimTtlMs: 1_000,
    }),
  };
}

test('HTTP, MCP, persistence, and Watch observe the same retained lifecycle', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;

  try {
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    const claimResponse = await fetch(`${baseUrl}/api/annotations/${id}/claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ owner: 'agent-one', url: 'http://localhost:3000/*' }),
    });
    assert.equal(claimResponse.status, 200);
    assert.equal((await claimResponse.json()).annotation.status, 'claimed');

    const activity = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });
    assert.equal(activity.changes.at(-1).annotation.status, 'claimed');

    const reads = await server.readAnnotations({ status: 'claimed', url: 'http://localhost:3000/*' });
    assert.equal(reads.annotations[0].claim.owner, 'agent-one');
    assert.equal((await server.readAnnotations({ status: 'claimed' })).annotations[0].claim.expires_at, '2026-08-11T12:00:01.000Z');

    let callTool;
    let listTools;
    server.setupMCPHandlersForServer({
      setRequestHandler(schema, handler) {
        if (schema === CallToolRequestSchema) callTool = handler;
        if (schema === ListToolsRequestSchema) listTools = handler;
      },
    });
    const listed = await listTools();
    assert.deepEqual(
      ['claim_annotation', 'release_annotation', 'resolve_annotation', 'discard_annotation']
        .filter(name => !listed.tools.some(tool => tool.name === name)),
      [],
    );
    const resolved = await callTool({
      params: { name: 'resolve_annotation', arguments: { id, owner: 'agent-one', url: 'http://localhost:3000/*' } },
    });
    const payload = JSON.parse(resolved.content[0].text);
    assert.equal(payload.data_trust, 'untrusted');
    assert.equal(payload.data.annotation.status, 'resolved');

    const retained = await server.readAnnotations({ status: 'resolved' });
    assert.equal(retained.annotations.length, 1);
    await assert.rejects(() => server.changeAnnotationLifecycle({ id, operation: 'discard' }), /terminal/i);
    await server.deleteAnnotation({ id });
    assert.equal((await server.readAnnotations({ status: 'all' })).annotations.length, 0);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('expired Claims return to Pending and publish Watch without read or Watch refreshing them', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    now.value += 1_001;
    const changes = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });
    assert.equal(changes.changes.at(-1).annotation.status, 'pending');
    assert.equal('claim' in changes.changes.at(-1).annotation, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Queue synchronization cannot implicitly delete retained lifecycle history', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    await server.changeAnnotationLifecycle({ id, operation: 'resolve', owner: 'agent-one' });
    const response = await fetch(`${baseUrl}/api/annotations/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ annotations: [] }),
    });

    assert.equal(response.status, 200);
    const retained = await server.readAnnotations({ status: 'resolved' });
    assert.equal(retained.annotations.length, 1);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
