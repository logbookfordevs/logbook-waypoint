globalThis.WaypointVariantIntent = (() => {
  function assert(value) {
    const keys = value && typeof value === 'object' && !Array.isArray(value)
      ? Object.keys(value).sort()
      : [];
    if (keys.join(',') !== 'default_count,requested' || value.requested !== true || value.default_count !== 3) {
      throw new TypeError('Variant Intent must request the default count of 3');
    }
    return value;
  }

  function assertAnnotation(annotation) {
    if (annotation.variant_intent !== undefined) assert(annotation.variant_intent);
    return annotation;
  }

  function applyUpdate(annotation, updates) {
    const updated = { ...annotation, ...updates };
    if (Object.hasOwn(updates, 'variant_intent') && updates.variant_intent === null) {
      delete updated.variant_intent;
    }
    return assertAnnotation(updated);
  }

  function preserve(existing, incoming) {
    if (existing?.variant_intent !== undefined && !Object.hasOwn(incoming, 'variant_intent')) {
      return assertAnnotation({ ...incoming, variant_intent: existing.variant_intent });
    }
    return assertAnnotation(incoming);
  }

  function updateRemovalIds(removalIds, id, updates) {
    const next = removalIds.filter(candidate => candidate !== id);
    if (updates.variant_intent === null) next.push(id);
    return next;
  }

  function removeIds(removalIds, ids) {
    const removed = new Set(ids);
    return removalIds.filter(id => !removed.has(id));
  }

  return { applyUpdate, assert, assertAnnotation, preserve, removeIds, updateRemovalIds };
})();
