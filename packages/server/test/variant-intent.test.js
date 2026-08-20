import assert from 'node:assert/strict';
import test from 'node:test';

import { requestedVariantCount } from '../lib/variant-intent.js';

const intent = { requested: true, default_count: 3 };

test('Variant Intent defaults to three and accepts bounded natural-language count overrides', () => {
  assert.equal(requestedVariantCount({ variant_intent: intent, comment: 'Explore a few directions' }), 3);
  assert.equal(requestedVariantCount({ variant_intent: intent, comment: 'Please create 2 variants' }), 2);
  assert.equal(requestedVariantCount({ variant_intent: intent, comment: 'Show me five named candidates' }), 5);
  assert.equal(requestedVariantCount({ variant_intent: intent, comment: 'Variants: 6, each with a distinct rhythm' }), 6);
});

test('Variant Intent asks for clarification instead of truncating unsupported or ambiguous counts', () => {
  for (const comment of [
    'Create 7 variants',
    'Create one candidate',
    'Show 2 variants on desktop and 4 variants on mobile',
  ]) {
    assert.throws(
      () => requestedVariantCount({ variant_intent: intent, comment }),
      /clarification.*between 2 and 6/i,
    );
  }
});

test('Variant count parsing ignores unrelated numbers in the existing comment', () => {
  assert.equal(requestedVariantCount({
    variant_intent: intent,
    comment: 'At 390px, explore named directions for the hero',
  }), 3);
});
