import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { once } from 'node:events';

import { LocalAnnotationsServer } from '../lib/server.js';

const id = 'waypoint_1750000000000_abc123xyz';

async function withServer(server, run) {
  const listener = server.app.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  try {
    await run(`http://127.0.0.1:${listener.address().port}`);
  } finally {
    listener.close();
    await once(listener, 'close');
  }
}

async function attachmentFiles(rootDir) {
  try {
    return await readdir(rootDir, { recursive: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

test('server accepts commentless visual Annotations and rejects empty records', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-commentless-'));
  const server = new LocalAnnotationsServer({
    annotationsFile: path.join(directory, 'annotations.json'),
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await withServer(server, async baseUrl => {
      const visual = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          url: 'http://localhost:3000/app?tab=open#feedback',
          comment: '',
          status: 'pending',
          pending_changes: { color: { original: '#000', value: '#201a16' } },
        }),
      });
      assert.equal(visual.status, 200);

      const empty = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: 'waypoint_1750000000001_abcdefghi',
          url: 'http://localhost:3000/app',
          comment: '',
          status: 'pending',
        }),
      });
      assert.equal(empty.status, 400);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('server rejects URL-less and contentless Annotations at create and sync HTTP seams', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-annotation-validation-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });
  const validAnnotation = {
    id,
    url: 'http://localhost:3000/app',
    comment: 'Keep this feedback',
    status: 'pending',
  };
  const invalidAnnotations = [
    { ...validAnnotation, id: 'waypoint_1750000000001_abcdefghi', url: undefined },
    { ...validAnnotation, id: 'waypoint_1750000000002_abcdefghi', url: '   ' },
    { ...validAnnotation, id: 'waypoint_1750000000003_abcdefghi', url: '/relative-page' },
    { ...validAnnotation, id: 'waypoint_1750000000004_abcdefghi', comment: '   ' },
    { ...validAnnotation, id: 'waypoint_1750000000005_abcdefghi', comment: '', pending_changes: {} },
    { ...validAnnotation, id: 'waypoint_1750000000006_abcdefghi', comment: '', css: '  ' },
    { ...validAnnotation, id: 'waypoint_1750000000007_abcdefghi', comment: '', screenshot: {} },
    { ...validAnnotation, id: 'waypoint_1750000000008_abcdefghi', comment: '', attachments: [] },
  ];

  try {
    await withServer(server, async baseUrl => {
      const baseline = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validAnnotation),
      });
      assert.equal(baseline.status, 200);

      for (const annotation of invalidAnnotations) {
        const create = await fetch(`${baseUrl}/api/annotations`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(annotation),
        });
        assert.equal(create.status, 400, `create should reject ${annotation.id}`);

        const sync = await fetch(`${baseUrl}/api/annotations/sync`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ annotations: [annotation] }),
        });
        assert.equal(sync.status, 400, `sync should reject ${annotation.id}`);
      }

      const persisted = JSON.parse(await readFile(annotationsFile, 'utf8'));
      assert.equal(persisted.length, 1);
      assert.equal(persisted[0].id, validAnnotation.id);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('server accepts non-comment Annotation content at create and sync HTTP seams', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-annotation-content-'));
  const server = new LocalAnnotationsServer({
    annotationsFile: path.join(directory, 'annotations.json'),
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await withServer(server, async baseUrl => {
      const create = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          url: 'http://localhost:3000/app',
          comment: '',
          css: '.feedback { outline: 2px solid currentColor; }',
          status: 'pending',
        }),
      });
      assert.equal(create.status, 200);

      const sync = await fetch(`${baseUrl}/api/annotations/sync`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          annotations: [{
            id: 'waypoint_1750000000001_abcdefghi',
            url: 'http://localhost:3000/app',
            comment: '',
            pending_changes: { color: { original: '#000', value: '#201a16' } },
            status: 'pending',
          }, {
            id: 'waypoint_1750000000002_abcdefghi',
            url: 'http://localhost:3000/app',
            comment: '',
            screenshot: { data_url: 'data:image/png;base64,c2NyZWVuc2hvdA==' },
            status: 'pending',
          }, {
            id: 'waypoint_1750000000003_abcdefghi',
            url: 'http://localhost:3000/app',
            comment: '',
            attachments: [{
              name: 'detail.png',
              mime_type: 'image/png',
              size_bytes: 6,
              data_url: 'data:image/png;base64,ZGV0YWls',
            }],
            status: 'pending',
          }],
        }),
      });
      assert.equal(sync.status, 200);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('server shares strict loopback project scope across read, context, deletion, and export', async () => {
  const server = new LocalAnnotationsServer();
  const annotations = [
    { id, url: 'http://localhost:3000/app?tab=open#feedback', comment: 'Align title', status: 'pending' },
    { id: 'waypoint_1750000000001_abcdefghi', url: 'http://localhost:3000/apple', comment: 'Do not include', status: 'pending' },
  ];
  server.loadAnnotations = async () => structuredClone(annotations);
  server._saveAnnotationsInternal = async () => {};

  const read = await server.readAnnotations({ url: 'http://localhost:3000/app/*' });
  const exported = await server.exportAnnotations({ format: 'json', status: 'pending', url: 'http://localhost:3000/app/*' });

  assert.deepEqual(read.annotations.map(annotation => annotation.id), [id]);
  assert.equal(JSON.parse(exported.content).routes[0].route, '/app?tab=open#feedback');
  await assert.rejects(server.readAnnotations({ url: 'https://example.com/*' }), /loopback/i);
  await assert.rejects(server.getProjectContext({ url: 'https://example.com/app' }), /loopback/i);
  await assert.rejects(server.deleteProjectAnnotations({ url_pattern: 'https://example.com/*' }), /loopback/i);
});

