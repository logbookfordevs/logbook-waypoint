const SUMMARY_MAX_LENGTH = 500;
const VERIFICATION_MAX_ITEMS = 20;
const VERIFICATION_ITEM_MAX_LENGTH = 300;
const UNSAFE_EVIDENCE = [
  /\b(?:hidden|system)\s+prompt\b/i,
  /\b(?:impeccable live|provider[- ]internal|polling journal)\b/i,
  /\bstack\s+trace\b|(?:^|\n)\s*at\s+\S+(?:\s+\([^\n]+:\d+:\d+\)|:\d+:\d+)/i,
  /(?:^|[\s('"])(?:\/[A-Za-z0-9._-]+){2,}(?=$|[\s)'":,])|\b[A-Za-z]:\\(?:[^\\\s]+\\)+[^\\\s]+/,
];

function assertSafeText(value, label, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new TypeError(`${label} must be a bounded non-empty string`);
  }
  if (UNSAFE_EVIDENCE.some(pattern => pattern.test(value))) {
    throw new TypeError(`${label} must contain only safe provider-neutral evidence`);
  }
  return value;
}

export function assertResolutionRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('Resolution Record must be an object');
  }
  if (Object.keys(record).some(key => !['summary', 'verification'].includes(key))) {
    throw new TypeError('Resolution Record contains unsupported fields');
  }
  assertSafeText(record.summary, 'Resolution Record summary', SUMMARY_MAX_LENGTH);
  if (!Array.isArray(record.verification) || record.verification.length === 0 || record.verification.length > VERIFICATION_MAX_ITEMS) {
    throw new TypeError('Resolution Record verification must be a non-empty bounded checklist');
  }
  record.verification.forEach(item => {
    assertSafeText(item, 'Resolution Record verification item', VERIFICATION_ITEM_MAX_LENGTH);
  });
  return record;
}

export function assertResolutionRecordSummary(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record) || Object.keys(record).some(key => key !== 'summary')) {
    throw new TypeError('Watch Resolution Record must contain only a summary');
  }
  assertSafeText(record.summary, 'Resolution Record summary', SUMMARY_MAX_LENGTH);
  return record;
}

export function assertAnnotationResolutionRecord(annotation) {
  if (annotation.resolution_record !== undefined) {
    assertResolutionRecord(annotation.resolution_record);
    if (annotation.status !== 'resolved' || annotation.design_intent === undefined) {
      throw new TypeError('Resolution Record belongs only to a Resolved Design Action');
    }
  }
  return annotation;
}

export function preserveResolutionRecord(existing, incoming) {
  if (existing?.resolution_record === undefined) return incoming;
  return { ...incoming, resolution_record: structuredClone(existing.resolution_record) };
}
