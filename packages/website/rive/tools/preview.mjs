import { mkdirSync, rmSync, rmdirSync, watch, writeFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const website = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lock = '/private/tmp/waypoint-lab-heavy-qa.lock';
if (process.argv.includes('--wait')) {
  await new Promise((resolveLock, rejectLock) => {
    const watcher = watch(dirname(lock), (_event, filename) => {
      if (filename === 'waypoint-lab-heavy-qa.lock') attempt();
    });
    const attempt = () => {
      try {
        mkdirSync(lock);
        watcher.close();
        resolveLock();
      } catch (error) {
        if (error.code !== 'EEXIST') { watcher.close(); rejectLock(error); }
      }
    };
    console.log('Waiting for the shared QA lock release; no preview is running yet.');
    attempt();
  });
} else {
  try {
    mkdirSync(lock);
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.error('Another Waypoint lab owns the QA slot. Try later or add --wait.');
      process.exit(1);
    }
    throw error;
  }
}
const ownerFile = resolve(lock, 'owner.txt');
const record = (detail) => writeFileSync(ownerFile, `task=${process.env.CODEX_THREAD_ID ?? 'rive-field-guide'}\nworktree=${resolve(website, '../..')}\nstart=${new Date().toISOString()}\nlauncher_pid=${process.pid}\n${detail}\n`);
const release = () => { rmSync(ownerFile); rmdirSync(lock); };
record('stage=export');
try {
  const result = spawnSync(resolve(homedir(), '.rive/bin/rive'), [resolve(website, 'rive/field-guide'), '--once'], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Rive export failed.');
  await import('./export-web.mjs');
} catch (error) {
  release();
  throw error;
}
const child = spawn(process.execPath, [resolve(website, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3024'], { cwd: website, stdio: 'inherit', detached: true });
record(`stage=preview\npreview_pid=${child.pid}\npreview_process_group=${child.pid}\nurl=http://127.0.0.1:3024/labs/rive`);
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
child.on('error', (error) => { console.error(error); release(); process.exitCode = 1; });
child.on('exit', (code) => { release(); process.exitCode = code ?? 0; });
console.log('Open http://127.0.0.1:3024/labs/rive. Close your isolated QA browser before Ctrl+C; the launcher then stops its server and releases the slot.');
