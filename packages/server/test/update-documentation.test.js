import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const activeUpdateDocs = [
  'README.md',
  'packages/server/README.md',
  'docs/UPDATE_SYSTEM.md',
  'docs/DEVELOPMENT.md',
  'TERMS.md',
];

test('active documentation describes only quiet local compatibility state', async () => {
  const sources = await Promise.all(activeUpdateDocs.map(async file => ({
    file,
    source: await readFile(path.join(repositoryRoot, file), 'utf8'),
  })));
  const bannedAffirmativeClaims = [
    /(?:shows?|displays?|provides?|adds?)\s+(?:an?\s+)?(?:promotional\s+)?(?:NEW badge|update banner|what(?:'|’)s new)/i,
    /(?:server|extension)\s+(?:automatically\s+)?(?:checks?|polls?|queries?|fetches?)[^.\n]*(?:registry|release|changelog)/i,
    /registry\.npmjs\.(?:org|com)|api\.github\.com\/repos\/[^\s]+\/releases/i,
  ];

  const violations = sources.flatMap(({ file, source }) => bannedAffirmativeClaims
    .filter(pattern => pattern.test(source))
    .map(pattern => `${file}: ${pattern}`));

  assert.deepEqual(violations, []);
  const guide = sources.find(({ file }) => file === 'docs/UPDATE_SYSTEM.md').source;
  assert.match(guide, /GET http:\/\/127\.0\.0\.1:3846\/health/);
  assert.match(guide, /minExtensionVersion/);
  assert.match(guide, /no automatic registry, release, or changelog request/);
});

test('runtime contains no promotional update or remote registry machinery', async () => {
  const background = await readFile(path.join(repositoryRoot, 'packages/extension/public/background/background.js'), 'utf8');
  const server = await readFile(path.join(repositoryRoot, 'packages/server/lib/server.js'), 'utf8');
  const runtime = `${background}\n${server}`;

  assert.doesNotMatch(runtime, /checkForUpdates|getChangelogForVersion|registry\.npmjs\.|api\.github\.com\/repos\/[^\s]+\/releases/);
  assert.doesNotMatch(runtime, /setBadgeText\s*\(\s*\{[^}]*text:\s*['"]NEW['"]/s);
  assert.doesNotMatch(runtime, /update it if annotation sync behaves unexpectedly/i);
});
