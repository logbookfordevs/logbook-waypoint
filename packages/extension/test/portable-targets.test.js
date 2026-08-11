import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('generated content-script keeps target selectors portable without mutating page elements', async () => {
  const source = await readFile(
    new URL('../.output/chrome-mv3/content/modules/element-context.js', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(source, /data-vibe-id/);
  assert.doesNotMatch(source, /data-text-content/);
});
