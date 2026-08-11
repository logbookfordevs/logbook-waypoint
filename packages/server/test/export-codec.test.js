import assert from 'node:assert/strict';
import test from 'node:test';

import { encodeAnnotationsExport } from '../lib/export-codec.js';

const annotations = [
  {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app?tab=open#feedback',
    status: 'pending',
    comment: 'Align the heading',
  },
  {
    id: 'waypoint_1750000000001_abcdefghi',
    url: 'http://localhost:3000/app?tab=closed#feedback',
    status: 'resolved',
    comment: 'Already done',
  },
];

test('JSON exports filter by status and group annotations by full route', () => {
  const result = encodeAnnotationsExport(annotations, {
    format: 'json',
    status: 'pending',
    exportedAt: '2026-08-11T00:00:00.000Z',
  });
  const payload = JSON.parse(result.content);

  assert.equal(result.count, 1);
  assert.equal(payload.annotation_count, 1);
  assert.deepEqual(payload.routes.map(route => route.route), ['/app?tab=open#feedback']);
  assert.equal(payload.routes[0].annotations[0].id, annotations[0].id);
});

test('Markdown exports retain route query and hash details', () => {
  const result = encodeAnnotationsExport(annotations, { format: 'markdown', status: 'all' });

  assert.match(result.content, /## `\/app\?tab=open#feedback`/);
  assert.match(result.content, /## `\/app\?tab=closed#feedback`/);
  assert.match(result.content, /\[pending\] Align the heading/);
});
