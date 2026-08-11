globalThis.WaypointAnnotationStatus = (() => {
  const CANONICAL_STATUSES = Object.freeze(['pending', 'claimed', 'resolved', 'discarded']);
  const ACTIONABLE_STATUSES = new Set(['pending', 'claimed']);
  const LEGACY_STATUSES = new Map([
    ['completed', 'resolved'],
    ['archived', 'discarded'],
  ]);

  function normalizeStatus(value) {
    const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (CANONICAL_STATUSES.includes(status)) return status;
    return LEGACY_STATUSES.get(status) || 'pending';
  }

  function normalize(annotation) {
    if (!annotation || typeof annotation !== 'object') return annotation;
    return { ...annotation, status: normalizeStatus(annotation.status) };
  }

  function normalizeAll(annotations) {
    return Array.isArray(annotations) ? annotations.map(normalize) : [];
  }

  function normalizeUpdate(updates) {
    if (!updates || typeof updates !== 'object') return updates;
    return Object.hasOwn(updates, 'status')
      ? { ...updates, status: normalizeStatus(updates.status) }
      : { ...updates };
  }

  function isActionable(annotation) {
    return ACTIONABLE_STATUSES.has(normalizeStatus(annotation?.status));
  }

  function filterActionable(annotations) {
    return normalizeAll(annotations).filter(isActionable);
  }

  function countActionable(annotations) {
    return filterActionable(annotations).reduce(
      (counts, annotation) => ({ ...counts, [annotation.status]: counts[annotation.status] + 1 }),
      { pending: 0, claimed: 0 },
    );
  }

  return {
    ACTIONABLE_STATUSES: Object.freeze([...ACTIONABLE_STATUSES]),
    CANONICAL_STATUSES,
    countActionable,
    filterActionable,
    isActionable,
    normalize,
    normalizeAll,
    normalizeStatus,
    normalizeUpdate,
  };
})();
