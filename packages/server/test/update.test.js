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

test('GitHub update preserves custom paths and runs a copy outside the replaced release', async t => {
  const root = await fixture(t);
  const pkg = join(root, 'releases/v1.0.0');
  await mkdir(join(pkg, 'bin'), { recursive: true });
  await writeFile(join(pkg, 'bin/install.sh'), '# fixture');
  await writeFile(join(pkg, '.waypoint-install.json'), JSON.stringify({ channel: 'github', installRoot: root, binDir: join(root, 'custom bin'), repo: 'owner/repo', asset: 'cli.tar.gz' }));
  const plan = await detectInstallation(pkg);
  assert.deepEqual(plan.args.slice(1), ['--install-root', root, '--bin-dir', join(root, 'custom bin'), '--repo', 'owner/repo', '--asset', 'cli.tar.gz']);
  let temporary;
  await assert.rejects(updateInstallation(pkg, { execute: async (command, args) => {
    assert.equal(command, 'bash');
    temporary = args[0];
    assert.notEqual(temporary, plan.args[0]);
    assert.equal(await readFile(temporary, 'utf8'), '# fixture');
    throw new Error('simulated failure');
  } }), /simulated failure/);
  await assert.rejects(readFile(temporary), { code: 'ENOENT' });
});

test('distributed installer copies stay identical', async () => {
  const canonical = await readFile(new URL('../../../scripts/install.sh', import.meta.url), 'utf8');
  assert.equal(await readFile(new URL('../bin/install.sh', import.meta.url), 'utf8'), canonical);
  assert.equal(await readFile(new URL('../../website/public/install.sh', import.meta.url), 'utf8'), canonical);
});
