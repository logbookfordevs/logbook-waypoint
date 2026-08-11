import assert from 'node:assert/strict';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ANNOTATION_ID_PREFIX,
  createAnnotationId,
  isValidAnnotationId,
} from '@logbookfordevs/waypoint/annotation-id';
import { LocalAnnotationsServer } from '../lib/server.js';

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

test('persisted Queue loading rejects predecessor Annotation IDs', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-id-load-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const watchHistoryFile = path.join(directory, 'watch-history.json');
  await writeFile(annotationsFile, JSON.stringify([
    { id: 'vibe_1750000000000_abc123xyz', comment: 'predecessor data' },
    { id: 'waypoint_1750000000000_abc123xyz', comment: 'Waypoint data' },
  ]));

  try {
    const server = new LocalAnnotationsServer({ annotationsFile, watchHistoryFile });
    const annotations = await server.loadAnnotations();

    assert.deepEqual(annotations.map(annotation => annotation.id), [
      'waypoint_1750000000000_abc123xyz',
    ]);
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('Queue persistence rejects predecessor Annotation IDs before writing', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'waypoint-id-save-'));
  const annotationsFile = path.join(directory, 'annotations.json');
  const watchHistoryFile = path.join(directory, 'watch-history.json');

  try {
    const server = new LocalAnnotationsServer({ annotationsFile, watchHistoryFile });
    await assert.rejects(
      server.saveAnnotations([{ id: 'vibe_1750000000000_abc123xyz' }]),
      /Invalid Waypoint annotation ID/,
    );
    await assert.rejects(access(annotationsFile));
    await assert.rejects(access(watchHistoryFile));
  } finally {
    await rm(directory, { recursive: true });
  }
});
