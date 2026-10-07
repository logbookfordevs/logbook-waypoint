import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAnnotationTargets,
  normalizeAnnotationTargets,
} from '../lib/annotation-targets.js';

const legacy = {
  id: 'waypoint_1750000000000_abc123xyz',
  url: 'http://localhost:3000/app',
  selector: '#save',
  viewport: { width: 1280, height: 720 },
  element_context: { tag: 'button', text: 'Save' },
  screenshot: { attachment_id: 'shot-a' },
  badge_offset: { x: 8, y: 12 },
};

test('legacy scalar Target normalizes into the canonical one-item targets array', () => {
  const annotation = normalizeAnnotationTargets(legacy);

  assert.equal(annotation.targets.length, 1);
  assert.deepEqual(annotation.targets[0], {
    selector: '#save',
    viewport: { width: 1280, height: 720 },
    element_context: { tag: 'button', text: 'Save' },
    screenshot: { attachment_id: 'shot-a' },
    badge_offset: { x: 8, y: 12 },
  });
  assert.equal('selector' in annotation, false);
  assert.equal('element_context' in annotation, false);
});

test('canonical Target Sets retain selection order and require one to eight unique Targets', () => {
  const targets = [
    { selector: '#first', element_context: { tag: 'button' } },
    { selector: '#second', element_context: { tag: 'input' } },
  ];
  assert.deepEqual(assertAnnotationTargets({ url: legacy.url, targets }), targets);

  assert.throws(
    () => assertAnnotationTargets({ url: legacy.url, targets: [] }),
    /between 1 and 8 Targets/,
  );
  assert.throws(
    () => assertAnnotationTargets({ url: legacy.url, targets: [...targets, targets[0]] }),
    /unique/,
  );
  assert.throws(
    () => assertAnnotationTargets({ url: legacy.url, targets: Array.from({ length: 9 }, (_, index) => ({ selector: `#target-${index}` })) }),
    /between 1 and 8 Targets/,
  );
});

test('multi-Target Annotations reject Element edits at the portable contract boundary', () => {
  const targets = [{ selector: '#first' }, { selector: '#second' }];

  assert.throws(
    () => assertAnnotationTargets({ targets, pending_changes: { color: { value: 'red' } } }),
    /cannot include Element edits/,
  );
  assert.throws(
    () => assertAnnotationTargets({ targets, css: '#first { color: red; }' }),
    /cannot include Element edits/,
  );
});
