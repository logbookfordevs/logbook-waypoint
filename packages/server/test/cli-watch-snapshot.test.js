import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { connectLocalWatch } from '../lib/cli-watch.js';
import { runSnapshotWatch } from '../lib/cli-watch-snapshot.js';
import { LocalAnnotationsServer } from '../lib/server.js';

async function waitFor(predicate, timeoutMs = 2_000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for Watch snapshot');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

test('snapshot Watch starts with current work, updates claims, and removes deleted work', async t => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-snapshot-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const annotationsFile = path.join(directory, 'annotations.json');
  const id = 'waypoint_1750000000000_abc123xyz';
  await writeFile(annotationsFile, JSON.stringify([{
    id,
    url: 'http://localhost:3002/firm',
    comment: 'Fix the button',
    status: 'pending',
  }]));
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  t.after(async () => {
    listener.close();
    await once(listener, 'close');
  });

  const controller = new AbortController();
  const output = [];
  const watching = runSnapshotWatch({
    url: 'http://localhost:3002/',
    timeoutMs: 100,
    json: true,
    signal: controller.signal,
    connect: () => connectLocalWatch({ serverUrl: `http://127.0.0.1:${listener.address().port}` }),
    writeOutput: async line => {
      output.push(JSON.parse(line));
      if (output.length === 3) controller.abort();
    },
  });

  await waitFor(() => output.length === 1);
  assert.deepEqual(output[0].annotations.map(annotation => annotation.id), [id]);
  assert.equal(output[0].pending_count, 1);
  assert.equal(output[0].annotations[0].comment, undefined);

  await server.changeAnnotationLifecycle({ id, operation: 'claim', owner: 'test-agent' });
  await waitFor(() => output.length === 2);
  assert.equal(output[1].annotations[0].status, 'claimed');
  assert.equal(output[1].claimed_count, 1);

  await server.deleteAnnotation({ id });
  await watching;
  assert.deepEqual(output[2].annotations, []);
  assert.equal(output[2].pending_count, 0);
  assert.equal(output[2].claimed_count, 0);
});

test('snapshot Watch emits the complete lightweight index without Survey context', async () => {
  const id = number => `waypoint_1750000000000_${String(number).padStart(9, '0')}`;
  const calls = [];
  const output = [];

  await runSnapshotWatch({
    url: 'http://localhost:3002/',
    json: true,
    once: true,
    connect: async () => ({
      watch: async args => {
        calls.push(args);
        return { data: {
          changes: [],
          cursor: 'cursor-1',
          open_work: Array.from({ length: 201 }, (_, index) => ({
            id: id(index),
            url: 'http://localhost:3002/',
            status: 'pending',
          })),
        } };
      },
      close: async () => {},
    }),
    writeOutput: async line => output.push(JSON.parse(line)),
  });

  assert.equal(calls[0].from_now, true);
  assert.equal(calls[0].include_open_work, true);
  assert.equal(output[0].annotations.length, 201);
  assert.equal(output[0].pending_count, 201);
});

test('snapshot Watch reports an edited Pending ID even when its index entry is unchanged', async () => {
  const controller = new AbortController();
  const id = 'waypoint_1750000000000_abc123xyz';
  const entry = { id, status: 'pending', url: 'http://localhost:3002/' };
  const output = [];
  let calls = 0;

  await runSnapshotWatch({
    url: 'http://localhost:3002/',
    json: true,
    signal: controller.signal,
    connect: async () => ({
      watch: async () => {
        calls += 1;
        return { data: {
          cursor: `cursor-${calls}`,
          changes: calls === 1 ? [] : [{ annotation: { id, status: 'pending' } }],
          open_work: [entry],
        } };
      },
      close: async () => {},
    }),
    writeOutput: async line => {
      output.push(JSON.parse(line));
      if (output.length === 2) controller.abort();
    },
  });

  assert.deepEqual(output[0].changed_ids, []);
  assert.deepEqual(output[1].changed_ids, [id]);
});
