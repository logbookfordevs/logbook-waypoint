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

test('toolbar uses Thelu as a functional settings icon without a decorative pet slot', async () => {
  const toolbar = await readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8');

  assert.match(toolbar, /assets\/thelu\/thelu-settings-day-smooth\.png/);
  assert.match(toolbar, /assets\/thelu\/thelu-settings-night\.png/);
  assert.match(toolbar, /waypoint-branded-settings-icon-day/);
  assert.match(toolbar, /waypoint-branded-settings-icon-night/);
  assert.match(toolbar, /waypoint-tb-settings/);
  assert.doesNotMatch(toolbar, /data-waypoint-pet-slot|thelu-toolbar\.png/);
});

test('collapsed toolbar uses the selected Thelu inside Waypoint control', async () => {
  const toolbar = await readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8');

  assert.match(toolbar, /assets\/thelu\/thelu-waypoint-collapsed\.png/);
  assert.match(toolbar, /waypoint-collapsed-icon/);
  assert.match(toolbar, /isCollapsed \? ICONS\.collapsed : ICONS\.collapse/);
  assert.match(toolbar, /isCollapsed \? 'Expand' : 'Collapse'/);
});
