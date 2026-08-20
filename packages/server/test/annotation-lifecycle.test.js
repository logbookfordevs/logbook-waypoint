import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AnnotationLifecycle,
  LifecycleError,
} from '../lib/annotation-lifecycle.js';

const ID = 'waypoint_1750000000000_abc123xyz';
const base = () => ({ id: ID, url: 'http://localhost:3000', comment: 'Fix this', status: 'pending' });

test('Annotation lifecycle claims, refreshes, releases, and expires through one interface', () => {
  let now = Date.parse('2026-08-11T12:00:00.000Z');
  const lifecycle = new AnnotationLifecycle({ now: () => now, claimTtlMs: 60_000 });

  const claimed = lifecycle.apply(base(), { operation: 'claim', owner: 'agent-one' });
  assert.equal(claimed.status, 'claimed');
  assert.deepEqual(claimed.claim, {
    owner: 'agent-one',
    refreshed_at: '2026-08-11T12:00:00.000Z',
    expires_at: '2026-08-11T12:01:00.000Z',
  });

  assert.throws(
    () => lifecycle.apply(claimed, { operation: 'claim', owner: 'agent-two' }),
    error => error instanceof LifecycleError && error.code === 'claim_conflict',
  );

  now += 30_000;
  const refreshed = lifecycle.apply(claimed, { operation: 'claim', owner: 'agent-one' });
  assert.equal(refreshed.claim.expires_at, '2026-08-11T12:01:30.000Z');

  const released = lifecycle.apply(refreshed, { operation: 'release', owner: 'agent-one' });
  assert.equal(released.status, 'pending');
  assert.equal('claim' in released, false);

  now += 60_001;
  const reclaimed = lifecycle.apply(claimed, { operation: 'claim', owner: 'agent-two' });
  assert.equal(reclaimed.status, 'claimed');
  assert.equal(reclaimed.claim.owner, 'agent-two');
});

test('release returns recoverable work to Pending with the latest validated Work Notice', () => {
  const lifecycle = new AnnotationLifecycle({ now: () => Date.parse('2026-08-19T12:00:00.000Z') });
  const claimed = lifecycle.apply(base(), { operation: 'claim', owner: 'agent-one' });
  const released = lifecycle.apply(claimed, {
    operation: 'release',
    owner: 'agent-one',
    reason: {
      code: 'workflow_unavailable',
      summary: 'Install and configure Impeccable, then claim this Annotation again.',
    },
  });

  assert.deepEqual(released.work_notice, {
    code: 'workflow_unavailable',
    summary: 'Install and configure Impeccable, then claim this Annotation again.',
    created_at: '2026-08-19T12:00:00.000Z',
  });
  assert.equal(released.status, 'pending');
  assert.equal('claim' in released, false);
});

test('release rejects unsafe or unknown Work Notice reasons', () => {
  const lifecycle = new AnnotationLifecycle({ now: () => Date.parse('2026-08-19T12:00:00.000Z') });
  const claimed = lifecycle.apply(base(), { operation: 'claim', owner: 'agent-one' });

  for (const reason of [
    { code: 'blocked', summary: 'Install Impeccable.' },
    { code: 'execution_failed', summary: 'Stack trace:\nsecret-token' },
    { code: 'execution_failed', summary: 'x'.repeat(501) },
  ]) {
    assert.throws(
      () => lifecycle.apply(claimed, { operation: 'release', owner: 'agent-one', reason }),
      error => error instanceof LifecycleError && error.code === 'invalid_work_notice',
    );
  }
});

test('claim clears the active Work Notice at the capable-work boundary', () => {
  const lifecycle = new AnnotationLifecycle({ now: () => Date.parse('2026-08-19T12:00:00.000Z') });
  const pending = {
    ...base(),
    work_notice: {
      code: 'execution_failed',
      summary: 'The design workflow stopped before producing a result. Claim to retry.',
      created_at: '2026-08-19T11:55:00.000Z',
    },
  };

  const claimed = lifecycle.apply(pending, { operation: 'claim', owner: 'agent-two' });

  assert.equal(claimed.status, 'claimed');
  assert.equal('work_notice' in claimed, false);
});

test('dismissing a Work Notice keeps the Annotation Pending', () => {
  const lifecycle = new AnnotationLifecycle({ now: () => Date.parse('2026-08-19T12:00:00.000Z') });
  const pending = {
    ...base(),
    work_notice: {
      code: 'execution_failed',
      summary: 'The design workflow stopped before producing a result. Claim to retry.',
      created_at: '2026-08-19T11:55:00.000Z',
    },
  };

  const dismissed = lifecycle.apply(pending, { operation: 'dismiss_notice' });

  assert.equal(dismissed.status, 'pending');
  assert.equal('work_notice' in dismissed, false);
  assert.equal(dismissed.updated_at, '2026-08-19T12:00:00.000Z');
});

test('Annotation lifecycle retains resolution and discard while terminal states reject transitions', () => {
  const lifecycle = new AnnotationLifecycle({ now: () => Date.parse('2026-08-11T12:00:00.000Z') });
  const claimed = lifecycle.apply(base(), { operation: 'claim', owner: 'agent-one' });
  const resolved = lifecycle.apply(claimed, { operation: 'resolve', owner: 'agent-one' });
  const discarded = lifecycle.apply(base(), { operation: 'discard' });

  assert.equal(resolved.status, 'resolved');
  assert.equal(discarded.status, 'discarded');
  assert.equal('claim' in resolved, false);
  assert.equal('claim' in discarded, false);
  assert.throws(() => lifecycle.apply(base(), { operation: 'resolve', owner: 'agent-one' }), /must be claimed/i);
  assert.throws(() => lifecycle.apply(resolved, { operation: 'discard' }), /terminal/i);
  assert.throws(() => lifecycle.apply(discarded, { operation: 'claim', owner: 'agent-one' }), /terminal/i);
});

test('Annotation lifecycle requires bounded owner identity and preserves read purity', () => {
  const lifecycle = new AnnotationLifecycle({ now: () => 0 });
  const annotation = base();

  assert.throws(() => lifecycle.apply(annotation, { operation: 'claim', owner: '' }), /owner/i);
  assert.throws(() => lifecycle.apply(annotation, { operation: 'claim', owner: 'x'.repeat(201) }), /owner/i);
  assert.deepEqual(annotation, base());
});
