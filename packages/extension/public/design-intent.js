globalThis.WaypointDesignIntent = (() => {
  const VERSION = 1;
  const WORKFLOW = 'impeccable';
  const FREEFORM_ACTION = 'freeform';

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function hasExactKeys(value, expectedKeys) {
    const keys = Object.keys(value).sort();
    return keys.length === expectedKeys.length
      && keys.every((key, index) => key === expectedKeys[index]);
  }

  function createFreeform() {
    return {
      version: VERSION,
      workflow: WORKFLOW,
      action: { type: FREEFORM_ACTION },
    };
  }

  function assert(value) {
    if (!isRecord(value) || !hasExactKeys(value, ['action', 'version', 'workflow'])) {
      throw new TypeError('Design Intent must be a versioned workflow and action record');
    }
    if (value.version !== VERSION) throw new TypeError(`Design Intent version must be ${VERSION}`);
    if (value.workflow !== WORKFLOW) throw new TypeError(`Design Intent workflow must be ${WORKFLOW}`);
    if (
      !isRecord(value.action)
      || !hasExactKeys(value.action, ['type'])
      || value.action.type !== FREEFORM_ACTION
    ) {
      throw new TypeError('Design Intent action must be Freeform');
    }
    return value;
  }

  function assertAnnotation(annotation) {
    if (annotation.design_intent !== undefined) assert(annotation.design_intent);
    return annotation;
  }

  function applyUpdate(annotation, updates) {
    const updated = { ...annotation, ...updates };
    if (Object.hasOwn(updates, 'design_intent') && updates.design_intent === null) {
      delete updated.design_intent;
    }
    return assertAnnotation(updated);
  }

  function preserve(existing, incoming) {
    if (existing?.design_intent !== undefined && !Object.hasOwn(incoming, 'design_intent')) {
      return assertAnnotation({ ...incoming, design_intent: existing.design_intent });
    }
    return assertAnnotation(incoming);
  }

  return { applyUpdate, assert, assertAnnotation, createFreeform, preserve };
})();
