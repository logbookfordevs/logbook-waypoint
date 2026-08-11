import { randomUUID } from 'node:crypto';

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
