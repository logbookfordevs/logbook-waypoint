import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { PersistentWatchQueue, WatchQueue } from '../lib/watch-queue.js';

const annotation = (overrides = {}) => ({
  id: 'waypoint_1750000000000_abc123xyz',
  url: 'http://localhost:3000/',
  comment: 'Move this button',
  status: 'pending',
  ...overrides,
});

test('Watch returns a successful empty timeout without changing Queue state', async () => {
  const queue = new WatchQueue({ initialCursor: 'initial-test-cursor' });

  const result = await queue.watch({ timeoutMs: 1 });

  assert.deepEqual(result.changes, []);
  assert.equal(typeof result.cursor, 'string');
});

test('Watch resumes from an opaque cursor and delivers changed terminal states', async () => {
  const queue = new WatchQueue({ initialCursor: 'initial-test-cursor' });
  const pending = annotation();
  queue.recordChanges([], [pending]);
  const first = await queue.watch({ timeoutMs: 0 });

  queue.recordChanges([pending], [annotation({ status: 'resolved' })]);
  const resumed = await queue.watch({ cursor: first.cursor, timeoutMs: 0 });

  assert.equal(first.changes[0].annotation.status, 'pending');
  assert.equal(resumed.changes[0].annotation.status, 'resolved');
  assert.notEqual(resumed.cursor, first.cursor);
  assert.doesNotMatch(first.cursor, /test|waypoint_/);
});

test('Watch delivery is at least once until the returned cursor is acknowledged', async () => {
  const queue = new WatchQueue({ initialCursor: 'initial-test-cursor' });
  queue.recordChanges([], [annotation()]);

  const first = await queue.watch({ timeoutMs: 0 });
  const repeated = await queue.watch({ timeoutMs: 0 });
  const resumed = await queue.watch({ cursor: first.cursor, timeoutMs: 0 });

  assert.deepEqual(repeated.changes, first.changes);
  assert.deepEqual(resumed.changes, []);
});

test('Watch reconnects from the last successful cursor after Queue restoration', async () => {
  const original = new WatchQueue({ initialCursor: 'initial-test-cursor' });
  const pending = annotation();
  original.recordChanges([], [pending]);
  const first = await original.watch({ timeoutMs: 0 });
  original.recordChanges([pending], [annotation({ comment: 'Move this button farther' })]);

  const restored = new WatchQueue(original.toJSON());
  const resumed = await restored.watch({ cursor: first.cursor, timeoutMs: 0 });

  assert.equal(resumed.changes.length, 1);
  assert.equal(resumed.changes[0].annotation.comment, 'Move this button farther');
});

test('restored Watch history can reconcile a Queue change missed before persistence', async () => {
  const pending = annotation();
  const original = new WatchQueue({ initialCursor: 'initial-test-cursor' });
  original.recordChanges([], [pending]);
  const acknowledged = await original.watch({ timeoutMs: 0 });

  const restored = new WatchQueue(original.toJSON());
  const latestById = new Map(restored.history.map(change => [change.annotation.id, change.annotation]));
  restored.recordChanges([...latestById.values()], [annotation({ status: 'discarded' })]);
  const resumed = await restored.watch({ cursor: acknowledged.cursor, timeoutMs: 0 });

  assert.equal(resumed.changes[0].annotation.status, 'discarded');
});

test('Watch wakes for a change and never creates a Claim', async () => {
  const queue = new WatchQueue({ initialCursor: 'initial-test-cursor' });
  const waiting = queue.watch({ timeoutMs: 100 });
  const pending = annotation();
  queue.recordChanges([], [pending]);

  const result = await waiting;

  assert.equal(result.changes.length, 1);
  assert.equal(result.changes[0].annotation.status, 'pending');
  assert.equal('claim' in result.changes[0].annotation, false);
});

test('Watch rejects forged and cross-Queue cursors', async () => {
  const first = new WatchQueue({ initialCursor: 'first' });
  const second = new WatchQueue({ initialCursor: 'second' });
  const cursor = (await first.watch({ timeoutMs: 0 })).cursor;

  await assert.rejects(second.watch({ cursor, timeoutMs: 0 }), /Invalid Watch cursor/);
  await assert.rejects(first.watch({ cursor: 'not-a-cursor', timeoutMs: 0 }), /Invalid Watch cursor/);
});

test('persistent Watch initialization is single-flight for concurrent first watchers', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-'));
  const historyFile = path.join(directory, 'watch-history.json');
  const watch = new PersistentWatchQueue({ historyFile });
  let loads = 0;

  try {
    const results = await Promise.all(Array.from({ length: 20 }, () => watch.watch(
      { timeoutMs: 0 },
      async () => {
        loads += 1;
        await new Promise(resolve => setTimeout(resolve, 2));
        return [];
      },
    )));

    assert.equal(loads, 1);
    assert.equal(new Set(results.map(result => result.cursor)).size, 1);
    assert.deepEqual(JSON.parse(await readFile(historyFile, 'utf8')).history, []);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('persistent Watch reconciles current Queue state when history missed a change', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-'));
  const historyFile = path.join(directory, 'watch-history.json');
  const first = new PersistentWatchQueue({ historyFile });
  const pending = annotation();

  try {
    await first.recordChanges([pending]);
    const acknowledged = await first.watch({ timeoutMs: 0 }, async () => [pending]);
    const restored = new PersistentWatchQueue({ historyFile });
    const resumed = await restored.watch(
      { cursor: acknowledged.cursor, timeoutMs: 0 },
      async () => [annotation({ status: 'discarded' })],
    );

    assert.equal(resumed.changes.length, 1);
    assert.equal(resumed.changes[0].annotation.status, 'discarded');
  } finally {
    await rm(directory, { recursive: true });
  }
});
