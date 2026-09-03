import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
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
