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
  window.innerWidth = 1280;
  window.innerHeight = 800;
  window.HTMLElement.prototype.getBoundingClientRect = function () { return { left: 100, right: 300, top: 200, bottom: 240, width: 360, height: 300 }; };
  const context = vm.createContext({ window, document: window.document, globalThis: null });
  context.globalThis = context;
  context.WaypointShadowHost = { getRoot: () => context.document.querySelector('#root') };
  const emitted = [];
  context.WaypointEvents = { emit: (name, payload) => emitted.push({ name, payload }) };
  context.WaypointAPI = {};
  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/variant-picker.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  const errorSource = await readFile(new URL('../.output/chrome-mv3/background/variant-errors.js', import.meta.url), 'utf8');
  vm.runInContext(errorSource, context);
  const policySource = await readFile(new URL('../.output/chrome-mv3/background/variant-policy.js', import.meta.url), 'utf8');
  vm.runInContext(policySource, context);

  const ordinary = { id: 'waypoint_1_abcdefghi', comment: 'Just a comment' };
  const variants = {
    id: 'waypoint_2_abcdefghi',
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

  const position = context.WaypointVariantPicker.getPosition;
  assert.deepEqual(JSON.parse(JSON.stringify(position({ left: 100, right: 300, top: 200, bottom: 240 }, { width: 360, height: 300 }, { width: 1280, height: 800 }))), { left: 316, top: 200 });
  assert.deepEqual(JSON.parse(JSON.stringify(position({ left: 900, right: 1200, top: 700, bottom: 750 }, { width: 360, height: 300 }, { width: 1280, height: 800 }))), { left: 524, top: 488 });
  assert.deepEqual(JSON.parse(JSON.stringify(position({ left: 20, right: 300, top: 400, bottom: 480 }, { width: 296, height: 300 }, { width: 320, height: 568 }))), { left: 12, top: 256 });
  assert.equal(context.WaypointVariantPicker.handles(ordinary), false);
  assert.equal(context.WaypointVariantPicker.handles(variants), true);
  assert.equal(context.WaypointVariantPicker.show(variants, context.document.querySelector('#target')), true);
  assert.equal(context.document.querySelector('.waypoint-variant-picker').getAttribute('aria-label'), 'Variants');
  assert.deepEqual(
    [...context.document.querySelectorAll('.waypoint-variant-activate')].map(node => node.textContent.trim()),
    ['CalmActive', 'Bold'],
  );
  assert.equal(context.document.querySelector('[data-variant-key="calm"] .waypoint-variant-discard').disabled, true);
  assert.equal(context.document.querySelector('.waypoint-variant-cancel').textContent.trim(), 'Cancel set');

  context.WaypointAPI.activateVariant = async () => {
    throw new Error('Cleanup incomplete: scaffold switcher remains');
  };
  assert.equal(context.document.querySelector('.waypoint-variant-expanded').hidden, true);
  assert.equal(context.document.querySelector('.waypoint-variant-name').tagName, 'DIV');
  context.document.querySelector('.waypoint-variant-view-all').click();
  assert.equal(context.document.querySelector('.waypoint-variant-expanded').hidden, false);
  context.document.querySelector('[data-variant-key="bold"] .waypoint-variant-activate').click();
  await new Promise(resolve => setImmediate(resolve));

  const status = context.document.querySelector('.waypoint-variant-status');
  assert.equal(status.getAttribute('role'), 'alert');
  assert.match(status.textContent, /scaffold switcher remains/);
  assert.notEqual(context.document.querySelector('.waypoint-variant-picker'), null);

  context.document.querySelector('.waypoint-variant-back').click();
  const header = context.document.querySelector('.waypoint-variant-header');
  header.setPointerCapture = () => {};
  const down = new window.Event('pointerdown');
  Object.assign(down, { button: 0, pointerId: 1, clientX: 120, clientY: 220 });
  header.dispatchEvent(down);
  header.onpointermove({ clientX: 520, clientY: 420 });
  header.onpointerup();
  assert.equal(context.document.querySelector('.waypoint-variant-picker').style.left, '500px');
  let activatedKey;
  context.WaypointAPI.activateVariant = async (id, key) => {
    activatedKey = key;
    return { ...variants, variant_request: { ...variants.variant_request, active_variant_key: key,
      variants: variants.variant_request.variants.map(v => ({ ...v, state: v.key === key ? 'active' : 'inactive' })) } };
  };
  context.document.querySelector('.waypoint-variant-next').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(activatedKey, 'bold');
  assert.equal(context.document.querySelector('.waypoint-variant-picker').style.left, '500px', 'switching preserves dragged position');
  assert.equal(context.document.querySelector('.waypoint-variant-name').textContent, 'Bold');
  assert.equal(context.document.querySelector('.waypoint-variant-expanded').hidden, true);
  context.document.querySelector('.waypoint-variant-view-all').click();

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
  assert.throws(
    () => context.WaypointVariantPolicy.assertUpdateAllowed(finalized, { css: 'changed' }),
    /Variant-owned state/,
  );
  assert.throws(
    () => context.WaypointVariantPolicy.assertUpdateAllowed(variants, { status: 'resolved' }),
    /cannot become Resolved/,
  );
  assert.throws(
    () => context.WaypointVariantPolicy.assertUpdateAllowed(variants, {
      design_intent: { schema_version: 1, workflow: 'impeccable', action: 'layout' },
    }),
    /work contract/i,
  );
  assert.throws(
    () => context.WaypointVariantPolicy.assertUpdateAllowed(variants, { comment: 'Change the brief' }),
    /work contract/i,
  );
  assert.throws(
    () => context.WaypointVariantPolicy.assertSaveAllowed(null, variants),
    /Variant-owned state/,
  );
  assert.throws(
    () => context.WaypointVariantPolicy.assertSaveAllowed(variants, {
      id: variants.id,
      comment: variants.comment,
      status: 'resolved',
    }),
    /cannot become Resolved/,
  );
  assert.throws(
    () => context.WaypointVariantPolicy.assertDeleteAllowed(variants),
    /before deleting/,
  );
  const backgroundSource = await readFile(new URL('../.output/chrome-mv3/background/background.js', import.meta.url), 'utf8');
  assert.match(backgroundSource, /WaypointVariantPolicy\.assertUpdateAllowed/);
  assert.match(backgroundSource, /WaypointVariantPolicy\.assertDeleteAllowed/);
  assert.equal(backgroundSource.match(/WaypointVariantPolicy\.assertSaveAllowed/g).length >= 2, true);
  assert.match(
    backgroundSource,
    /agent-setup-config\.js[\s\S]*background\/variant-policy\.js[\s\S]*content\/modules\/api-bridge\.js[\s\S]*content\/modules\/variant-picker\.js[\s\S]*content\/modules\/annotation-popover\.js/,
  );
  const escape = new window.Event('keydown', { bubbles: true });
  Object.defineProperty(escape, 'key', { value: 'Escape' });
  context.document.dispatchEvent(escape);
  assert.equal(context.document.querySelector('.waypoint-variant-expanded').hidden, true, 'Escape returns to wheel');
  context.document.dispatchEvent(escape);
  assert.equal(context.document.querySelector('.waypoint-variant-picker'), null, 'Escape outside the panel closes it');
  context.WaypointVariantPicker.show(variants, context.document.querySelector('#target'));
  let cancelledId;
  context.WaypointAPI.cancelVariantRequest = async id => {
    cancelledId = id;
    return { id, comment: variants.comment, status: 'pending' };
  };
  context.document.querySelector('.waypoint-variant-cancel').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(cancelledId, variants.id);
  assert.equal(emitted.at(-1).name, 'annotation:variant-updated');
  assert.equal('variant_request' in emitted.at(-1).payload.annotation, false);
  assert.equal(context.document.querySelector('.waypoint-variant-picker'), null);
});
