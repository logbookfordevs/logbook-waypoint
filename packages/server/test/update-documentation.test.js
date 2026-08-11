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
];

test('active documentation describes only quiet local compatibility state', async () => {
  const sources = await Promise.all(activeUpdateDocs.map(async file => ({
    file,
    source: await readFile(path.join(repositoryRoot, file), 'utf8'),
  })));
  const bannedClaims = [
    /\bNEW badge\b/i,
    /\bupdate banner\b/i,
    /\bwhat(?:'|’)s new\b/i,
    /getChangelogForVersion|checkForUpdates/,
    /registry\.npmjs\.(?:org|com)|api\.github\.com\/repos\/[^\s]+\/releases/i,
    /automatically checks?[^.\n]*(?:registry|release)/i,
  ];

  const violations = sources.flatMap(({ file, source }) => bannedClaims
    .filter(pattern => pattern.test(source))
    .map(pattern => `${file}: ${pattern}`));

  assert.deepEqual(violations, []);
  const guide = sources.find(({ file }) => file === 'docs/UPDATE_SYSTEM.md').source;
  assert.match(guide, /GET http:\/\/127\.0\.0\.1:3846\/health/);
  assert.match(guide, /minExtensionVersion/);
  assert.match(guide, /no automatic registry, release, or changelog request/);
});
