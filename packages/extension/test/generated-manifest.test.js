import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { PRODUCT_IDENTITY } from '../../server/lib/product-identity.js';

test('generated manifest exposes the canonical product identity', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/manifest.json', import.meta.url), 'utf8');
  const manifest = JSON.parse(source);

  assert.equal(manifest.name, PRODUCT_IDENTITY.productName);
  assert.equal(manifest.description, PRODUCT_IDENTITY.description);
  assert.equal(manifest.homepage_url, PRODUCT_IDENTITY.homepageUrl);
  assert.equal(manifest.action.default_title, PRODUCT_IDENTITY.productName);
});

test('generated background requests the complete Queue during smart sync', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/background/background.js', import.meta.url), 'utf8');

  assert.match(source, /api\/annotations\?limit=0/);
});

test('generated forced sync carries and clears pending intent removals', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/background/background.js', import.meta.url), 'utf8');
  const forceSync = source.slice(source.indexOf('async forceAPISync()'), source.indexOf('async importAnnotations('));

  assert.match(forceSync, /waypointDesignIntentRemovalIds/);
  assert.match(forceSync, /waypointVariantIntentRemovalIds/);
  assert.match(forceSync, /syncAnnotationsToAPI\(annotations, designIntentRemovalIds, variantIntentRemovalIds\)/);
  assert.match(forceSync, /waypointDesignIntentRemovalIds: \[\]/);
  assert.match(forceSync, /waypointVariantIntentRemovalIds: \[\]/);
});
