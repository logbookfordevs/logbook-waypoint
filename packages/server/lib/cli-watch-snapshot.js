import { setTimeout as delay } from 'node:timers/promises';

import { createProjectScope } from './project-scope.js';
import { connectLocalWatch, writeStreamLine } from './cli-watch.js';

const MAX_RETRY_DELAY_MS = 5_000;

function snapshot(url, annotations, changedIds = []) {
  if (!Array.isArray(annotations)) {
    throw new Error('Waypoint Watch did not provide the current open-work index');
  }
  return {
    type: 'watch_snapshot',
    data_trust: 'untrusted',
    url,
    annotations,
    changed_ids: changedIds,
    pending_count: annotations.filter(annotation => annotation.status === 'pending').length,
    claimed_count: annotations.filter(annotation => annotation.status === 'claimed').length,
  };
}

function formatSnapshot(result) {
  const lines = [`Waypoint: ${result.pending_count} pending, ${result.claimed_count} claimed`];
  for (const annotation of result.annotations) {
    lines.push(`${annotation.status} ${annotation.id}`);
  }
  return lines.join('\n');
}

export async function runSnapshotWatch({
  url,
  timeoutMs = 25_000,
  json = false,
  once = false,
  signal,
  connect = connectLocalWatch,
  writeOutput = line => writeStreamLine(process.stdout, line, signal),
  writeDiagnostic = line => writeStreamLine(process.stderr, line, signal),
  retryDelayMs = 250,
} = {}) {
  createProjectScope(url);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 30_000) {
    throw new RangeError('timeout must be an integer between 0 and 30000');
  }

  let activeCursor;
  let connection;
  let lastEntries;
  let retryMs = retryDelayMs;
  let disconnected = false;

  try {
    while (!signal?.aborted) {
      try {
        connection ??= await connect();

        if (lastEntries === undefined) {
          const initial = await connection.watch({
            url,
            from_now: true,
            include_open_work: true,
            timeout_ms: 0,
          }, signal);
          const current = snapshot(url, initial.data.open_work);
          await writeOutput(json ? JSON.stringify(current) : formatSnapshot(current));
          lastEntries = JSON.stringify(current.annotations);
          activeCursor = initial.data.cursor;
          if (once) return current;
        }

        const result = await connection.watch({
          url,
          cursor: activeCursor,
          include_open_work: true,
          timeout_ms: timeoutMs,
        }, signal);
        if (result.data.changes.length > 0) {
          const current = snapshot(url, result.data.open_work);
          const openIds = new Set(current.annotations
            .filter(annotation => annotation.status === 'pending')
            .map(annotation => annotation.id));
          const changedIds = [...new Set(result.data.changes
            .map(change => change.annotation.id)
            .filter(id => openIds.has(id)))];
          current.changed_ids = changedIds;
          const entries = JSON.stringify(current.annotations);
          if (entries !== lastEntries || changedIds.length > 0) {
            await writeOutput(json ? JSON.stringify(current) : formatSnapshot(current));
            lastEntries = entries;
          }
        }
        activeCursor = result.data.cursor;

        if (disconnected) {
          await writeDiagnostic('Waypoint Watch reconnected.');
          disconnected = false;
        }
        retryMs = retryDelayMs;
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') break;
        if (once) throw error;

        if (!disconnected) {
          await writeDiagnostic(`Waypoint Watch disconnected: ${error.message}`);
          disconnected = true;
        }
        await connection?.close().catch(() => {});
        connection = undefined;
        if (/Invalid (scoped )?Watch cursor/.test(error.message)) {
          activeCursor = undefined;
          lastEntries = undefined;
        }
        await delay(retryMs, undefined, signal ? { signal } : undefined).catch(() => {});
        retryMs = Math.min(retryMs * 2, MAX_RETRY_DELAY_MS);
      }
    }
    return undefined;
  } finally {
    await connection?.close().catch(() => {});
  }
}