test('unfiltered reads require project selection before returning multi-project annotation bodies', async () => {
  const server = new LocalAnnotationsServer();
  const annotations = [
    { id, url: 'http://localhost:3000/', comment: 'Waypoint feedback', status: 'pending' },
    {
      id: 'waypoint_1750000000001_abcdefghi',
      url: 'http://127.0.0.1:3001/firm',
      comment: 'Firm feedback',
      status: 'pending',
    },
  ];
  server.loadAnnotations = async () => structuredClone(annotations);

  const discovery = await server.readAnnotations({ status: 'pending' });

  assert.deepEqual(discovery.annotations, []);
  assert.deepEqual(
    discovery.projectInfo.map(project => project.recommended_filter),
    ['http://localhost:3000/*', 'http://127.0.0.1:3001/*'],
  );
  assert.match(discovery.multiProjectWarning.recommendation, /url.*filter/i);

  const filtered = await server.readAnnotations({
    status: 'pending',
    url: 'http://localhost:3000/*',
  });

  assert.deepEqual(filtered.annotations.map(annotation => annotation.id), [id]);
  assert.equal(filtered.multiProjectWarning, null);
});

test('server file-backs screenshots and extension attachments while explicit retrieval controls bytes', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-capabilities-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const server = new LocalAnnotationsServer({
    annotationsFile,
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    const saved = await server.applyAnnotationsUpdate(async annotations => {
      const annotation = await server.normalizeAnnotationMedia({
        id,
        url: 'http://localhost:3000/app',
        comment: 'Check visual hierarchy',
        status: 'pending',
        screenshot: { data_url: 'data:image/png;base64,c2NyZWVuc2hvdA==', compression: 'png' },
        attachments: [{
          name: 'detail.png',
          mime_type: 'image/png',
          size_bytes: 6,
          data_url: 'data:image/png;base64,ZGV0YWls',
        }],
      });
      annotations.push(annotation);
      return annotation;
    });
    const persisted = JSON.parse(await readFile(annotationsFile, 'utf8'))[0];
    const attachmentId = saved.attachments[0].id;

    assert.equal('data_url' in persisted.screenshot, false);
    assert.equal('data_url' in persisted.attachments[0], false);
    assert.match(persisted.screenshot.attachment_id, /^[a-f0-9-]{36}$/);
    const metadata = await server.getAnnotationAttachment({ id, attachment_id: attachmentId });
    const content = await server.getAnnotationAttachment({ id, attachment_id: attachmentId, include_content: true });
    const screenshot = await server.getAnnotationScreenshot({ id });

    assert.equal(metadata.attachment.content, undefined);
    assert.equal(content.attachment.content, 'ZGV0YWls');
    assert.equal(screenshot.screenshot.data_url, 'data:image/png;base64,c2NyZWVuc2hvdA==');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('server refuses unsafe attachment references before persistence', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-capabilities-'));
  const server = new LocalAnnotationsServer({
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await assert.rejects(server.normalizeAnnotationMedia({
      id,
      attachments: [{
        id: '00000000-0000-4000-8000-000000000000',
        name: 'unsafe.svg',
        mime_type: 'image/svg+xml',
        size_bytes: 1,
      }],
    }), /mime/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('bulk deletion previews and confirms commentless visual Annotations', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-commentless-delete-'));
  const server = new LocalAnnotationsServer({
    annotationsFile: path.join(directory, 'annotations.json'),
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });

  try {
    await withServer(server, async baseUrl => {
      const created = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          url: 'http://localhost:3000/app',
          pending_changes: { color: { original: '#000', value: '#fff' } },
        }),
      });
      assert.equal(created.status, 200);
    });

    const preview = await server.deleteProjectAnnotations({ url_pattern: 'http://localhost:3000/*' });
    assert.equal(preview.count, 1);
    assert.equal(preview.preview['http://localhost:3000/app'][0].comment, '');

    const confirmed = await server.deleteProjectAnnotations({ url_pattern: 'http://localhost:3000/*', confirm: true });
    assert.equal(confirmed.count, 1);
    assert.equal(confirmed.deleted_annotations[0].comment, '');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('HTTP media writes roll back staged files and preserve superseded files until Queue persistence commits', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-media-rollback-'));
  const attachmentRoot = path.join(directory, 'attachments');
  const server = new LocalAnnotationsServer({
    annotationsFile: path.join(directory, 'annotations.json'),
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot,
  });
  const secondId = 'waypoint_1750000000001_abcdefghi';
  const thirdId = 'waypoint_1750000000002_abcdefghi';

  try {
    await withServer(server, async baseUrl => {
      const validationFailure = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: secondId,
          url: 'http://localhost:3000/app',
          comment: 'Images',
          attachments: [
            { name: 'first.png', mime_type: 'image/png', size_bytes: 5, data_url: 'data:image/png;base64,Zmlyc3Q=' },
            { name: 'wrong-size.png', mime_type: 'image/png', size_bytes: 1, data_url: 'data:image/png;base64,c2Vjb25k' },
          ],
        }),
      });
      assert.equal(validationFailure.status, 400);
      assert.deepEqual(await attachmentFiles(path.join(attachmentRoot, secondId)), []);

      const created = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          url: 'http://localhost:3000/app',
          comment: 'Create two variants and keep original on a failed replacement',
          variant_intent: { requested: true, default_count: 3 },
          attachments: [{ name: 'original.png', mime_type: 'image/png', size_bytes: 8, data_url: 'data:image/png;base64,b3JpZ2luYWw=' }],
        }),
      });
      assert.equal(created.status, 200);

      const requestVariants = await fetch(`${baseUrl}/api/annotations/${id}/variants/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ variants: [
          { key: 'a', name: 'A', implementation: {} },
          { key: 'b', name: 'B', implementation: {} },
        ] }),
      });
      assert.equal(requestVariants.status, 200);
      const variantFailure = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          url: 'http://localhost:3000/app',
          comment: 'Variant replacement',
          variant_request: null,
          screenshot: { data_url: 'data:image/png;base64,c2NyZWVuc2hvdA==' },
        }),
      });
      assert.equal(variantFailure.status, 409);
      assert.equal((await attachmentFiles(path.join(attachmentRoot, id))).length, 2);

      const replacementBase = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: thirdId,
          url: 'http://localhost:3000/app',
          comment: 'Keep original on a Queue write failure',
          attachments: [{ name: 'original.png', mime_type: 'image/png', size_bytes: 8, data_url: 'data:image/png;base64,b3JpZ2luYWw=' }],
        }),
      });
      assert.equal(replacementBase.status, 200);
      const replacementOriginalId = (await replacementBase.json()).annotation.attachments[0].id;

      const save = server._saveAnnotationsInternal;
      server._saveAnnotationsInternal = async () => { throw new Error('Queue write failed'); };
      const writeFailure = await fetch(`${baseUrl}/api/annotations/${thirdId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          attachments: [{ name: 'replacement.png', mime_type: 'image/png', size_bytes: 11, data_url: 'data:image/png;base64,cmVwbGFjZW1lbnQ=' }],
        }),
      });
      assert.equal(writeFailure.status, 500);
      server._saveAnnotationsInternal = save;

      assert.ok(await server.attachmentStore.get({ annotationId: thirdId, attachmentId: replacementOriginalId }));
      assert.equal((await attachmentFiles(path.join(attachmentRoot, thirdId))).length, 2);

      const replacement = await fetch(`${baseUrl}/api/annotations/${thirdId}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          attachments: [{ name: 'replacement.png', mime_type: 'image/png', size_bytes: 11, data_url: 'data:image/png;base64,cmVwbGFjZW1lbnQ=' }],
        }),
      });
      assert.equal(replacement.status, 200);
      assert.equal(await server.attachmentStore.get({ annotationId: thirdId, attachmentId: replacementOriginalId }), null);
      assert.equal((await attachmentFiles(path.join(attachmentRoot, thirdId))).length, 2);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('HTTP attachment references require matching metadata in their canonical Annotation', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-attachment-reference-'));
  const server = new LocalAnnotationsServer({
    annotationsFile: path.join(directory, 'annotations.json'),
    watchHistoryFile: path.join(directory, 'watch.json'),
    attachmentRoot: path.join(directory, 'attachments'),
  });
  const secondId = 'waypoint_1750000000001_abcdefghi';

  try {
    await withServer(server, async baseUrl => {
      const created = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id,
          url: 'http://localhost:3000/app',
          comment: 'Stored attachment',
          attachments: [{ name: 'detail.png', mime_type: 'image/png', size_bytes: 6, data_url: 'data:image/png;base64,ZGV0YWls' }],
        }),
      });
      const saved = (await created.json()).annotation.attachments[0];

      const crossAnnotation = await fetch(`${baseUrl}/api/annotations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: secondId, url: 'http://localhost:3000/app', comment: 'Cross reference', attachments: [saved] }),
      });
      assert.equal(crossAnnotation.status, 400);

      const metadataMismatch = await fetch(`${baseUrl}/api/annotations/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attachments: [{ ...saved, name: 'forged.png' }] }),
      });
      assert.equal(metadataMismatch.status, 400);

      const exactReference = await fetch(`${baseUrl}/api/annotations/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attachments: [saved] }),
      });
      assert.equal(exactReference.status, 200);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
