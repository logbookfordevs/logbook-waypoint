import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ANNOTATION_ID_PREFIX,
  createAnnotationId,
  isValidAnnotationId,
} from '@logbookfordevs/waypoint/annotation-id';

test('public Annotation ID interface creates canonical Waypoint identifiers', () => {
  const id = createAnnotationId();

  assert.equal(ANNOTATION_ID_PREFIX, 'waypoint_');
  assert.match(id, /^waypoint_[0-9]{10,16}_[a-z0-9]{6,32}$/);
});

test('public Annotation ID interface accepts only canonical Waypoint identifiers', () => {
  assert.equal(isValidAnnotationId('waypoint_1750000000000_abc123xyz'), true);
  assert.equal(isValidAnnotationId('vibe_1750000000000_abc123xyz'), false);
  assert.equal(isValidAnnotationId('waypoint_1750000000000_invalid-characters'), false);
  assert.equal(isValidAnnotationId('../../outside'), false);
});
