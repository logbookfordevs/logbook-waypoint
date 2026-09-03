import assert from 'node:assert/strict';
import test from 'node:test';

import {
  VariantContractError,
  activateVariant,
  assertAnnotationResolvable,
  assertGenericAnnotationUpdateAllowed,
  assertSyncedAnnotationAllowed,
  cancelVariantRequest,
  createVariantRequest,
  discardVariant,
  finalizeVariant,
} from '../lib/variants.js';

const annotation = () => ({
  id: 'waypoint_1750000000000_abc123xyz',
  comment: 'Show me two variants',
  status: 'pending',
  variant_intent: { requested: true, default_count: 3 },
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

test('an unresolved Variant Set never grows beyond six complete candidates', () => {
  assert.throws(
    () => createVariantRequest({ ...annotation(), comment: 'Create six variants' }, [
      ...candidates,
      { key: 'balanced', name: 'Balanced', implementation: {} },
      { key: 'focused', name: 'Focused', implementation: {} },
      { key: 'playful', name: 'Playful', implementation: {} },
      { key: 'quiet', name: 'Quiet', implementation: {} },
      { key: 'seventh', name: 'Seventh', implementation: {} },
    ]),
    /at most 6/i,
  );
});

test('discard removes a candidate and its exclusive Scaffold but protects the Active Variant', () => {
  const requested = createVariantRequest(annotation(), [
    { ...candidates[0], scaffold: ['compact-only'] },
    { ...candidates[1], scaffold: ['shared', 'spacious-only'] },
  ]);

  assert.throws(() => discardVariant(requested, 'compact'), /activate another/i);
  assert.throws(() => discardVariant(requested, 'spacious'), /at least 2/i);
});

test('finalization preserves one implementation and removes all Scaffold', () => {
  const requested = activateVariant(createVariantRequest(annotation(), candidates), 'spacious');
  const finalized = finalizeVariant(requested, 'spacious');

  assert.equal(finalized.variant_request.status, 'finalized');
  assert.deepEqual(finalized.variant_request.variants.map(variant => variant.key), ['spacious']);
  assert.deepEqual(finalized.variant_request.scaffold, []);
  assert.deepEqual(finalized.variant_request.variants[0].scaffold, []);
});

test('cancellation restores a recoverable Pending Annotation without candidate state', () => {
  const original = {
    ...annotation(),
    pending_changes: { color: { original: 'black', value: 'green' } },
    css: '.card { color: green; }',
  };
  const requested = activateVariant(createVariantRequest(original, candidates), 'spacious');
  const cancelled = cancelVariantRequest(requested);

  assert.equal(cancelled.status, 'pending');
  assert.equal('variant_request' in cancelled, false);
  assert.equal('variant_presentation' in cancelled, false);
  assert.deepEqual(cancelled.pending_changes, original.pending_changes);
  assert.equal(cancelled.css, original.css);
  assert.equal(requested.variant_request.status, 'unresolved');
});

test('unresolved evaluation locks Design Intent across generic and synchronized updates', () => {
  const requested = createVariantRequest({
    ...annotation(),
    design_intent: { schema_version: 1, workflow: 'impeccable', action: 'polish' },
  }, candidates);
  const changedIntent = { schema_version: 1, workflow: 'impeccable', action: 'layout' };

  assert.throws(
    () => assertGenericAnnotationUpdateAllowed(requested, { design_intent: changedIntent }),
    /unresolved Variant/i,
  );
  assert.throws(
    () => assertSyncedAnnotationAllowed(requested, { ...requested, design_intent: changedIntent }),
    /unresolved Variant/i,
  );
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

test('generic updates and sync cannot edit saved Target Set membership or order', () => {
  const current = {
    ...annotation(),
    targets: [{ selector: '#first' }, { selector: '#second' }],
  };
  const reversedTargets = [...current.targets].reverse();

  assert.throws(
    () => assertGenericAnnotationUpdateAllowed(current, { targets: reversedTargets }),
    /membership is immutable/,
  );
  assert.throws(
    () => assertSyncedAnnotationAllowed(current, { ...current, targets: reversedTargets }),
    /Target Set membership/,
  );
  assert.doesNotThrow(
    () => assertSyncedAnnotationAllowed(current, structuredClone(current)),
  );

  const singleTarget = { ...annotation(), targets: [{ selector: '#first' }] };
  assert.throws(
    () => assertGenericAnnotationUpdateAllowed(singleTarget, { targets: current.targets }),
    /membership is immutable/,
  );
  assert.throws(
    () => assertSyncedAnnotationAllowed(singleTarget, { ...singleTarget, targets: current.targets }),
    /Target Set membership/,
  );
});
