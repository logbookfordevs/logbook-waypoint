import assert from 'node:assert/strict';
import test from 'node:test';

import {
  VariantContractError,
  activateVariant,
  addVariant,
  assertAnnotationResolvable,
  assertGenericAnnotationUpdateAllowed,
  assertSyncedAnnotationAllowed,
  createVariantRequest,
  discardVariant,
  finalizeVariant,
} from '../lib/variants.js';

const annotation = () => ({
  id: 'waypoint_1750000000000_abc123xyz',
  comment: 'Show me two approaches',
  status: 'pending',
});

const candidates = [
  { key: 'compact', name: 'Compact', implementation: { css: '.card { gap: 8px; }' }, scaffold: ['variant-shell'] },
  { key: 'spacious', name: 'Spacious', implementation: { css: '.card { gap: 24px; }' }, scaffold: ['variant-shell'] },
];

test('request creates named stable candidates with exactly one Active Variant', () => {
  const requested = createVariantRequest(annotation(), candidates);

  assert.equal(requested.variant_request.status, 'unresolved');
  assert.equal(requested.variant_request.active_variant_key, 'compact');
  assert.deepEqual(requested.variant_request.variants.map(({ key, name, state }) => ({ key, name, state })), [
    { key: 'compact', name: 'Compact', state: 'active' },
    { key: 'spacious', name: 'Spacious', state: 'inactive' },
  ]);
  assert.throws(
    () => createVariantRequest(annotation(), [candidates[0], { ...candidates[1], name: 'Compact' }]),
    /unique/i,
  );
  assert.throws(
    () => createVariantRequest(annotation(), [candidates[0], { ...candidates[1], name: 'compact' }]),
    /unique/i,
  );
});

test('activation changes the presented implementation without a lifecycle transition and survives reopen', () => {
  const requested = createVariantRequest(annotation(), candidates);
  const activated = activateVariant(requested, 'spacious');
  const reopened = structuredClone(activated);

  assert.equal(activated.status, 'pending');
  assert.equal(reopened.variant_request.active_variant_key, 'spacious');
  assert.equal(reopened.variant_request.variants.filter(variant => variant.state === 'active').length, 1);
});

test('create adds a uniquely named stable candidate without changing the Active Variant', () => {
  const requested = createVariantRequest(annotation(), [candidates[0]]);
  const created = addVariant(requested, candidates[1]);

  assert.deepEqual(created.variant_request.variants.map(variant => variant.key), ['compact', 'spacious']);
  assert.equal(created.variant_request.active_variant_key, 'compact');
  assert.equal(created.variant_request.variants.filter(variant => variant.state === 'active').length, 1);
});

test('discard removes a candidate and its exclusive Scaffold but protects the Active Variant', () => {
  const requested = createVariantRequest(annotation(), [
    { ...candidates[0], scaffold: ['compact-only'] },
    { ...candidates[1], scaffold: ['shared', 'spacious-only'] },
  ]);

  assert.throws(() => discardVariant(requested, 'compact'), /activate another/i);
  const discarded = discardVariant(requested, 'spacious');

  assert.deepEqual(discarded.variant_request.variants.map(variant => variant.key), ['compact']);
  assert.deepEqual(discarded.variant_request.scaffold, ['compact-only']);
});

test('finalization preserves one implementation and removes all Scaffold', () => {
  const requested = activateVariant(createVariantRequest(annotation(), candidates), 'spacious');
  const finalized = finalizeVariant(requested, 'spacious');

  assert.equal(finalized.variant_request.status, 'finalized');
  assert.deepEqual(finalized.variant_request.variants.map(variant => variant.key), ['spacious']);
  assert.deepEqual(finalized.variant_request.scaffold, []);
  assert.deepEqual(finalized.variant_request.variants[0].scaffold, []);
});

test('cleanup failure leaves the input unresolved and reports remaining cleanup', () => {
  const requested = createVariantRequest(annotation(), candidates);
  requested.variant_request.scaffold = [];
  const beforeAttempt = structuredClone(requested);

  assert.throws(
    () => finalizeVariant(requested, 'compact'),
    error => {
      assert.equal(error instanceof VariantContractError, true);
      assert.deepEqual(error.remaining_cleanup, [{ kind: 'scaffold_missing', key: 'variant-shell' }]);
      return true;
    },
  );
  assert.deepEqual(requested, beforeAttempt);
});

test('operations reject an Active key and state mismatch before changing the request', () => {
  const requested = createVariantRequest(annotation(), candidates);
  requested.variant_request.active_variant_key = 'spacious';

  assert.throws(
    () => discardVariant(requested, 'spacious'),
    error => {
      assert.equal(error instanceof VariantContractError, true);
      assert.deepEqual(error.remaining_cleanup, [{ kind: 'active_variant', key: 'spacious' }]);
      return true;
    },
  );
  assert.equal(requested.variant_request.variants.length, 2);
});

test('resolution is gated until finalization leaves no Scaffold', () => {
  const requested = createVariantRequest(annotation(), candidates);
  assert.throws(() => assertAnnotationResolvable(requested), /finalized/i);

  const finalized = finalizeVariant(requested, 'compact');
  assert.doesNotThrow(() => assertAnnotationResolvable(finalized));
  assert.throws(
    () => assertGenericAnnotationUpdateAllowed(finalized, { css: '.card { gap: 40px; }' }),
    /Variant presentation/i,
  );
});

test('sync cannot introduce Variant-owned state onto an existing ordinary Annotation', () => {
  const current = annotation();
  const incoming = createVariantRequest(current, candidates);

  assert.throws(
    () => assertSyncedAnnotationAllowed(current, incoming),
    /Variant state/,
  );
});
