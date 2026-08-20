import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

import { isValidAnnotationId } from '../lib/annotation-id.js';
import { assertValidAnnotation } from '../lib/annotation-validation.js';
import { encodeAnnotationsExport } from '../lib/export-codec.js';

async function loadExtensionContracts() {
  const context = vm.createContext({ URL, WaypointAnnotationId: { isValid: isValidAnnotationId } });
  context.globalThis = context;
  for (const file of ['annotation-status.js', 'design-intent.js', 'variant-intent.js', 'annotation-validation.js', 'export-codec.js']) {
    const source = await readFile(new URL(`../../extension/public/${file}`, import.meta.url), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

const mediaOnlyAnnotations = [
  {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app?tab=open#screenshot',
    url_path: '/stale-route',
    comment: '',
    status: 'pending',
    screenshot: { attachment_id: '5f73fe9a-4493-4a06-8af0-72e2aa597a75' },
  },
  {
    id: 'waypoint_1750000000001_abcdefghi',
    url: 'http://localhost:3000/app?tab=open#attachment',
    comment: '',
    status: 'pending',
    attachments: [{ id: '91b7e686-b63a-4089-852f-a3af616bc815' }],
  },
];

test('server and extension exports conform for route identity and portable media markers', async () => {
  const extension = await loadExtensionContracts();
  const serverPayload = JSON.parse(encodeAnnotationsExport(mediaOnlyAnnotations, {
    format: 'json',
    exportedAt: '2026-08-11T00:00:00.000Z',
  }).content);
  const extensionPayload = extension.WaypointExportCodec.createExportEnvelope(mediaOnlyAnnotations, {
    exportedAt: '2026-08-11T00:00:00.000Z',
  });

  assert.deepEqual(
    JSON.parse(JSON.stringify(extensionPayload.annotations)),
    serverPayload.annotations,
  );
  assert.equal(serverPayload.annotations[0].url_path, '/app?tab=open#screenshot');
});

test('portable media-only exports and whitespace references validate identically across runtimes', async () => {
  const extension = await loadExtensionContracts();
  const payload = JSON.parse(encodeAnnotationsExport(mediaOnlyAnnotations, { format: 'json' }).content);

  for (const annotation of payload.annotations) {
    assert.doesNotThrow(() => assertValidAnnotation(annotation));
    assert.doesNotThrow(() => extension.WaypointAnnotationValidation.assertAnnotation(annotation));
  }

  const whitespaceReference = {
    id: 'waypoint_1750000000002_abcdefghi',
    url: 'http://localhost:3000/app',
    comment: '',
    screenshot: { attachment_id: '   ' },
  };
  assert.throws(() => assertValidAnnotation(whitespaceReference), /meaningful content/);
  assert.throws(
    () => extension.WaypointAnnotationValidation.assertAnnotation(whitespaceReference),
    /must include/,
  );
});
