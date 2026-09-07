import { randomUUID, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, open, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createProjectScope, matchesProjectScope } from './project-scope.js';
import { isValidAnnotationId } from './annotation-id.js';
import { assertAnnotationLifecycleState } from './annotation-lifecycle.js';
import { assertAnnotationDesignIntent } from './design-intent.js';
import { assertResolutionRecordSummary } from './resolution-record.js';
import { assertAnnotationVariantIntent } from './variant-intent.js';
import { annotationHasScreenshot, targetHasScreenshot } from './annotation-media.js';
import { normalizeAnnotationTargets } from './annotation-targets.js';
import { summarizeAnnotation } from './annotation-summary.js';

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, canonicalValue(value[key])]),
  );
}

function comparableAnnotation(annotation) {
  return JSON.stringify(canonicalValue(annotation));
}

function portableAnnotation(annotation, hasScreenshot) {
  annotation = normalizeAnnotationTargets(annotation);
  const {
    screenshot,
    has_screenshot,
    source_file_path,
    source_line_range,
    source_map_available,
    context_hints,
    component_name,
    file_path_hint,
    line_range_hint,
    variant_presentation,
    variant_request,
    pending_changes,
    css,
    resolution_record,
    ...portableFields
  } = annotation;
  const targets = annotation.targets.map((target) => {
    const {
      screenshot: targetScreenshot,
      source_file_path: targetSourceFilePath,
      source_line_range: targetSourceLineRange,
      source_map_available: targetSourceMapAvailable,
      context_hints: targetContextHints,
      component_name: targetComponentName,
      source_identity: targetSourceIdentity,
      source_mapping: targetSourceMapping,
      ...portableTarget
    } = target;
    return {
      ...portableTarget,
      has_screenshot: targetHasScreenshot({ ...target, screenshot: targetScreenshot }),
    };
  });
  const portableVariantRequest = variant_request && {
    status: variant_request.status,
    active_variant_key: variant_request.active_variant_key,
    variants: variant_request.variants?.map(({ key, name, state }) => ({ key, name, state })),
  };
  return {
    ...portableFields,
    targets,
    ...(!variant_request && pending_changes !== undefined ? { pending_changes } : {}),
    ...(!variant_request && css !== undefined ? { css } : {}),
    ...(portableVariantRequest ? { variant_request: portableVariantRequest } : {}),
    ...(resolution_record ? { resolution_record: { summary: resolution_record.summary } } : {}),
    has_screenshot: hasScreenshot,
  };
}

export function toWatchAnnotation(annotation) {
  const targets = normalizeAnnotationTargets(annotation).targets;
  return portableAnnotation(annotation, annotationHasScreenshot(annotation, targets));
}

export function toReadAnnotation(annotation) {
  const portable = toWatchAnnotation(annotation);
  const withResolutionRecord = annotation.resolution_record
    ? { ...portable, resolution_record: structuredClone(annotation.resolution_record) }
    : portable;
  if (!annotation.variant_request) return withResolutionRecord;
  return {
    ...withResolutionRecord,
    ...(annotation.variant_presentation !== undefined ? { variant_presentation: structuredClone(annotation.variant_presentation) } : {}),
    ...(annotation.pending_changes !== undefined ? { pending_changes: structuredClone(annotation.pending_changes) } : {}),
    ...(annotation.css !== undefined ? { css: annotation.css } : {}),
  };
}

function normalizeJournalAnnotation(annotation) {
  return summarizeAnnotation(annotation);
}

function validateSavedQueue(saved) {
  if (!saved || typeof saved.initialCursor !== 'string' || !Array.isArray(saved.history)) {
    throw new Error('Invalid Watch journal header');
  }
  const cursors = new Set([saved.initialCursor]);
  const history = saved.history.map((change, index) => {
    const sequence = index + 1;
    if (
      change?.sequence !== sequence
      || ![String(sequence), `${saved.initialCursor}:${sequence}`].includes(change.revision)
      || typeof change.cursor !== 'string'
      || cursors.has(change.cursor)
      || !change.annotation
      || !isValidAnnotationId(change.annotation.id)
    ) {
      throw new Error('Invalid Watch journal change');
    }
    cursors.add(change.cursor);
    const annotation = normalizeJournalAnnotation(change.annotation);
    assertAnnotationLifecycleState(annotation);
    assertAnnotationDesignIntent(annotation);
    if (annotation.resolution_record !== undefined) assertResolutionRecordSummary(annotation.resolution_record);
    assertAnnotationVariantIntent(annotation);
    return { ...change, annotation };
  });
  if (saved.signingKey !== undefined && (typeof saved.signingKey !== 'string' || !/^[a-f0-9]{64}$/.test(saved.signingKey))) {
    throw new Error('Invalid Watch signing key');
  }
  return { initialCursor: saved.initialCursor, signingKey: saved.signingKey, history };
}

export class WatchQueue {
  constructor(saved = {}) {
    const initialCursor = saved.initialCursor ?? randomUUID();
    const history = saved.history ?? [];
    this.initialCursor = initialCursor;
    this.signingKey = saved.signingKey ?? randomBytes(32).toString('hex');
    this.history = history;
    this.waiters = new Set();
    this.rebuildIndexes();
  }

