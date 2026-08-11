import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('canonical product identity drives every generated manifest field', async () => {
  const source = await readFile(new URL('../src/product.json', import.meta.url), 'utf8');
  const PRODUCT = JSON.parse(source);

  assert.deepEqual(PRODUCT, {
    name: 'Logbook Waypoint',
    description: 'Place visual waypoints on local interfaces and route them to coding agents through MCP.',
    repository: 'https://github.com/logbookfordevs/logbook-waypoint',
    support: 'https://github.com/logbookfordevs/logbook-waypoint/issues',
    homepage: 'https://github.com/logbookfordevs/logbook-waypoint#readme',
  });
});

test('toolbar exposes an empty future pet seam without shipping mascot behavior', async () => {
  const toolbar = await readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8');

  assert.match(toolbar, /data-waypoint-pet-slot/);
  assert.match(toolbar, /aria-hidden="true"/);
  assert.doesNotMatch(toolbar, /mascot|pet animation|sprite/i);
});
