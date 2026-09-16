import { setTimeout as delay } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { createProjectScope } from './project-scope.js';
import { PRODUCT_IDENTITY } from './product-identity.js';

const DEFAULT_MCP_URL = 'http://127.0.0.1:3846/mcp';
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

function parseWatchPayload(result) {
  if (result.isError) throw new Error('Waypoint Watch returned an MCP tool error');
  const text = result.content?.find(item => item.type === 'text')?.text;
  if (typeof text !== 'string') throw new Error('Waypoint Watch returned no text payload');

  const payload = JSON.parse(text);
  if (payload?.status !== 'success' || !payload.data || !Array.isArray(payload.data.changes)) {
    throw new Error(payload?.data?.error ?? 'Waypoint Watch returned an invalid payload');
  }
  return payload;
}

function formatUntrustedTerminalText(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .trim();
}

export async function connectMcpWatch({ mcpUrl = DEFAULT_MCP_URL } = {}) {
  const client = new Client({ name: `${PRODUCT_IDENTITY.cliCommand}-watch`, version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(mcpUrl));
  await client.connect(transport);

  return {
    async watch(args, signal) {
      const result = await client.callTool(
        { name: 'watch_annotations', arguments: args },
        undefined,
        { signal, timeout: args.timeout_ms + 5_000 },
      );
      return parseWatchPayload(result);
    },
    async close() {
      await client.close();
    },
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
  connect = connectMcpWatch,
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
