import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

test('pinned editor routes explicit Variants to named selection and ordinary comments to the comment editor', async () => {
  const { window } = parseHTML('<html><body><div id="root"></div><button id="target">Target</button></body></html>');
  const context = vm.createContext({ window, document: window.document, globalThis: null });
  context.globalThis = context;
  context.VibeShadowHost = { getRoot: () => context.document.querySelector('#root') };
  context.VibeEvents = { emit() {} };
  context.VibeAPI = {};
  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/variant-picker.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  const errorSource = await readFile(new URL('../.output/chrome-mv3/background/variant-errors.js', import.meta.url), 'utf8');
  vm.runInContext(errorSource, context);

  const ordinary = { id: 'vibe_1_abcdefghi', comment: 'Just a comment' };
  const variants = {
    id: 'vibe_2_abcdefghi',
    comment: 'Compare these',
    variant_request: {
      status: 'unresolved',
      active_variant_key: 'calm',
      variants: [
        { key: 'calm', name: 'Calm', state: 'active' },
        { key: 'bold', name: 'Bold', state: 'inactive' },
      ],
    },
  };

  assert.equal(context.WaypointVariantPicker.handles(ordinary), false);
  assert.equal(context.WaypointVariantPicker.handles(variants), true);
  assert.equal(context.WaypointVariantPicker.show(variants, context.document.querySelector('#target')), true);
  assert.equal(context.document.querySelector('.waypoint-variant-picker').getAttribute('aria-label'), 'Variants');
  assert.deepEqual(
    [...context.document.querySelectorAll('.waypoint-variant-activate')].map(node => node.textContent.trim()),
    ['Calm · Active', 'Bold'],
  );
  assert.equal(context.document.querySelector('[data-variant-key="calm"] .waypoint-variant-discard').disabled, true);

  context.VibeAPI.activateVariant = async () => {
    throw new Error('Cleanup incomplete: scaffold switcher remains');
  };
  context.document.querySelector('[data-variant-key="bold"] .waypoint-variant-activate').click();
  await new Promise(resolve => setImmediate(resolve));

  const status = context.document.querySelector('.waypoint-variant-status');
  assert.equal(status.getAttribute('role'), 'alert');
  assert.match(status.textContent, /scaffold switcher remains/);
  assert.notEqual(context.document.querySelector('.waypoint-variant-picker'), null);

  const finalized = {
    ...variants,
    variant_request: { ...variants.variant_request, status: 'finalized' },
  };
  assert.equal(context.WaypointVariantPicker.handles(finalized), false);
  assert.equal(context.WaypointVariantPicker.locksPresentation(finalized), true);
  assert.deepEqual(
    Object.keys(context.WaypointVariantPicker.buildAnnotationUpdates(finalized, 'Updated comment', {}, 'changed')).sort(),
    ['comment', 'updated_at'],
  );
  assert.equal(
    context.WaypointVariantErrors.formatRemainingCleanup([
      { kind: 'scaffold_missing', key: 'switcher' },
      { kind: 'active_variant', key: 'bold' },
    ]),
    'scaffold_missing:switcher, active_variant:bold',
  );
});