  rebuildIndexes() {
    this.sequence = this.history.at(-1)?.sequence ?? 0;
    this.cursorSequences = new Map([[this.initialCursor, 0]]);
    this.latestById = new Map();
    for (const change of this.history) {
      this.cursorSequences.set(change.cursor, change.sequence);
      this.latestById.set(change.annotation.id, change.annotation);
    }
  }

  toJSON() {
    return {
      initialCursor: this.initialCursor,
      signingKey: this.signingKey,
      history: this.history,
    };
  }

  get cursor() {
    return this.history.at(-1)?.cursor ?? this.initialCursor;
  }

  recordChanges(previousAnnotations, nextAnnotations) {
    const previousById = new Map(
      previousAnnotations.map(annotation => {
        const summary = summarizeAnnotation(annotation);
        return [summary.id, summary];
      }),
    );
    return this.recordChangesFrom(previousById, nextAnnotations);
  }

  recordChangesFrom(previousById, nextAnnotations) {
    const changes = [];

    for (const rawAnnotation of nextAnnotations) {
      if (!isValidAnnotationId(rawAnnotation?.id)) {
        throw new TypeError('Invalid Waypoint annotation ID');
      }
      const annotation = summarizeAnnotation(rawAnnotation);
      const previous = previousById.get(annotation.id);
      if (!previous || comparableAnnotation(previous) !== comparableAnnotation(annotation)) {
        const sequence = ++this.sequence;
        const change = {
          sequence,
          cursor: randomUUID(),
          annotation,
          revision: `${this.initialCursor}:${sequence}`,
        };
        this.history.push(change);
        this.cursorSequences.set(change.cursor, sequence);
        this.latestById.set(annotation.id, annotation);
        changes.push(change);
      }
    }

    if (changes.length > 0) this.notifyWaiters();
    return changes;
  }

  reconcile(nextAnnotations) {
    const changes = this.recordChangesFrom(this.latestById, nextAnnotations);
    this.latestById = new Map(
      nextAnnotations.map(annotation => {
        const summary = summarizeAnnotation(annotation);
        return [summary.id, summary];
      }),
    );
    return changes;
  }

  reconciledCopy(nextAnnotations) {
    const candidate = new WatchQueue(structuredClone(this.toJSON()));
    candidate.latestById = new Map(this.latestById);
    const changes = candidate.reconcile(nextAnnotations);
    return { candidate, changes };
  }

  commit(candidate) {
    const changed = candidate.sequence > this.sequence;
    const latestById = candidate.latestById;
    this.initialCursor = candidate.initialCursor;
    this.signingKey = candidate.signingKey;
    this.history = candidate.history;
    this.rebuildIndexes();
    this.latestById = new Map(latestById);
    if (changed) this.notifyWaiters();
  }

  notifyWaiters() {
    for (const notify of this.waiters) notify();
    this.waiters.clear();
  }

