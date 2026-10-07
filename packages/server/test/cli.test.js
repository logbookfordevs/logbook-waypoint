import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';
import test from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('start exposes foreground as the explicit alternative to background startup', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [path.join(serverRoot, 'bin/cli.js'), 'start', '--help'],
  );

  assert.match(stdout, /-f, --foreground\s+Keep the server attached to this terminal/);
  assert.doesNotMatch(stdout, /--daemon/);
});

test('watch exposes current snapshots and an explicit detailed event mode', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [path.join(serverRoot, 'bin/cli.js'), 'watch', '--help'],
  );

  assert.match(stdout, /--json\s+Write each current open-work snapshot as one JSON/);
  assert.match(stdout, /--events\s+Write detailed changes; without --cursor, replay\s+full Watch/);
  assert.match(stdout, /--once\s+Return after the first snapshot/);
  assert.match(stdout, /--cursor <cursor>\s+Resume a detailed --events stream/);
  assert.doesNotMatch(stdout, /--daemon/);
});

test('snapshot Watch rejects a cursor reserved for the detailed event stream', async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(serverRoot, 'bin/cli.js'),
      'watch',
      'http://localhost:3000/',
      '--cursor',
      'old-cursor',
    ]),
    error => {
      assert.match(error.stderr, /--cursor requires --events/);
      return true;
    },
  );
});


test('restart starts the default background server without treating node as a command', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-cli-restart-'));
  try {
    const script = `
      import os from 'node:os';
      import childProcess from 'node:child_process';
      import { syncBuiltinESMExports } from 'node:module';
      import { pathToFileURL } from 'node:url';
      const directory = process.argv[1];
      os.homedir = () => directory;
      childProcess.spawn = () => ({ pid: process.pid, unref() {} });
      syncBuiltinESMExports();
      globalThis.fetch = async () => new Response('', { status: 200 });
      const entrypoint = process.argv[2];
      process.argv = [process.execPath, entrypoint, 'restart'];
      await import(pathToFileURL(entrypoint).href);
    `;
    const { stdout, stderr } = await execFileAsync(process.execPath, [
      '--input-type=module', '--eval', script, directory, path.join(serverRoot, 'bin/cli.js'),
    ], { timeout: 10000 });

    assert.match(stdout, /Restarting server/);
    assert.match(stdout, /Logbook Waypoint server running/);
    assert.doesNotMatch(stderr, /unknown command/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
