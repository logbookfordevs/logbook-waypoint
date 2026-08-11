import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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

test('Watch does not revise an Annotation when only object key order changes', async () => {
  const queue = new WatchQueue({ initialCursor: 'initial-test-cursor' });
  const original = annotation({ element_context: { tag: 'button', text: 'Save' } });
  queue.recordChanges([], [original]);
  const acknowledged = await queue.watch({ timeoutMs: 0 });
  const reordered = {
    status: 'pending',
    comment: 'Move this button',
    url: 'http://localhost:3000/',
    id: 'waypoint_1750000000000_abc123xyz',
    element_context: { text: 'Save', tag: 'button' },
  };

  queue.reconcile([reordered]);
  const resumed = await queue.watch({ cursor: acknowledged.cursor, timeoutMs: 0 });

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
  restored.reconcile([annotation({ status: 'discarded' })]);
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
    const records = (await readFile(historyFile, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(records, [{ type: 'header', initial_cursor: results[0].cursor }]);
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

test('persistent Watch makes a delivered cursor durable before waking its caller', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-'));
  const historyFile = path.join(directory, 'watch-history.json');
  const watch = new PersistentWatchQueue({ historyFile });

  try {
    const initial = await watch.watch({ timeoutMs: 0 }, async () => []);
    const waiting = watch.watch({ cursor: initial.cursor, timeoutMs: 100 }, async () => []);
    await new Promise(resolve => setImmediate(resolve));
    const recording = watch.recordChanges([annotation()]);
    const delivered = await waiting;
    const restored = new PersistentWatchQueue({ historyFile });

    const resumed = await restored.watch(
      { cursor: delivered.cursor, timeoutMs: 0 },
      async () => [annotation()],
    );
    await recording;

    assert.deepEqual(resumed.changes, []);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('persistent Watch reconciles a committed Queue after journal recovery', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-'));
  const historyFile = path.join(directory, 'watch-history.json');
  const watch = new PersistentWatchQueue({ historyFile });
  const pending = annotation();

  try {
    const initial = await watch.watch({ timeoutMs: 0 }, async () => []);
    await rm(directory, { recursive: true });
    await writeFile(directory, 'temporarily blocks Watch persistence');
    await assert.rejects(watch.recordChanges([pending]), /EEXIST|ENOTDIR/);
    await rm(directory);
    await mkdir(directory);

    const recovered = await watch.watch(
      { cursor: initial.cursor, timeoutMs: 0 },
      async () => [pending],
    );

    assert.equal(recovered.changes[0].annotation.id, pending.id);
    const restored = new PersistentWatchQueue({ historyFile });
    const resumed = await restored.watch(
      { cursor: recovered.cursor, timeoutMs: 0 },
      async () => [pending],
    );
    assert.deepEqual(resumed.changes, []);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('persistent Watch journal excludes screenshots and Source Identity hints', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-'));
  const historyFile = path.join(directory, 'watch-history.json');
  const watch = new PersistentWatchQueue({ historyFile });

  try {
    await watch.recordChanges([annotation({
      screenshot: { data_url: 'data:image/png;base64,AAAA' },
      source_file_path: 'src/Button.tsx',
      source_line_range: '1-2',
      source_map_available: true,
      context_hints: ['React component: Button'],
    })]);
    const journal = await readFile(historyFile, 'utf8');

    assert.doesNotMatch(journal, /data:image|source_file_path|source_line_range|context_hints/);
    assert.match(journal, /Move this button/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('persistent Watch quarantines corruption and rebuilds from the committed Queue', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-watch-'));
  const historyFile = path.join(directory, 'watch-history.json');
  await writeFile(historyFile, '{not valid journal data');
  const watch = new PersistentWatchQueue({ historyFile });
  const pending = annotation();

  try {
    const rebuilt = await watch.watch({ timeoutMs: 0 }, async () => [pending]);
    const files = await readdir(directory);

    assert.equal(rebuilt.changes[0].annotation.id, pending.id);
    assert.equal(files.some(file => file.startsWith('watch-history.json.corrupted.')), true);
    await assert.rejects(
      watch.watch({ cursor: 'cursor-from-corrupted-journal', timeoutMs: 0 }, async () => [pending]),
      /Invalid Watch cursor/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
