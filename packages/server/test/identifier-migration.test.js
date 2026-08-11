import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const sourceExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.tsx', '.yml', '.yaml']);
const allowedHistoricalFiles = new Set([
  'LICENSE',
  'NOTICE.md',
  'CHANGELOG.md',
  'TERMS.md',
  'packages/server/LICENSE',
  'packages/server/CHANGELOG.md',
  'docs/adr/0001-build-from-the-last-mit-foundation.md',
  'docs/adr/0004-start-without-vibe-data-migration.md',
  'packages/extension/public/popup/iconify-icon.min.js',
]);
const legacyIdentifier = /\bopenclaw\b|\braphael(?: regnier)?\b|\bspellbind(?: creative studio)?\b|github\.com\/raphaelregnier\/vibe-annotations|\bvibe[ _-]annotations(?:-(?:server|extension|mcp))?\b|\bvibe_|(?:__)?vibeAnnotations\b|\bVIBE_[A-Z_]+\b/i;
const allowedHistoricalLines = new Map([
  ['docs/UPDATE_SYSTEM.md', new Set([
    "      'Initial release of Vibe Annotations (MIT foundation)',",
  ])],
  ['docs/contracts/product-identifiers.md', new Set([
    '- Waypoint starts with empty product data and does not import Vibe Annotations storage or settings.',
  ])],
  ['docs/contracts/source-identity.md', new Set([
    'The inherited annotation CRUD surface, `window.__vibeAnnotations`, and its page-visible custom events were removed rather than renamed. Source Identity is limited to the read-only probe described here.',
  ])],
]);

function trackedSourceFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: repositoryRoot })
    .toString('utf8')
    .split('\0')
    .filter(file => file && !file.includes('/test/') && !file.startsWith('test/'))
    .filter(file => sourceExtensions.has(path.extname(file)) || file === 'LICENSE');
}

function sourceWithoutAllowedAttribution(file, source) {
  const withoutAllowedLines = source
    .split('\n')
    .filter(line => !allowedHistoricalLines.get(file)?.has(line))
    .join('\n');

  if (file !== 'README.md') return withoutAllowedLines;

  const sectionStart = withoutAllowedLines.indexOf('## Project lineage\n');
  if (sectionStart === -1) return withoutAllowedLines;

  const sectionEnd = withoutAllowedLines.indexOf('\n## ', sectionStart + 1);
  return withoutAllowedLines.slice(0, sectionStart) + withoutAllowedLines.slice(sectionEnd === -1 ? withoutAllowedLines.length : sectionEnd);
}

test('active source and generated files contain no legacy predecessor identifiers or branding', async () => {
  assert.match('__vibeAnnotations', legacyIdentifier);
  const violations = [];

  for (const file of trackedSourceFiles()) {
    if (allowedHistoricalFiles.has(file)) continue;

    const source = sourceWithoutAllowedAttribution(
      file,
      await readFile(path.join(repositoryRoot, file), 'utf8'),
    );
    if (legacyIdentifier.test(source)) violations.push(file);
  }

  assert.deepEqual(violations, []);
});
