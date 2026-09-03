import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const codecUrl = new URL('../public/export-codec.js', import.meta.url);
const statusUrl = new URL('../public/annotation-status.js', import.meta.url);
const targetsUrl = new URL('../public/annotation-targets.js', import.meta.url);

async function loadCodec() {
  const [source, statusSource, targetsSource] = await Promise.all([readFile(codecUrl, 'utf8'), readFile(statusUrl, 'utf8'), readFile(targetsUrl, 'utf8')]);
  const context = vm.createContext({
    URL,
    window: { location: new URL('http://localhost:3000/current?view=queue#open') },
  });
  context.globalThis = context;
  vm.runInContext(statusSource, context, { filename: 'annotation-status.js' });
  vm.runInContext(targetsSource, context, { filename: 'annotation-targets.js' });
  vm.runInContext(source, context, { filename: 'export-codec.js' });
  return context.WaypointExportCodec;
}

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

test('codec creates the portable v1.0 envelope with status-filtered full route groups', async () => {
  const codec = await loadCodec();
  const payload = codec.createExportEnvelope(annotations, {
    status: 'pending',
    exportedAt: '2026-08-11T00:00:00.000Z',
  });

  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    waypoint_annotations_export: true,
    version: '1.0',
    exported_at: '2026-08-11T00:00:00.000Z',
    source: { origin: 'http://localhost:3000', hostname: 'localhost', port: '3000' },
    scope: 'project',
    status_filter: 'pending',
    annotation_count: 1,
    annotations: [{
      id: 'waypoint_1750000000000_abc123xyz',
      url: 'http://localhost:3000/app?tab=open#feedback',
      status: 'pending',
      comment: 'Align the heading',
      targets: [{ has_screenshot: false }],
      url_path: '/app?tab=open#feedback',
      has_screenshot: false,
      has_attachments: false,
    }],
    routes: [{
      origin: 'http://localhost:3000',
      route: '/app?tab=open#feedback',
      url: 'http://localhost:3000/app?tab=open#feedback',
      annotations: [{
        id: 'waypoint_1750000000000_abc123xyz',
        url: 'http://localhost:3000/app?tab=open#feedback',
        status: 'pending',
        comment: 'Align the heading',
        targets: [{ has_screenshot: false }],
        url_path: '/app?tab=open#feedback',
        has_screenshot: false,
        has_attachments: false,
      }],
    }],
  });
});

test('codec rejects non-canonical lifecycle status filters', async () => {
  const codec = await loadCodec();
  assert.throws(
    () => codec.createExportEnvelope([], { status: 'completed' }),
    /invalid export status/i,
  );
});

test('codec strips media data and filesystem hints while retaining safe media presence', async () => {
  const codec = await loadCodec();
  const payload = codec.createExportEnvelope([{
    ...annotations[0],
    screenshot: { data_url: 'data:image/png;base64,secret' },
    attachments: [{ id: 'attachment_123', data_url: 'data:image/png;base64,secret' }],
    source_file_path: '/Users/leo/project/src/Button.tsx',
    source_mapping: { file_path_hint: '/Users/leo/project/src/Button.tsx' },
    nested: { source_path: '/Users/leo/project/src/Card.tsx', title: 'Safe' },
  }]);
  const annotation = payload.annotations[0];

  assert.equal(annotation.has_screenshot, true);
  assert.equal(annotation.has_attachments, true);
  assert.deepEqual(JSON.parse(JSON.stringify(annotation.nested)), { title: 'Safe' });
  assert.equal('screenshot' in annotation, false);
  assert.equal('attachments' in annotation, false);
  assert.equal('source_file_path' in annotation, false);
  assert.equal('source_mapping' in annotation, false);
  assert.doesNotMatch(JSON.stringify(payload), /data:image|\/Users\/leo/);
});

test('codec normalizes server route-only envelopes for the existing toolbar import seam', async () => {
  const codec = await loadCodec();
  const exported = codec.createExportEnvelope([annotations[0]]);
  const normalized = codec.normalizeImportEnvelope({
    waypoint_annotations_export: true,
    version: '1.0',
    routes: exported.routes,
  });

  assert.deepEqual(
    JSON.parse(JSON.stringify(normalized.annotations)),
    JSON.parse(JSON.stringify(exported.annotations)),
  );
});

test('media-only portable exports remain meaningful after safe round-trip', async () => {
  const codec = await loadCodec();
  const payload = codec.createExportEnvelope([{
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app?tab=open#media',
    comment: '',
    status: 'pending',
    attachments: [{ id: 'attachment_123', data_url: 'data:image/png;base64,secret' }],
  }]);

  assert.equal(payload.annotations[0].has_attachments, true);
  assert.equal('attachments' in payload.annotations[0], false);
  assert.equal(payload.annotations[0].url_path, '/app?tab=open#media');
});
