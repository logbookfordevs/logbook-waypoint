import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { AttachmentStore } from '../lib/attachment-store.js';

const annotationId = 'waypoint_1750000000000_abc123xyz';

test('AttachmentStore atomically stores allowed images and withholds content unless requested', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'waypoint-attachments-'));
  const store = new AttachmentStore({ rootDir, maxBytes: 16 });

  try {
    const saved = await store.save({
      annotationId,
      kind: 'screenshot',
      mimeType: 'image/png',
      content: Buffer.from('image-data'),
    });
    const metadata = await store.get({ annotationId, attachmentId: saved.id });
    const withContent = await store.get({ annotationId, attachmentId: saved.id, includeContent: true });

    assert.match(saved.filename, /^[a-f0-9-]+\.png$/);
    assert.equal(metadata.content, undefined);
    assert.equal(withContent.content, Buffer.from('image-data').toString('base64'));
    assert.equal(metadata.mime_type, 'image/png');
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('AttachmentStore rejects invalid IDs, traversal attempts, unsupported media, and over-limit content', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'waypoint-attachments-'));
  const store = new AttachmentStore({ rootDir, maxBytes: 3 });

  try {
    await assert.rejects(
      store.save({ annotationId: '../../outside', mimeType: 'image/png', content: Buffer.from('ok') }),
      /annotation id/i,
    );
    await assert.rejects(
      store.save({ annotationId, mimeType: 'image/svg+xml', content: Buffer.from('ok') }),
      /mime/i,
    );
    await assert.rejects(
      store.save({ annotationId, mimeType: 'image/png', content: Buffer.from('four') }),
      /size/i,
    );
    await assert.rejects(store.get({ annotationId, attachmentId: '../secret' }), /attachment id/i);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test('AttachmentStore resolves content paths and confines derived files to the Annotation directory', async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'waypoint-attachments-'));
  const store = new AttachmentStore({ rootDir, maxBytes: 16 });

  try {
    const saved = await store.save({ annotationId, kind: 'screenshot', mimeType: 'image/png', content: Buffer.from('stored') });
    const resolved = await store.contentPath({ annotationId, attachmentId: saved.id });
    const derived = await store.writeDerived({ annotationId, stem: 'screenshot-target-0', mimeType: 'image/png', content: 'ZGVyaXZlZA==' });

    assert.equal(resolved.path, path.join(rootDir, annotationId, saved.filename));
    assert.equal(await readFile(resolved.path, 'utf8'), 'stored');
    assert.equal(derived.path, path.join(rootDir, annotationId, 'screenshot-target-0.png'));
    assert.equal(await readFile(derived.path, 'utf8'), 'derived');
    assert.equal(await store.contentPath({ annotationId, attachmentId: '00000000-0000-4000-8000-000000000000' }), null);
    await assert.rejects(
      store.writeDerived({ annotationId, stem: '../escape', mimeType: 'image/png', content: 'AA==' }),
      /derived file name/i,
    );

    await store.cleanup(annotationId);
    await assert.rejects(readFile(derived.path), { code: 'ENOENT' });
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
