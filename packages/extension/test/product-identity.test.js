import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PRODUCT_IDENTITY, validateProductIdentity } from '../../server/lib/product-identity.js';

test('canonical product identity rejects a divergent public identifier', () => {
  assert.throws(
    () => validateProductIdentity({ ...PRODUCT_IDENTITY, cliCommand: 'waypoint-dev' }),
    /cliCommand/,
  );
});

test('toolbar exposes an empty future pet seam without shipping mascot behavior', async () => {
  const toolbar = await readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8');

  assert.match(toolbar, /data-waypoint-pet-slot/);
  assert.match(toolbar, /aria-hidden="true"/);
  assert.doesNotMatch(toolbar, /mascot|pet animation|sprite/i);
});
