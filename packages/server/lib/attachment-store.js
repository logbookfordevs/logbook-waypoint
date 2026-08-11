import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isValidAnnotationId } from './annotation-id.js';

export const ALLOWED_IMAGE_MIME_TYPES = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);
export const DEFAULT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ATTACHMENT_ID_PATTERN = /^[a-f0-9-]{36}$/;
const KIND_PATTERN = /^[a-z0-9_-]{1,48}$/;

function assertAnnotationId(annotationId) {
  if (!isValidAnnotationId(annotationId)) throw new TypeError('Invalid Waypoint annotation ID');
}

function assertAttachmentId(attachmentId) {
  if (typeof attachmentId !== 'string' || !ATTACHMENT_ID_PATTERN.test(attachmentId)) {
    throw new TypeError('Invalid attachment ID');
  }
}

function assertKind(kind) {
  if (typeof kind !== 'string' || !KIND_PATTERN.test(kind)) throw new TypeError('Invalid attachment kind');
}

function contentBuffer(content, mimeType) {
  if (Buffer.isBuffer(content)) return content;
  if (content instanceof Uint8Array) return Buffer.from(content);
  if (typeof content === 'string') {
    const prefix = `data:${mimeType};base64,`;
    if (content.startsWith(prefix)) return Buffer.from(content.slice(prefix.length), 'base64');
    return Buffer.from(content, 'base64');
  }
  throw new TypeError('Attachment content must be binary or base64');
}

export class AttachmentStore {
  constructor({ rootDir, maxBytes = DEFAULT_MAX_IMAGE_BYTES } = {}) {
    if (typeof rootDir !== 'string' || rootDir.length === 0) throw new TypeError('Attachment root directory is required');
    if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new TypeError('Attachment size limit must be a positive integer');
    this.rootDir = path.resolve(rootDir);
    this.maxBytes = maxBytes;
  }

  annotationDirectory(annotationId) {
    assertAnnotationId(annotationId);
    const directory = path.resolve(this.rootDir, annotationId);
    const relative = path.relative(this.rootDir, directory);
    if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new TypeError('Attachment path escapes storage root');
    }
    return directory;
  }

  async save({ annotationId, kind = 'image', mimeType, content } = {}) {
    assertAnnotationId(annotationId);
    assertKind(kind);
    const extension = ALLOWED_IMAGE_MIME_TYPES.get(mimeType);
    if (!extension) throw new TypeError('Unsupported image MIME type');
    const data = contentBuffer(content, mimeType);
    if (data.byteLength > this.maxBytes) throw new RangeError('Attachment exceeds size limit');

    const id = randomUUID();
    const filename = `${id}.${extension}`;
    const metadataFilename = `${id}.json`;
    const directory = this.annotationDirectory(annotationId);
    await mkdir(directory, { recursive: true });
    const contentPath = path.join(directory, filename);
    const metadataPath = path.join(directory, metadataFilename);
    const metadata = {
      id,
      annotation_id: annotationId,
      kind,
      mime_type: mimeType,
      byte_size: data.byteLength,
      filename,
      created_at: new Date().toISOString(),
    };
    const suffix = randomUUID();
    const temporaryContent = path.join(directory, `.${id}.${suffix}.tmp`);
    const temporaryMetadata = path.join(directory, `.${id}.${suffix}.json.tmp`);

    try {
      await writeFile(temporaryContent, data, { flag: 'wx' });
      await rename(temporaryContent, contentPath);
      await writeFile(temporaryMetadata, JSON.stringify(metadata), { flag: 'wx' });
      await rename(temporaryMetadata, metadataPath);
    } finally {
      await rm(temporaryContent, { force: true }).catch(() => {});
      await rm(temporaryMetadata, { force: true }).catch(() => {});
    }

    return metadata;
  }

  async get({ annotationId, attachmentId, includeContent = false } = {}) {
    assertAnnotationId(annotationId);
    assertAttachmentId(attachmentId);
    if (typeof includeContent !== 'boolean') throw new TypeError('includeContent must be a boolean');
    const directory = this.annotationDirectory(annotationId);
    const metadataPath = path.join(directory, `${attachmentId}.json`);
    let metadata;
    try {
      metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }

    if (
      metadata?.id !== attachmentId
      || metadata.annotation_id !== annotationId
      || !ALLOWED_IMAGE_MIME_TYPES.has(metadata.mime_type)
      || typeof metadata.filename !== 'string'
      || metadata.filename !== `${attachmentId}.${ALLOWED_IMAGE_MIME_TYPES.get(metadata.mime_type)}`
    ) {
      throw new TypeError('Invalid attachment metadata');
    }

    const result = { ...metadata };
    if (includeContent) {
      const contentPath = path.join(directory, metadata.filename);
      const fileInfo = await stat(contentPath);
      if (!fileInfo.isFile() || fileInfo.size > this.maxBytes) throw new TypeError('Invalid attachment content');
      result.content = (await readFile(contentPath)).toString('base64');
    }
    return result;
  }

  async cleanup(annotationId) {
    const directory = this.annotationDirectory(annotationId);
    await rm(directory, { recursive: true, force: true });
  }

  async delete({ annotationId, attachmentId } = {}) {
    assertAnnotationId(annotationId);
    assertAttachmentId(attachmentId);
    const directory = this.annotationDirectory(annotationId);
    await Promise.all([
      rm(path.join(directory, `${attachmentId}.json`), { force: true }),
      ...[...ALLOWED_IMAGE_MIME_TYPES.values()].map(extension => rm(
        path.join(directory, `${attachmentId}.${extension}`),
        { force: true },
      )),
    ]);
  }
}
