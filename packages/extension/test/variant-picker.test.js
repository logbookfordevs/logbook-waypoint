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
  const requestWith = (activeKey, list) => ({
    status: 'unresolved',
    active_variant_key: activeKey,
    variants: list.map(variant => ({ ...variant, state: variant.key === activeKey ? 'active' : 'inactive' })),
  });
  const pair = [
    { key: 'calm', name: 'Calm', summary: 'Quiet borders for a daily-use page.' },
    { key: 'bold', name: 'Bold' },
  ];
  const variants = { id: 'waypoint_2_abcdefghi', comment: 'Compare these', variant_request: requestWith('calm', pair) };
  const dock = () => context.document.querySelector('.waypoint-variant-dock');
  const text = selector => context.document.querySelector(selector)?.textContent.trim();
  const settle = () => new Promise(resolve => setImmediate(resolve));
  const press = (key, target) => {
    const event = new window.Event('keydown', { bubbles: true });
    Object.defineProperty(event, 'key', { value: key });
    target.dispatchEvent(event);
  };

  const placement = context.WaypointVariantPicker.getPlacement;
  const viewport = { width: 1280, height: 800 };
  const dockSize = { width: 320, height: 40 };
  assert.equal(placement({ left: 100, right: 300, top: 200, bottom: 240 }, dockSize, viewport), 'bottom');
  assert.equal(placement({ left: 500, right: 800, top: 600, bottom: 780 }, dockSize, viewport), 'top', 'a Target under the Dock moves it to the top');
  assert.equal(placement({ left: 0, right: 1280, top: 0, bottom: 800 }, dockSize, viewport), 'bottom', 'a full-page Target keeps the default edge');
  assert.equal(placement(null, dockSize, viewport), 'bottom');

  assert.equal(context.WaypointVariantPicker.handles(ordinary), false);
  assert.equal(context.WaypointVariantPicker.handles(variants), true);
  assert.equal(context.WaypointVariantPicker.show(variants, context.document.querySelector('#target')), true);
  assert.equal(dock().getAttribute('aria-label'), 'Variants');
  assert.deepEqual([...context.document.querySelectorAll('.waypoint-variant-tab')].map(node => node.textContent.trim()), ['Calm', 'Bold']);
  assert.equal(context.document.querySelector('[data-variant-key="calm"]').getAttribute('aria-pressed'), 'true');
  assert.equal(text('.waypoint-variant-keep'), 'Keep Calm');
  assert.equal(text('.waypoint-variant-summary'), 'Quiet borders for a daily-use page.');
  assert.equal(context.document.querySelectorAll('.waypoint-variant-discard').length, 0, 'a pair cannot shrink further');
  assert.equal(text('.waypoint-variant-cancel'), 'Cancel set');

  context.WaypointAPI.activateVariant = async () => {
    throw new Error('Cleanup incomplete: scaffold switcher remains');
  };
  context.document.querySelector('[data-variant-key="bold"]').click();
  await settle();
  const status = context.document.querySelector('.waypoint-variant-status');
  assert.equal(status.getAttribute('role'), 'alert');
  assert.equal(status.hidden, false);
  assert.match(status.textContent, /scaffold switcher remains/);
  assert.notEqual(dock(), null);

  let activatedKey;
  context.WaypointAPI.activateVariant = async (id, key) => {
    activatedKey = key;
    return { ...variants, variant_request: requestWith(key, pair) };
  };
  press('2', context.document.querySelector('[data-variant-key="calm"]'));
  await settle();
  assert.equal(activatedKey, 'bold');
  assert.equal(context.document.querySelector('[data-variant-key="bold"]').getAttribute('aria-pressed'), 'true');
  assert.equal(text('.waypoint-variant-keep'), 'Keep Bold');
  assert.equal(context.document.querySelector('.waypoint-variant-summary').hidden, true, 'a Variant without a summary hides the caption');
  activatedKey = undefined;
  press('ArrowRight', context.document.body);
  await settle();
  assert.equal(activatedKey, undefined, 'page arrow keys stay with the page');

  const trio = [...pair, { key: 'dense', name: 'Dense' }];
  const trioSet = { ...variants, variant_request: requestWith('calm', trio) };
  context.WaypointVariantPicker.show(trioSet, context.document.querySelector('#target'));
  context.document.querySelector('.waypoint-variant-more').click();
  assert.equal(context.document.querySelector('.waypoint-variant-menu').hidden, false);
  assert.deepEqual([...context.document.querySelectorAll('.waypoint-variant-discard')].map(node => node.textContent.trim()), ['Discard Bold', 'Discard Dense']);
  let discarded;
  context.WaypointAPI.discardVariant = async (id, key) => {
    discarded = key;
    return { ...trioSet, variant_request: requestWith('calm', trio.filter(variant => variant.key !== key)) };
  };
  context.document.querySelector('.waypoint-variant-discard[data-variant-key="dense"]').click();
  await settle();
  assert.equal(discarded, 'dense');
  assert.equal(context.document.querySelectorAll('.waypoint-variant-tab').length, 2);

  let finalizedKey;
  context.WaypointAPI.finalizeVariant = async (id, key) => {
    finalizedKey = key;
    return { ...variants, variant_request: { ...variants.variant_request, status: 'finalized' } };
  };
  context.document.querySelector('.waypoint-variant-keep').click();
  await settle();
  assert.equal(finalizedKey, 'calm');
  assert.equal(dock(), null, 'Keep closes the Dock');

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
    /export-codec\.js[\s\S]*background\/variant-policy\.js[\s\S]*content\/modules\/api-bridge\.js[\s\S]*content\/modules\/variant-picker\.js[\s\S]*content\/modules\/annotation-popover\.js/,
  );
  context.WaypointVariantPicker.show(variants, context.document.querySelector('#target'));
  context.document.querySelector('.waypoint-variant-more').click();
  press('Escape', context.document.body);
  assert.equal(context.document.querySelector('.waypoint-variant-menu').hidden, true, 'Escape closes the menu first');
  press('Escape', context.document.body);
  assert.equal(dock(), null, 'Escape then hides the Dock');
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
  assert.equal(dock(), null);

  assert.equal(context.WaypointVariantPicker.show(variants, null), true);
  assert.equal(dock().dataset.position, 'bottom', 'an unresolved Target keeps the default edge');
});
