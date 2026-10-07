import { setTimeout as delay } from 'node:timers/promises';

import { createProjectScope } from './project-scope.js';

const DEFAULT_SERVER_URL = 'http://127.0.0.1:3846';
const MAX_RETRY_DELAY_MS = 5_000;

export async function writeStreamLine(stream, line, signal) {
  if (signal?.aborted) throw signal.reason;
  if (stream.write(`${line}\n`)) return;
  await new Promise((resolve, reject) => {
    const cleanup = () => {
      stream.removeListener('drain', onDrain);
      stream.removeListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onError = error => {
      cleanup();
      reject(error);
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    stream.once('drain', onDrain);
    stream.once('error', onError);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) onAbort();
  });
}

function formatUntrustedTerminalText(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .trim();
}

export async function connectLocalWatch({ serverUrl = DEFAULT_SERVER_URL } = {}) {
  const endpoint = new URL('/api/watch', serverUrl);
  return {
    async watch(args, signal) {
      const requestSignal = AbortSignal.timeout((args.timeout_ms ?? 25_000) + 5_000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(args),
        signal: signal ? AbortSignal.any([signal, requestSignal]) : requestSignal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `Waypoint Watch returned HTTP ${response.status}`);
      if (payload?.type !== 'watch_events' || !Array.isArray(payload.data?.changes) || typeof payload.data.cursor !== 'string') {
        throw new Error('Waypoint Watch returned an invalid payload');
      }
      return payload;
    },
    async close() {},
  };
}

function formatHumanChange(change, cursor) {
  const annotation = change.annotation ?? {};
  const type = formatUntrustedTerminalText(change.change_type ?? annotation.status ?? 'changed');
  const id = formatUntrustedTerminalText(annotation.id ?? 'unknown');
  const url = formatUntrustedTerminalText(annotation.url ?? '');
  const comment = typeof annotation.comment === 'string'
    ? formatUntrustedTerminalText(annotation.comment)
    : '';
  const summary = comment ? ` — ${comment}` : '';
  const revision = formatUntrustedTerminalText(change.revision ?? 'unknown');
  const safeCursor = formatUntrustedTerminalText(cursor);
  return `[untrusted Waypoint content] ${type} ${id} ${url}${summary}\n  revision ${revision}; resume with --cursor ${safeCursor}`;
}

function assertTimeout(timeoutMs) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 0 || timeoutMs > 30_000) {
    throw new RangeError('timeout must be an integer between 0 and 30000');
  }
}

export async function runWatch({
  url,
  cursor,
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
  assertTimeout(timeoutMs);

  let activeCursor = cursor;
  let connection;
  let retryMs = retryDelayMs;
  let disconnected = false;

  try {
    while (!signal?.aborted) {
      try {
        connection ??= await connect();
        const payload = await connection.watch({
          url,
          ...(activeCursor ? { cursor: activeCursor } : {}),
          timeout_ms: timeoutMs,
        }, signal);
        const nextCursor = payload.data.cursor;

        if (disconnected) {
          await writeDiagnostic('Waypoint Watch reconnected.');
          disconnected = false;
        }
        retryMs = retryDelayMs;

        if (json) {
          await writeOutput(JSON.stringify(payload));
        } else {
          for (const change of payload.data.changes) {
            await writeOutput(formatHumanChange(change, nextCursor));
          }
        }

        activeCursor = nextCursor;
        if (once) return payload;
      } catch (error) {
        if (signal?.aborted || error?.name === 'AbortError') break;
        if (once) throw error;

        if (!disconnected) {
          await writeDiagnostic(`Waypoint Watch disconnected: ${error.message}`);
          disconnected = true;
        }
        await connection?.close().catch(() => {});
        connection = undefined;
        await delay(retryMs, undefined, signal ? { signal } : undefined).catch(() => {});
        retryMs = Math.min(retryMs * 2, MAX_RETRY_DELAY_MS);
      }
    }
    return undefined;
  } finally {
    await connection?.close().catch(() => {});
  }
}
