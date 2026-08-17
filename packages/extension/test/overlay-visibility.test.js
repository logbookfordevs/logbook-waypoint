import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadShadowHost({ initiallyReducedMotion = false } = {}) {
  const animations = [];
  const saved = [];
  const toolbar = {
    animate(keyframes, options) {
      animations.push({ keyframes, options });
      return { cancel() {}, finished: Promise.resolve() };
    },
  };
  const shadowRoot = {
    appendChild() {},
    querySelector(selector) { return selector === '.waypoint-toolbar' ? toolbar : null; },
  };
  const host = {
    id: '',
    style: { cssText: '', display: '' },
    attachShadow() { return shadowRoot; },
    addEventListener() {},
    parentNode: null,
  };
  const document = {
    createElement(tag) {
      if (tag === 'div') return host;
      return { textContent: '' };
    },
    body: { appendChild() {} },
  };
  const context = vm.createContext({
    document,
    WAYPOINT_STYLES: '',
    WaypointAPI: { saveOverlayHidden(value) { saved.push(value); } },
    matchMedia() { return { matches: initiallyReducedMotion }; },
  });
  const source = await readFile(new URL('../public/content/modules/shadow-host.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  return { host: context.WaypointShadowHost, hostElement: host, animations, saved };
}

test('persisted closed state starts hidden and survives through the extension storage seam', async () => {
  const harness = await loadShadowHost();

  harness.host.init(true);
  assert.equal(harness.host.isVisible(), false);
  assert.equal(harness.hostElement.style.display, 'none');

  harness.host.show();
  assert.equal(harness.host.isVisible(), true);
  assert.equal(harness.hostElement.style.display, '');

  harness.host.hide();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(harness.host.isVisible(), false);
  assert.deepEqual(harness.saved, [false, true]);
});

test('overlay transitions animate only toolbar transform and opacity with reduced-motion support', async () => {
  const regular = await loadShadowHost();
  regular.host.init(true);
  regular.host.show();
  assert.equal(regular.animations[0].options.duration, 180);
  assert.match(regular.animations[0].options.easing, /cubic-bezier/);
  assert.deepEqual(Object.keys(regular.animations[0].keyframes[0]).sort(), ['opacity', 'transform']);

  const reduced = await loadShadowHost({ initiallyReducedMotion: true });
  reduced.host.init(true);
  reduced.host.show();
  assert.equal(reduced.animations[0].options.duration, 120);
  assert.equal('transform' in reduced.animations[0].keyframes[0], false);
});
