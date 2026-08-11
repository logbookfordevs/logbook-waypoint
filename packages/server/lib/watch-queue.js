import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

function comparableAnnotation(annotation) {
  return JSON.stringify(annotation);
}

export class WatchQueue {
  constructor({ initialCursor = randomUUID(), history = [] } = {}) {
    this.initialCursor = initialCursor;
    this.history = history;
    this.sequence = history.at(-1)?.sequence ?? 0;
    this.waiters = new Set();
  }

  toJSON() {
    return {
      initialCursor: this.initialCursor,
      history: this.history,
    };
  }

  get cursor() {
    return this.history.at(-1)?.cursor ?? this.initialCursor;
  }

  recordChanges(previousAnnotations, nextAnnotations) {
    const previousById = new Map(previousAnnotations.map(annotation => [annotation.id, annotation]));
    const changes = [];

    for (const annotation of nextAnnotations) {
      const previous = previousById.get(annotation.id);
      if (!previous || comparableAnnotation(previous) !== comparableAnnotation(annotation)) {
        const sequence = ++this.sequence;
        const change = {
          sequence,
          cursor: randomUUID(),
          annotation,
          revision: String(sequence),
        };
        this.history.push(change);
        changes.push(change);
      }
    }

    if (changes.length > 0) {
      for (const notify of this.waiters) notify();
      this.waiters.clear();
    }
    return changes;
  }

  reconcile(nextAnnotations) {
    const latestById = new Map();
    for (const change of this.history) {
      latestById.set(change.annotation.id, change.annotation);
    }
    return this.recordChanges([...latestById.values()], nextAnnotations);
  }

  reconciledCopy(nextAnnotations) {
    const candidate = new WatchQueue(structuredClone(this.toJSON()));
    const changes = candidate.reconcile(nextAnnotations);
    return { candidate, changes };
  }

  commit(candidate) {
    const changed = candidate.sequence > this.sequence;
    this.initialCursor = candidate.initialCursor;
    this.history = candidate.history;
    this.sequence = candidate.sequence;
    if (changed) this.notifyWaiters();
  }

  notifyWaiters() {
    for (const notify of this.waiters) notify();
    this.waiters.clear();
  }

  async watch({ cursor, timeoutMs = 25_000 } = {}) {
    if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 512)) {
      throw new Error('Invalid Watch cursor');
    }
    const cursorChange = cursor === undefined
      ? null
      : this.history.find(change => change.cursor === cursor);
    if (cursor !== undefined && cursor !== this.initialCursor && !cursorChange) {
      throw new Error('Invalid Watch cursor');
    }

    const afterSequence = cursorChange?.sequence ?? 0;
    let changes = this.history.filter(change => change.sequence > afterSequence);
    if (changes.length === 0 && timeoutMs > 0) {
      await new Promise(resolve => {
        const timer = setTimeout(() => {
          this.waiters.delete(notify);
          resolve();
        }, timeoutMs);
        const notify = () => {
          clearTimeout(timer);
          resolve();
        };
        this.waiters.add(notify);
      });
      changes = this.history.filter(change => change.sequence > afterSequence);
    }

    return {
      changes,
      cursor: changes.at(-1)?.cursor ?? cursor ?? this.initialCursor,
    };
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
    const historyExists = existsSync(this.historyFile);
    const saved = historyExists
      ? JSON.parse(await readFile(this.historyFile, 'utf8'))
      : undefined;
    const queue = new WatchQueue(saved);
    const changes = queue.reconcile(annotations);
    if (!historyExists || changes.length > 0) await this.persist(queue);
    this.queue = queue;
    return queue;
  }

  serialize(operation) {
    this.operations = this.operations.catch(() => {}).then(operation);
    return this.operations;
  }

  async reconcileAndPersist(queue, annotations) {
    const { candidate, changes } = queue.reconciledCopy(annotations);
    if (changes.length === 0) return changes;
    await this.persist(candidate);
    queue.commit(candidate);
    return changes;
  }

  async persist(queue) {
    await mkdir(path.dirname(this.historyFile), { recursive: true });
    const tempFile = `${this.historyFile}.tmp`;
    await writeFile(tempFile, JSON.stringify(queue.toJSON(), null, 2));
    await rename(tempFile, this.historyFile);
  }
}
