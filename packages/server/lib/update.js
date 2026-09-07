import { execFile, spawn } from 'node:child_process';
import { readFile, realpath, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const packageName = '@logbookfordevs/waypoint';

async function samePath(left, right) {
  try { return await realpath(left) === await realpath(right); }
  catch { return false; }
}

export async function detectInstallation(packageRoot, query = execFileAsync) {
  let metadata;
  try {
    metadata = JSON.parse(await readFile(join(packageRoot, '.waypoint-install.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Cannot read Waypoint installation metadata.', { cause: error });
  }
  if (metadata) {
    const { channel, installRoot, binDir, repo, asset } = metadata;
    if (channel !== 'github' || ![installRoot, binDir, repo, asset].every(value => typeof value === 'string' && value.length > 0)
      || !await samePath(dirname(packageRoot), join(installRoot, 'releases'))) {
      throw new Error('Invalid Waypoint installation metadata. Re-run your original installer.');
    }
    return { command: 'bash', args: [join(packageRoot, 'bin/install.sh'), '--install-root', installRoot, '--bin-dir', binDir, '--repo', repo, '--asset', asset] };
  }
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    const { stdout } = await query(npm, ['root', '--global'], { timeout: 10000 });
    const globalRoot = stdout.trim();
    if (await samePath(packageRoot, join(globalRoot, packageName))) {
      const { stdout: prefix } = await query(npm, ['prefix', '--global'], { timeout: 10000 });
      return { command: npm, args: ['install', '--global', '--prefix', resolve(prefix.trim()), `${packageName}@latest`] };
    }
  } catch { /* An unavailable npm does not identify this installation. */ }
  throw new Error('Cannot identify this installation. For an older GitHub install, re-run your original install.sh command once. For a source checkout or another package manager, update using that source.');
}

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun();
      else reject(new Error(`Update failed (${signal || `exit ${code}`}). Check the installer output above.`));
    });
  });
}

export async function updateInstallation(packageRoot, { detect = detectInstallation, execute = run } = {}) {
  const { command, args } = await detect(packageRoot);
  if (command !== 'bash') return execute(command, args);
  // The installer may replace the release containing its own script.
  const temporary = await mkdtemp(join(tmpdir(), 'waypoint-update-'));
  try {
    const installer = join(temporary, 'install.sh');
    await copyFile(args[0], installer);
    await execute(command, [installer, ...args.slice(1)]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
