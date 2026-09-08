import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectInstallation, updateInstallation } from '../lib/update.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'waypoint-update-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('npm update targets the verified global prefix', async t => {
  const root = await fixture(t);
  const globalRoot = join(root, 'lib/node_modules');
  const pkg = join(globalRoot, '@logbookfordevs/waypoint');
  await mkdir(pkg, { recursive: true });
  const plan = await detectInstallation(pkg, async (_, args) => ({ stdout: args[0] === 'root' ? globalRoot : root }));
  assert.deepEqual(plan.args, ['install', '--global', '--prefix', root, '@logbookfordevs/waypoint@latest']);
});

test('source checkout cannot update a different global installation', async t => {
  const root = await fixture(t);
  await assert.rejects(detectInstallation(root, async () => ({ stdout: join(root, 'node_modules') })), /Cannot identify/);
});

test('GitHub update downloads its installer and preserves custom paths', async t => {
  const root = await fixture(t);
  const pkg = join(root, 'releases/v1.0.0');
  await mkdir(pkg, { recursive: true });
  await writeFile(join(pkg, '.waypoint-install.json'), JSON.stringify({ channel: 'github', installRoot: root, binDir: join(root, 'custom bin'), repo: 'owner/repo', asset: 'cli.tar.gz' }));
  const calls = [];
  let temporary;
  await updateInstallation(pkg, { execute: async (command, args) => {
    calls.push(command);
    if (command === 'curl') {
      assert.equal(args.at(-1), 'https://waypoint.logbookfordevs.com/install.sh');
      temporary = args[args.indexOf('--output') + 1];
      await writeFile(temporary, '# downloaded installer');
    } else {
      assert.equal(await readFile(args[0], 'utf8'), '# downloaded installer');
      assert.deepEqual(args.slice(1), ['--install-root', root, '--bin-dir', join(root, 'custom bin'), '--repo', 'owner/repo', '--asset', 'cli.tar.gz']);
    }
  } });
  assert.deepEqual(calls, ['curl', 'bash']);
  await assert.rejects(readFile(temporary), { code: 'ENOENT' });
});

test('failed installer download never runs bash and removes partial download', async t => {
  const root = await fixture(t);
  let temporary;
  await assert.rejects(updateInstallation(root, {
    detect: async () => ({ command: 'bash', args: [] }),
    execute: async (command, args) => {
      assert.equal(command, 'curl');
      temporary = args[args.indexOf('--output') + 1];
      await writeFile(temporary, '# partial');
      throw new Error('download failed');
    },
  }), /download failed/);
  await assert.rejects(readFile(temporary), { code: 'ENOENT' });
});
