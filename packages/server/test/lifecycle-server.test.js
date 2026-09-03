import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
    assert.equal((await server.readAnnotations({ status: 'claimed', url: 'http://localhost:3000/*' })).annotations[0].claim.expires_at, '2026-08-11T12:00:01.000Z');

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
    assert.deepEqual(
      listed.tools.find(tool => tool.name === 'export_annotations').inputSchema.properties.status.enum,
      ['pending', 'claimed', 'resolved', 'discarded', 'all'],
    );
    const resolved = await callTool({
      params: { name: 'resolve_annotation', arguments: { id, owner: 'agent-one', url: 'http://localhost:3000/*' } },
    });
    const payload = JSON.parse(resolved.content[0].text);
    assert.equal(payload.data_trust, 'untrusted');
    assert.equal(payload.data.annotation.status, 'resolved');

    const retained = await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' });
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
test('HTTP release publishes and persists a recoverable Work Notice through Read and Watch', async () => {
  const now = { value: Date.parse('2026-08-19T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    const response = await fetch(`${baseUrl}/api/annotations/${id}/release`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        owner: 'agent-one',
        reason: {
          code: 'workflow_unavailable',
          summary: 'Install and configure Impeccable, then claim this Annotation again.',
        },
      }),
    });

    assert.equal(response.status, 200);
    const released = (await response.json()).annotation;
    assert.deepEqual(released.work_notice, {
      code: 'workflow_unavailable',
      summary: 'Install and configure Impeccable, then claim this Annotation again.',
      created_at: '2026-08-19T12:00:00.000Z',
    });
    assert.equal(released.status, 'pending');

    const persisted = JSON.parse(await readFile(path.join(directory, 'annotations.json'), 'utf8'))[0];
    assert.deepEqual(persisted.work_notice, released.work_notice);
    assert.deepEqual((await server.readAnnotations({ status: 'pending', url: 'http://localhost:3000/*' })).annotations[0].work_notice, released.work_notice);
    const watched = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });
    assert.deepEqual(watched.changes.at(-1).annotation.work_notice, released.work_notice);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('MCP can dismiss a Work Notice without changing Pending status', async () => {
  const now = { value: Date.parse('2026-08-19T12:00:00.000Z') };
  const { directory, server } = await fixture(now);

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    await server.changeAnnotationLifecycle({
      id,
      operation: 'release',
      owner: 'agent-one',
      reason: { code: 'execution_failed', summary: 'The workflow stopped. Claim to retry.' },
    });
    let callTool;
    let listTools;
    server.setupMCPHandlersForServer({
      setRequestHandler(schema, handler) {
        if (schema === CallToolRequestSchema) callTool = handler;
        if (schema === ListToolsRequestSchema) listTools = handler;
      },
    });

    const listed = await listTools();
    assert.ok(listed.tools.some(tool => tool.name === 'dismiss_work_notice'));
    const dismissed = await callTool({
      params: { name: 'dismiss_work_notice', arguments: { id } },
    });
    const annotation = JSON.parse(dismissed.content[0].text).data.annotation;

    assert.equal(annotation.status, 'pending');
    assert.equal('work_notice' in annotation, false);
    assert.equal('work_notice' in (await server.readAnnotations({ status: 'pending', url: 'http://localhost:3000/*' })).annotations[0], false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Claim locks the Design Intent and comment work contract', async () => {
  const now = { value: Date.parse('2026-08-19T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    const response = await fetch(`${baseUrl}/api/annotations/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        comment: 'Replace the contract under the claimant',
        design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
      }),
    });

    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /Claimed.*Annotation/i);
    const retained = (await server.readAnnotations({ status: 'claimed', url: 'http://localhost:3000/*' })).annotations[0];
    assert.equal(retained.comment, 'Retain me');
    assert.equal('design_intent' in retained, false);

    const syncResponse = await fetch(`${baseUrl}/api/annotations/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ annotations: [{ ...retained, comment: 'Bypass through sync' }] }),
    });
    assert.equal(syncResponse.status, 409);
    assert.match((await syncResponse.json()).error, /work contract/i);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('terminal Annotation history rejects generic comment and Design Intent updates', async () => {
  const now = { value: Date.parse('2026-08-19T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    await server.changeAnnotationLifecycle({ id, operation: 'resolve', owner: 'agent-one' });
    const response = await fetch(`${baseUrl}/api/annotations/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ comment: 'Rewrite retained history' }),
    });

    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /read-only/i);
    assert.equal((await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' })).annotations[0].comment, 'Retain me');
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('Design Actions resolve with a retained Resolution Record while Watch stays concise', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-resolution-record-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3000/app',
    comment: 'Make the hierarchy intentional',
    status: 'pending',
    design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
  }]));
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;
  const resolutionRecord = {
    summary: 'Clarified the heading hierarchy and supporting copy.',
    verification: ['Focused lifecycle tests pass', 'Reviewed at 390px'],
  };

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    const response = await fetch(`${baseUrl}/api/annotations/${id}/resolve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ owner: 'agent-one', resolution_record: resolutionRecord }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).annotation.resolution_record, resolutionRecord);

    const persisted = JSON.parse(await readFile(annotationsFile, 'utf8'))[0];
    assert.deepEqual(persisted.resolution_record, resolutionRecord);

    const read = (await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' })).annotations[0];
    assert.deepEqual(read.resolution_record, resolutionRecord);

    let callTool;
    server.setupMCPHandlersForServer({
      setRequestHandler(schema, handler) {
        if (schema === CallToolRequestSchema) callTool = handler;
      },
    });
    const mcpRead = await callTool({
      params: { name: 'read_annotations', arguments: { status: 'resolved', url: 'http://localhost:3000/*' } },
    });
    assert.deepEqual(JSON.parse(mcpRead.content[0].text).data.annotations[0].resolution_record, resolutionRecord);

    const watched = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });
    assert.deepEqual(watched.changes.at(-1).annotation.resolution_record, resolutionRecord);

    for (const synchronized of [
      { ...persisted, resolution_record: undefined },
      {
        ...persisted,
        resolution_record: { summary: 'Rewritten history', verification: ['Untrusted replacement'] },
      },
    ]) {
      const sync = await fetch(`${baseUrl}/api/annotations/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ annotations: [synchronized] }),
      });
      assert.equal(sync.status, 200);
      assert.deepEqual(
        (await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' })).annotations[0].resolution_record,
        resolutionRecord,
      );
    }

    const restarted = new LocalAnnotationsServer({
      annotationsFile,
      watchHistoryFile: path.join(directory, 'watch.json'),
      attachmentRoot: path.join(directory, 'attachments'),
    });
    assert.deepEqual(
      (await restarted.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' })).annotations[0].resolution_record,
      resolutionRecord,
    );
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('expired Variant work can be finalized, reclaimed, verified, and resolved without losing intent history', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const designIntent = { schema_version: 1, workflow: 'impeccable', action: 'polish' };
  const variantIntent = { requested: true, default_count: 3 };
  const resolutionRecord = {
    summary: 'Finalized the selected hierarchy treatment.',
    verification: ['Focused lifecycle and Variant tests pass'],
  };

  try {
    await server.applyAnnotationsUpdate(annotations => {
      Object.assign(annotations[0], { design_intent: designIntent, variant_intent: variantIntent });
    });
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'generator' });
    await server.requestVariants({
      id,
      variants: [
        { key: 'quiet', name: 'Quiet', implementation: { css: '.card { gap: 8px; }' }, scaffold: ['catalog'] },
        { key: 'balanced', name: 'Balanced', implementation: { css: '.card { gap: 12px; }' }, scaffold: ['catalog'] },
        { key: 'bold', name: 'Bold', implementation: { css: '.card { gap: 16px; }' }, scaffold: ['catalog'] },
      ],
    });

    now.value += 1_001;
    const expired = (await server.readAnnotations({ status: 'pending', url: 'http://localhost:3000/*' })).annotations[0];
    assert.equal(expired.status, 'pending');
    assert.equal(expired.variant_request.status, 'unresolved');
    assert.deepEqual(expired.design_intent, designIntent);

    const finalized = await server.finalizeVariant({ id, key: 'balanced' });
    assert.equal(finalized.status, 'pending');
    assert.equal(finalized.variant_request.status, 'finalized');
    assert.deepEqual(finalized.variant_request.scaffold, []);

    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'verifier' });
    const resolved = await server.changeAnnotationLifecycle({
      id,
      operation: 'resolve',
      owner: 'verifier',
      resolution_record: resolutionRecord,
    });

    assert.equal(resolved.status, 'resolved');
    assert.deepEqual(resolved.design_intent, designIntent);
    assert.deepEqual(resolved.resolution_record, resolutionRecord);
    assert.equal(resolved.variant_request.active_variant_key, 'balanced');
    assert.equal('scaffold' in resolved.variant_request, false);
    const read = (await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' })).annotations[0];
    assert.deepEqual(read.design_intent, designIntent);
    assert.deepEqual(read.resolution_record, resolutionRecord);
    const watched = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });
    assert.deepEqual(watched.changes.at(-1).annotation.resolution_record, resolutionRecord);
    assert.equal('variant_presentation' in watched.changes.at(-1).annotation, false);
    const persisted = JSON.parse(await readFile(path.join(directory, 'annotations.json'), 'utf8'))[0];
    assert.deepEqual(persisted.variant_request.scaffold, []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Design Actions require safe Resolution Records while ordinary resolution stays compatible', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);

  try {
    await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'agent-one' });
    const ordinary = await server.changeAnnotationLifecycle({ id, operation: 'resolve', owner: 'agent-one' });
    assert.equal(ordinary.status, 'resolved');
    assert.equal('resolution_record' in ordinary, false);

    const designAction = {
      ...ordinary,
      id: 'waypoint_1750000000001_def456uvw',
      status: 'claimed',
      claim: {
        owner: 'agent-two',
        refreshed_at: '2026-08-11T12:00:00.000Z',
        expires_at: '2026-08-11T12:01:00.000Z',
      },
      design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
    };
    await server.applyAnnotationsUpdate(annotations => annotations.push(designAction));

    await assert.rejects(
      () => server.changeAnnotationLifecycle({ id: designAction.id, operation: 'resolve', owner: 'agent-two' }),
      /Resolution Record/i,
    );
    for (const unsafeEvidence of [
      'Impeccable Live polling journal step completed',
      'hidden\nprompt copied into the implementation',
      'Stack\nTrace\n at worker (/workspace/project/file.js:1:2)',
      'Reviewed output in (/Users/person/project/file.js)',
      'Copied C:\\Users\\person\\project\\file.js',
    ]) {
      await assert.rejects(
        () => server.changeAnnotationLifecycle({
          id: designAction.id,
          operation: 'resolve',
          owner: 'agent-two',
          resolution_record: {
            summary: 'Updated the visible developer prompt field.',
            verification: [unsafeEvidence],
          },
        }),
        /safe provider-neutral evidence/i,
      );
    }

    const accepted = await server.changeAnnotationLifecycle({
      id: designAction.id,
      operation: 'resolve',
      owner: 'agent-two',
      resolution_record: {
        summary: 'Renamed the visible developer prompt field.',
        verification: ['Manual verification remains required'],
      },
    });
    assert.equal(accepted.status, 'resolved');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('legacy resolved Design Actions remain readable without fabricating evidence', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-legacy-resolution-record-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3000/app',
    comment: 'Resolved before Resolution Records existed',
    status: 'resolved',
    design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
  }]));
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    const annotation = (await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' })).annotations[0];
    assert.equal(annotation.status, 'resolved');
    assert.equal('resolution_record' in annotation, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('HTTP Queue reads reject non-canonical lifecycle status filters', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;

  try {
    const response = await fetch(`${baseUrl}/api/annotations?status=completed`);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /invalid status/i);
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
    const retained = await server.readAnnotations({ status: 'resolved', url: 'http://localhost:3000/*' });
    assert.equal(retained.annotations.length, 1);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('persisted Queue records reject non-canonical lifecycle states', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-lifecycle-invalid-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3000/app',
    comment: 'Legacy state',
    status: 'completed',
  }]));
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await assert.rejects(
      () => server.readAnnotations({ status: 'all' }),
      /invalid lifecycle state/i,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('persisted Queue records reject malformed Work Notices', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-work-notice-invalid-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3000/app',
    comment: 'Unsafe notice',
    status: 'pending',
    work_notice: {
      code: 'execution_failed',
      summary: 'Stack trace:\nsecret-token',
      created_at: '2026-08-19T12:00:00.000Z',
    },
  }]));
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await assert.rejects(() => server.readAnnotations({ status: 'all' }), /Work Notice/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('permanent deletion returns 404 for a missing canonical Annotation', async () => {
  const now = { value: Date.parse('2026-08-11T12:00:00.000Z') };
  const { directory, server } = await fixture(now);
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const missingId = 'waypoint_1750000000001_abcdefghi';

  try {
    const response = await fetch(`http://127.0.0.1:${listener.address().port}/api/annotations/${missingId}`, {
      method: 'DELETE',
    });
    assert.equal(response.status, 404);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('Freeform Design Intent crosses HTTP, persistence, MCP Read, and Watch without replacing lifecycle', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-design-intent-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;
  const designIntent = {
    schema_version: 1,
    workflow: 'impeccable',
    action: null,
  };
  const annotation = {
    id,
    url: 'http://localhost:3000/app',
    comment: 'Make the hierarchy feel intentional',
    status: 'pending',
    design_intent: designIntent,
  };

  try {
    const baseline = await server.watchAnnotations({ timeout_ms: 0 });
    const response = await fetch(`${baseUrl}/api/annotations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(annotation),
    });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).annotation.design_intent, designIntent);

    const persisted = JSON.parse(await readFile(annotationsFile, 'utf8'));
    assert.deepEqual(persisted[0].design_intent, designIntent);
    assert.equal(persisted[0].status, 'pending');

    const read = await server.readAnnotations({ status: 'pending', url: 'http://localhost:3000/*' });
    assert.deepEqual(read.annotations[0].design_intent, designIntent);
    assert.equal(read.annotations[0].comment, annotation.comment);

    const watched = await server.watchAnnotations({ cursor: baseline.cursor, timeout_ms: 0 });
    assert.deepEqual(watched.changes.at(-1).annotation.design_intent, designIntent);
    assert.equal(watched.changes.at(-1).annotation.status, 'pending');

    let callTool;
    server.setupMCPHandlersForServer({
      setRequestHandler(schema, handler) {
        if (schema === CallToolRequestSchema) callTool = handler;
      },
    });
    const mcpRead = await callTool({
      params: { name: 'read_annotations', arguments: { status: 'pending', url: 'http://localhost:3000/*' } },
    });
    const payload = JSON.parse(mcpRead.content[0].text);
    assert.deepEqual(payload.data.annotations[0].design_intent, designIntent);

    const ordinarySync = await fetch(`${baseUrl}/api/annotations/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ annotations: [{ ...annotation, design_intent: undefined }] }),
    });
    assert.equal(ordinarySync.status, 200);
    assert.deepEqual(
      (await server.readAnnotations({ status: 'pending', url: 'http://localhost:3000/*' })).annotations[0].design_intent,
      designIntent,
    );

    const removalResponse = await fetch(`${baseUrl}/api/annotations/sync`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        annotations: [{ ...annotation, design_intent: undefined }],
        design_intent_removals: [annotation.id],
      }),
    });
    assert.equal(removalResponse.status, 200);
    assert.equal(
      'design_intent' in (await server.readAnnotations({ status: 'pending', url: 'http://localhost:3000/*' })).annotations[0],
      false,
    );
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('HTTP rejects malformed Design Intent while ordinary Annotations remain compatible', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-design-intent-validation-'));
  const server = new LocalAnnotationsServer({
    annotationsFile: path.join(directory, 'annotations.json'),
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const baseUrl = `http://127.0.0.1:${listener.address().port}`;
  const ordinary = { id, url: 'http://localhost:3000/app', comment: 'Ordinary', status: 'pending' };

  try {
    for (const design_intent of [
      { schema_version: 2, workflow: 'impeccable', action: null },
      { schema_version: 1, workflow: 'other', action: null },
      { schema_version: 1, workflow: 'impeccable', action: 'unknown-action' },
      { schema_version: 1, workflow: 'impeccable', action: null, extra: true },
    ]) {
      const response = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...ordinary, design_intent }),
      });
      assert.equal(response.status, 400);
      assert.match((await response.json()).error, /Design Intent/i);
    }

    const ordinaryResponse = await fetch(`${baseUrl}/api/annotations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ordinary),
    });
    assert.equal(ordinaryResponse.status, 200);
    assert.equal('design_intent' in (await ordinaryResponse.json()).annotation, false);

    const invalidUpdate = await fetch(`${baseUrl}/api/annotations/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        design_intent: { schema_version: 2, workflow: 'impeccable', action: null },
      }),
    });
    assert.equal(invalidUpdate.status, 400);
    assert.match((await invalidUpdate.json()).error, /Design Intent schema version/i);

    const validUpdate = await fetch(`${baseUrl}/api/annotations/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
      }),
    });
    assert.equal(validUpdate.status, 200);
    const removeUpdate = await fetch(`${baseUrl}/api/annotations/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ design_intent: null }),
    });
    assert.equal(removeUpdate.status, 200);
    assert.equal('design_intent' in (await removeUpdate.json()).annotation, false);
  } finally {
    listener.closeAllConnections();
    await new Promise(resolve => listener.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});

test('persisted malformed Design Intent is rejected before HTTP, MCP, or Watch can expose it', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-design-intent-persisted-invalid-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3000/app',
    comment: 'Malformed persisted intent',
    status: 'pending',
    design_intent: { schema_version: 1, workflow: 'other', action: null },
  }]));
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await assert.rejects(() => server.readAnnotations({ status: 'all' }), /Design Intent workflow/i);
    await assert.rejects(() => server.watchAnnotations({ timeout_ms: 0 }), /Design Intent workflow/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
