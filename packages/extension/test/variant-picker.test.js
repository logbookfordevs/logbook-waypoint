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

  assert.equal(context.WaypointVariantPicker.handles(ordinary), false);
  assert.equal(context.WaypointVariantPicker.handles(variants), true);
  assert.equal(context.WaypointVariantPicker.show(variants, context.document.querySelector('#target')), true);
  assert.equal(context.document.querySelector('.waypoint-variant-picker').getAttribute('aria-label'), 'Variants');
  assert.deepEqual(
    [...context.document.querySelectorAll('.waypoint-variant-activate')].map(node => node.textContent.trim()),
    ['Calm · Active', 'Bold'],
  );
  assert.equal(context.document.querySelector('[data-variant-key="calm"] .waypoint-variant-discard').disabled, true);
  assert.equal(context.document.querySelector('.waypoint-variant-cancel').textContent.trim(), 'Cancel Variant Set');

  context.WaypointAPI.activateVariant = async () => {
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
  const popupSource = await readFile(new URL('../.output/chrome-mv3/popup/popup.js', import.meta.url), 'utf8');
  assert.match(popupSource, /sendMessage\(\{\s*action: 'updateAnnotation',[\s\S]*updates: \{ comment: newComment/);
  assert.doesNotMatch(popupSource, /allAnnotations\[index\] = updatedAnnotation/);
  assert.match(popupSource, /sendMessage\(\{ action: 'deleteAnnotation', id \}\)/);
  assert.doesNotMatch(popupSource, /filteredAnnotations[\s\S]*storage\.local\.set\(\{ annotations: filteredAnnotations \}\)/);
});
