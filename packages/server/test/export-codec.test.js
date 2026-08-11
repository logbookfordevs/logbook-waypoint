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
  assert.equal(payload.waypoint_annotations_export, true);
  assert.equal(payload.version, '1.0');
  assert.equal(payload.status_filter, 'pending');
  assert.equal(payload.annotation_count, 1);
  assert.equal(payload.annotations[0].status, 'pending');
  assert.equal(payload.annotations[0].url_path, '/app?tab=open#feedback');
  assert.deepEqual(payload.routes.map(route => route.route), ['/app?tab=open#feedback']);
  assert.equal(payload.routes[0].annotations[0].id, annotations[0].id);
});

test('portable JSON and Markdown never expose media bytes or source filesystem hints', () => {
  const result = encodeAnnotationsExport([{
    ...annotations[0],
    screenshot: { data_url: 'data:image/png;base64,secret' },
    attachments: [{ id: 'attachment_123', data_url: 'data:image/png;base64,secret' }],
    source_file_path: '/Users/leo/project/src/Button.tsx',
    source_mapping: { file_path_hint: '/Users/leo/project/src/Button.tsx' },
  }], { format: 'json' });
  const payload = JSON.parse(result.content);
  const annotation = payload.annotations[0];

  assert.equal(annotation.has_screenshot, true);
  assert.equal(annotation.has_attachments, true);
  assert.equal('screenshot' in annotation, false);
  assert.equal('attachments' in annotation, false);
  assert.equal('source_file_path' in annotation, false);
  assert.equal('source_mapping' in annotation, false);
  assert.doesNotMatch(result.content, /data:image|\/Users\/leo/);

  const markdown = encodeAnnotationsExport([{
    ...annotations[0],
    screenshot: { data_url: 'data:image/png;base64,secret' },
    source_file_path: '/Users/leo/project/src/Button.tsx',
  }], { format: 'markdown' });
  assert.doesNotMatch(markdown.content, /data:image|\/Users\/leo/);
});

test('Markdown exports retain route query and hash details', () => {
  const result = encodeAnnotationsExport(annotations, { format: 'markdown', status: 'all' });

  assert.match(result.content, /## `\/app\?tab=open#feedback`/);
  assert.match(result.content, /## `\/app\?tab=closed#feedback`/);
  assert.match(result.content, /\[pending\] Align the heading/);
});
