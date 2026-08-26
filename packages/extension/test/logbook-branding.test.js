import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const contentThemeUrl = new URL('../public/content/modules/theme-manager.js', import.meta.url);
const contentStylesUrl = new URL('../public/content/modules/styles.js', import.meta.url);
const toolbarUrl = new URL('../public/content/modules/floating-toolbar.js', import.meta.url);

test('Waypoint presents the Driftwood recipe in Day Chart and Night Watch', async () => {
  const [contentTheme, contentStyles, toolbar] = await Promise.all([
    readFile(contentThemeUrl, 'utf8'),
    readFile(contentStylesUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);

  const hostProperties = new Map();
  const hostAttributes = new Map();
  const contentContext = vm.createContext({
    chrome: {
      storage: {
        local: { get: async () => ({ waypointThemePreference: 'dark' }), set: async () => {} },
        onChanged: { addListener: () => {} },
      },
    },
    WaypointEvents: { emit: () => {} },
    WaypointShadowHost: {
      getRoot: () => ({
        host: {
          style: { setProperty: (key, value) => hostProperties.set(key, value) },
          setAttribute: (key, value) => hostAttributes.set(key, value),
        },
      }),
    },
    window: { matchMedia: () => ({ matches: true, addEventListener: () => {} }) },
  });
  vm.runInContext(contentTheme, contentContext, { filename: 'theme-manager.js' });
  await contentContext.WaypointThemeManager.init();

  assert.equal(hostProperties.get('--waypoint-surface'), '#152827');
  assert.equal(hostProperties.get('--waypoint-surface-1'), '#24312e');
  assert.equal(hostProperties.get('--waypoint-highlight'), '#69aaa4');
  assert.equal(hostProperties.get('--waypoint-selection'), '#69aaa4');
  assert.equal(hostProperties.get('--waypoint-on-selection'), '#071b1d');
  assert.equal(hostAttributes.get('data-lfd-recipe'), 'driftwood');
  assert.equal(hostAttributes.get('data-lfd-theme'), 'night');

  assert.match(contentStyles, /--waypoint-primary-btn:\s*#102c2c/i);
  assert.match(contentStyles, /Public Sans/);
  assert.match(toolbar, /Day Chart/);
  assert.match(toolbar, /Night Watch/);
});

test('floating toolbar uses Atlantic Chartroom roles without legacy palette colors', async () => {
  const contentStyles = await readFile(contentStylesUrl, 'utf8');
  const toolbarStyles = contentStyles.slice(
    contentStyles.indexOf('/* ===== Floating toolbar ===== */'),
    contentStyles.indexOf('/* ===== Settings dropdown ===== */'),
  );

  assert.match(toolbarStyles, /background:\s*var\(--waypoint-surface-1\)/);
  assert.match(toolbarStyles, /border:\s*1px solid var\(--waypoint-outline\)/);
  assert.match(toolbarStyles, /background:\s*var\(--waypoint-selection\)/);
  assert.match(toolbarStyles, /color:\s*var\(--waypoint-on-selection\)/);
  assert.match(toolbarStyles, /background:\s*var\(--waypoint-warning\)/);
  assert.match(toolbarStyles, /background:\s*#bd9348/i);
  assert.match(toolbarStyles, /:host\(\[data-lfd-theme="night"\]\) \.waypoint-tb-settings/);
  assert.match(toolbarStyles, /rgb\(244 239 222 \/ 12%\)/);
  assert.match(toolbarStyles, /drop-shadow\(0 0 1px rgb\(244 239 222 \/ 90%\)\)/);
  assert.doesNotMatch(toolbarStyles, /#fbf4e3|#cfb881|#efe2c5|#bd4d29|#a9894f|#10b981|#ef4444|#ec4899/i);
});
