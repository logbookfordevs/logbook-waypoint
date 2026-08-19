const DESIGN_INTENT_VERSION = 1;
const IMPRECCABLE_WORKFLOW = 'impeccable';
const FREEFORM_ACTION = 'freeform';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, expectedKeys) {
  const keys = Object.keys(value).sort();
  return keys.length === expectedKeys.length
    && keys.every((key, index) => key === expectedKeys[index]);
}

export function createFreeformDesignIntent() {
  return {
    version: DESIGN_INTENT_VERSION,
    workflow: IMPRECCABLE_WORKFLOW,
    action: { type: FREEFORM_ACTION },
  };
}

export function assertDesignIntent(value) {
  if (!isRecord(value) || !hasExactKeys(value, ['action', 'version', 'workflow'])) {
    throw new TypeError('Design Intent must be a versioned workflow and action record');
  }
  if (value.version !== DESIGN_INTENT_VERSION) {
    throw new TypeError(`Design Intent version must be ${DESIGN_INTENT_VERSION}`);
  }
  if (value.workflow !== IMPRECCABLE_WORKFLOW) {
    throw new TypeError(`Design Intent workflow must be ${IMPRECCABLE_WORKFLOW}`);
  }
  if (
    !isRecord(value.action)
    || !hasExactKeys(value.action, ['type'])
    || value.action.type !== FREEFORM_ACTION
  ) {
    throw new TypeError('Design Intent action must be Freeform');
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
