globalThis.WaypointDesignIntent = (() => {
  const SCHEMA_VERSION = 1;
  const WORKFLOW = 'impeccable';

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
      schema_version: SCHEMA_VERSION,
      workflow: WORKFLOW,
      action: null,
    };
  }

  function assert(value) {
    if (!isRecord(value) || !hasExactKeys(value, ['action', 'schema_version', 'workflow'])) {
      throw new TypeError('Design Intent must be a versioned workflow and action record');
    }
    if (value.schema_version !== SCHEMA_VERSION) {
      throw new TypeError(`Design Intent schema version must be ${SCHEMA_VERSION}`);
    }
    if (value.workflow !== WORKFLOW) throw new TypeError(`Design Intent workflow must be ${WORKFLOW}`);
    if (value.action !== null) {
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

  function updateRemovalIds(removalIds, id, updates) {
    const next = removalIds.filter(candidate => candidate !== id);
    if (updates.design_intent === null) next.push(id);
    return next;
  }

  function removeIds(removalIds, ids) {
    const removed = new Set(ids);
    return removalIds.filter(id => !removed.has(id));
  }

  return {
    applyUpdate,
    assert,
    assertAnnotation,
    createFreeform,
    preserve,
    removeIds,
    updateRemovalIds
  };
})();
