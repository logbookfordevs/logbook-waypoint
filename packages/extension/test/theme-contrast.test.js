import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const FOREGROUND_TOKENS = ['text-primary', 'text-secondary', 'accent-ink', 'danger'];
const SURFACE_TOKENS = ['surface', 'surface-1'];
const FOREGROUND_PROPERTIES = /^(color|border(-[a-z-]+)?|outline(-[a-z-]+)?|fill|stroke|accent-color|caret-color)$/;

function luminance(hex) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map(value => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

async function appliedTokens(effectiveTheme) {
  const tokens = {};
  const host = { setAttribute() {}, style: { setProperty: (name, value) => { tokens[name.slice('--waypoint-'.length)] = value; } } };
  const context = vm.createContext({
    window: { matchMedia: () => ({ matches: effectiveTheme === 'dark' }) },
    chrome: { storage: { local: { set: async () => {} } } },
    WaypointShadowHost: { getRoot: () => ({ host }) },
    WaypointEvents: { emit() {} },
  });
  const source = await readFile(new URL('../public/content/modules/theme-manager.js', import.meta.url), 'utf8');
  vm.runInContext(`${source}\nglobalThis.WaypointThemeManager = WaypointThemeManager;`, context);
  await context.WaypointThemeManager.setPreference(effectiveTheme);
  return tokens;
}

test('foreground tokens stay readable on every surface in both themes', async () => {
  for (const theme of ['light', 'dark']) {
    const tokens = await appliedTokens(theme);
    for (const foreground of FOREGROUND_TOKENS) {
      for (const surface of SURFACE_TOKENS) {
        const ratio = contrast(tokens[foreground], tokens[surface]);
        assert.ok(ratio >= 4.5, `${theme} ${foreground} on ${surface} is ${ratio.toFixed(2)}:1`);
      }
    }
  }
});

test('accent fills carry readable text and stand apart from surfaces in both themes', async () => {
  for (const theme of ['light', 'dark']) {
    const tokens = await appliedTokens(theme);
    for (const fill of ['accent', 'primary-btn']) {
      const text = contrast(tokens['on-accent'], tokens[fill]);
      assert.ok(text >= 4.5, `${theme} on-accent on ${fill} is ${text.toFixed(2)}:1`);
      for (const surface of SURFACE_TOKENS) {
        const edge = contrast(tokens[fill], tokens[surface]);
        assert.ok(edge >= 2.5, `${theme} ${fill} against ${surface} is ${edge.toFixed(2)}:1`);
      }
    }
  }
});

test('the fill-only accent never paints text, borders, outlines, or icons', async () => {
  const source = await readFile(new URL('../public/content/modules/styles.js', import.meta.url), 'utf8');
  const offenders = [...source.matchAll(/(?<![\w-])([a-z][a-z-]*)\s*:\s*([^;{}]*var\(--waypoint-accent\)[^;{}]*)/g)]
    .filter(([, property]) => FOREGROUND_PROPERTIES.test(property))
    .map(([declaration]) => declaration.trim());

  assert.deepEqual(offenders, [], 'use --waypoint-accent-ink for foreground accents');
});
