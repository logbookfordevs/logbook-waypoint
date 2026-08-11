import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
