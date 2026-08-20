globalThis.WaypointDesignIntent = (() => {
  const SCHEMA_VERSION = 1;
  const WORKFLOW = 'impeccable';
  const catalog = [
    ['bolder', 'Bolder', 'Increase visual impact and confidence.'],
    ['quieter', 'Quieter', 'Reduce visual intensity and distraction.'],
    ['distill', 'Distill', 'Remove complexity and keep only what matters.'],
    ['polish', 'Polish', 'Refine hierarchy, spacing, and visual details.'],
    ['typeset', 'Typeset', 'Improve typography, scale, and rhythm.'],
    ['colorize', 'Colorize', 'Add purposeful color and clearer emphasis.'],
    ['layout', 'Layout', 'Improve structure, spacing, and alignment.'],
    ['animate', 'Animate', 'Add purposeful motion and transitions.'],
    ['delight', 'Delight', 'Add personality through thoughtful details.'],
    ['overdrive', 'Overdrive', 'Push the design beyond conventional limits.'],
  ].map(([action, label, description]) => ({ action, label, description }));
  const actions = catalog.map(item => item.action);
  const actionSet = new Set(actions);

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function hasExactKeys(value, expectedKeys) {
    const keys = Object.keys(value).sort();
    return keys.length === expectedKeys.length
      && keys.every((key, index) => key === expectedKeys[index]);
  }

  function createFreeform() {
    return create(null);
  }

  function create(action) {
    return assert({
      schema_version: SCHEMA_VERSION,
      workflow: WORKFLOW,
      action,
    });
  }

  function assert(value) {
    if (!isRecord(value) || !hasExactKeys(value, ['action', 'schema_version', 'workflow'])) {
      throw new TypeError('Design Intent must be a versioned workflow and action record');
    }
    if (value.schema_version !== SCHEMA_VERSION) {
      throw new TypeError(`Design Intent schema version must be ${SCHEMA_VERSION}`);
    }
    if (value.workflow !== WORKFLOW) throw new TypeError(`Design Intent workflow must be ${WORKFLOW}`);
    if (value.action !== null && !actionSet.has(value.action)) {
      throw new TypeError('Design Intent action must be Freeform or a canonical Design Action');
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
    catalog,
    create,
    createFreeform,
    preserve,
    removeIds,
    updateRemovalIds
  };
})();
