const DESIGN_INTENT_SCHEMA_VERSION = 1;
const IMPECCABLE_WORKFLOW = 'impeccable';
const DESIGN_ACTIONS = new Set([
  'bolder',
  'quieter',
  'distill',
  'polish',
  'typeset',
  'colorize',
  'layout',
  'animate',
  'delight',
  'overdrive',
]);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  const keys = Object.keys(value).sort();
  return keys.length === expectedKeys.length
    && keys.every((key, index) => key === expectedKeys[index]);
}

export function createFreeformDesignIntent() {
  return createDesignIntent(null);
}

export function createDesignIntent(action) {
  return assertDesignIntent({
    schema_version: DESIGN_INTENT_SCHEMA_VERSION,
    workflow: IMPECCABLE_WORKFLOW,
    action,
  });
}

export function assertDesignIntent(value) {
  if (!isRecord(value) || !hasExactKeys(value, ['action', 'schema_version', 'workflow'])) {
    throw new TypeError('Design Intent must be a versioned workflow and action record');
  }
  if (value.schema_version !== DESIGN_INTENT_SCHEMA_VERSION) {
    throw new TypeError(`Design Intent schema version must be ${DESIGN_INTENT_SCHEMA_VERSION}`);
  }
  if (value.workflow !== IMPECCABLE_WORKFLOW) {
    throw new TypeError(`Design Intent workflow must be ${IMPECCABLE_WORKFLOW}`);
  }
  if (value.action !== null && !DESIGN_ACTIONS.has(value.action)) {
    throw new TypeError('Design Intent action must be Freeform or a canonical Design Action');
  }
  return value;
}

export function assertAnnotationDesignIntent(annotation) {
  if (annotation.design_intent !== undefined) assertDesignIntent(annotation.design_intent);
  return annotation;
}

export function applyDesignIntentUpdate(annotation, updates) {
  const updated = { ...annotation, ...updates };
  if (Object.hasOwn(updates, 'design_intent') && updates.design_intent === null) {
    delete updated.design_intent;
  }
  return assertAnnotationDesignIntent(updated);
}

export function preserveDesignIntent(existing, incoming) {
  if (existing?.design_intent !== undefined && !Object.hasOwn(incoming, 'design_intent')) {
    return assertAnnotationDesignIntent({ ...incoming, design_intent: existing.design_intent });
  }
  return assertAnnotationDesignIntent(incoming);
}