  changesAfter(cursor) {
    if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 512)) {
      throw new Error('Invalid Watch cursor');
    }
    const afterSequence = cursor === undefined ? 0 : this.cursorSequences.get(cursor);
    if (afterSequence === undefined) throw new Error('Invalid Watch cursor');
    return this.history.slice(afterSequence);
  }

  scopedCursor(cursor, scope) {
    const payload = Buffer.from(JSON.stringify({ cursor, scope })).toString('base64url');
    const signature = createHmac('sha256', this.signingKey).update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  readScopedCursor(token) {
    try {
      if (typeof token !== 'string' || token.length > 16384) throw new Error();
      const [payload, signature, extra] = token.split('.');
      const expected = createHmac('sha256', this.signingKey).update(payload).digest('base64url');
      if (extra !== undefined || typeof signature !== 'string' || signature.length !== expected.length
        || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error();
      return JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
      throw new Error('Invalid scoped Watch cursor. Start a new Watch with url.');
    }
  }

  async watch({ cursor, timeoutMs = 25_000, url, scoped = false } = {}) {
    let scope;
    if (scoped) {
      if (cursor !== undefined) {
        const saved = this.readScopedCursor(cursor);
        scope = saved.scope;
        cursor = saved.cursor;
        if (url !== undefined && JSON.stringify(createProjectScope(url)) !== JSON.stringify(scope)) {
          throw new Error('Watch cursor belongs to a different URL scope. Start a new Watch with url.');
        }
      } else {
        scope = createProjectScope(url);
      }
    }
    const deadline = Date.now() + timeoutMs;
    let changes;
    do {
      const available = this.changesAfter(cursor);
      cursor = available.at(-1)?.cursor ?? cursor ?? this.initialCursor;
      changes = scope ? available.filter(change => matchesProjectScope(change.annotation.url, scope)) : available;
      const remaining = deadline - Date.now();
      if (changes.length > 0 || remaining <= 0) break;
      await new Promise(resolve => {
        const timer = setTimeout(() => {
          this.waiters.delete(notify);
          resolve();
        }, remaining);
        const notify = () => {
          clearTimeout(timer);
          resolve();
        };
        this.waiters.add(notify);
      });
    } while (true);

    return { changes, cursor: scoped ? this.scopedCursor(cursor, scope) : cursor };
  }

}

export class PersistentWatchQueue {
  constructor({ historyFile }) {
    this.historyFile = historyFile;
    this.queue = null;
    this.initialization = null;
    this.operations = Promise.resolve();
    this.needsReconciliation = false;
  }

  async watch(options, loadAnnotations) {
    const queue = await this.serialize(async () => {
      const initializedQueue = await this.ensureQueue(loadAnnotations);
      if (this.needsReconciliation) {
        const annotations = await loadAnnotations();
        await this.reconcileAndPersist(initializedQueue, annotations);
        this.needsReconciliation = false;
      }
      return initializedQueue;
    });
    return queue.watch(options);
  }

  async recordChanges(nextAnnotations, loadAnnotations = async () => []) {
    return this.serialize(async () => {
      const queue = await this.ensureQueue(loadAnnotations);
      try {
        return await this.reconcileAndPersist(queue, nextAnnotations);
      } catch (error) {
        this.needsReconciliation = true;
        throw error;
      }
    });
  }

  async ensureQueue(loadAnnotations) {
    if (this.queue) return this.queue;
    if (!this.initialization) {
      this.initialization = this.initialize(loadAnnotations).catch(error => {
        this.initialization = null;
        throw error;
      });
    }
    return this.initialization;
  }

  async initialize(loadAnnotations) {
    const annotations = await loadAnnotations();
    let queue;
    let replaceJournal = !existsSync(this.historyFile);

    if (replaceJournal) {
      queue = new WatchQueue();
    } else {
      try {
        const loaded = await this.loadJournal();
        queue = new WatchQueue(validateSavedQueue(loaded.saved));
        replaceJournal = loaded.replaceJournal || !loaded.saved.signingKey;
      } catch (error) {
        const corruptedFile = `${this.historyFile}.corrupted.${randomUUID()}`;
        await rename(this.historyFile, corruptedFile);
        console.warn(`Corrupted Watch journal moved to ${corruptedFile}: ${error.message}`);
        queue = new WatchQueue();
        replaceJournal = true;
      }
    }

    const changes = queue.reconcile(annotations);
    if (replaceJournal || changes.length > 0) {
      await this.persist(queue, { replace: true });
    }
    this.queue = queue;
    return queue;
  }

  async loadJournal() {
    const source = await readFile(this.historyFile, 'utf8');
    try {
      const legacy = JSON.parse(source);
      if (legacy?.initialCursor && Array.isArray(legacy.history)) {
        return { saved: legacy, replaceJournal: true };
      }
    } catch {}

    const complete = source.endsWith('\n');
    const lines = source.split('\n');
    if (lines.at(-1) === '') lines.pop();
    const records = [];
    let replaceJournal = false;
    for (const [index, line] of lines.entries()) {
      try {
        records.push(JSON.parse(line));
      } catch (error) {
        if (!complete && index === lines.length - 1) {
          replaceJournal = true;
          break;
        }
        throw error;
      }
    }

    const [header, ...changes] = records;
    if (header?.type !== 'header') throw new Error('Invalid Watch journal header');
    if (changes.some(change => change.type !== 'change')) {
      throw new Error('Invalid Watch journal record');
    }
    return {
      saved: {
        initialCursor: header.initial_cursor,
        signingKey: header.signing_key,
        history: changes.map(({ type, ...change }) => change),
      },
      replaceJournal,
    };
  }

  serialize(operation) {
    this.operations = this.operations.catch(() => {}).then(operation);
    return this.operations;
  }

  async reconcileAndPersist(queue, annotations) {
    const previousSequence = queue.sequence;
    const { candidate, changes } = queue.reconciledCopy(annotations);
    if (changes.length === 0) {
      queue.commit(candidate);
      return changes;
    }
    await this.persist(candidate, { previousSequence });
    queue.commit(candidate);
    return changes;
  }

  async persist(queue, { previousSequence = 0, replace = false } = {}) {
    await mkdir(path.dirname(this.historyFile), { recursive: true });
    if (replace || !existsSync(this.historyFile)) {
      const records = [
        JSON.stringify({ type: 'header', initial_cursor: queue.initialCursor, signing_key: queue.signingKey }),
        ...queue.history.map(change => JSON.stringify({ type: 'change', ...change })),
      ];
      const tempFile = `${this.historyFile}.tmp`;
      await writeFile(tempFile, `${records.join('\n')}\n`);
      const tempHandle = await open(tempFile, 'r');
      await tempHandle.sync();
      await tempHandle.close();
      await rename(tempFile, this.historyFile);
      return;
    }

    const records = queue.history
      .slice(previousSequence)
      .map(change => JSON.stringify({ type: 'change', ...change }));
    const handle = await open(this.historyFile, 'a');
    try {
      await handle.writeFile(`${records.join('\n')}\n`);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
}
