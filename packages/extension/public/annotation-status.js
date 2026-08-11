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
    throw new TypeError('Invalid Annotation status');
  }

  function migrateLegacyStatus(value) {
    if (value === undefined) return 'pending';
    const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (CANONICAL_STATUSES.includes(status)) return status;
    const migrated = LEGACY_STATUSES.get(status);
    if (migrated) return migrated;
    throw new TypeError('Invalid Annotation status');
  }

  function normalize(annotation) {
    if (!annotation || typeof annotation !== 'object') return annotation;
    return { ...annotation, status: normalizeStatus(annotation.status) };
  }

  function normalizeAll(annotations) {
    return Array.isArray(annotations) ? annotations.map(normalize) : [];
  }

  function migrateLegacy(annotation) {
    if (!annotation || typeof annotation !== 'object') return annotation;
    return { ...annotation, status: migrateLegacyStatus(annotation.status) };
  }

  function migrateLegacyAll(annotations) {
    return Array.isArray(annotations) ? annotations.map(migrateLegacy) : [];
  }

  function normalizeUpdate(updates) {
    if (!updates || typeof updates !== 'object') return updates;
    if (Object.hasOwn(updates, 'status') || Object.hasOwn(updates, 'claim')) {
      throw new TypeError('Annotation lifecycle state and Claim change only through lifecycle operations');
    }
    return { ...updates };
  }

  function assertSaveAllowed(existing, incoming) {
    if (!existing) {
      if (incoming?.status !== 'pending' || Object.hasOwn(incoming, 'claim')) {
        throw new TypeError('New Annotations must start Pending without a Claim');
      }
      return incoming;
    }
    const existingClaim = Object.hasOwn(existing, 'claim') ? JSON.stringify(existing.claim) : null;
    const incomingClaim = Object.hasOwn(incoming, 'claim') ? JSON.stringify(incoming.claim) : null;
    if (existing.status !== incoming?.status || existingClaim !== incomingClaim) {
      throw new TypeError('Annotation lifecycle state and Claim change only through lifecycle operations');
    }
    return incoming;
  }

  function assertFilter(status) {
    if (status !== 'all' && !CANONICAL_STATUSES.includes(status)) {
      throw new TypeError('Invalid export status');
    }
    return status;
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
    assertSaveAllowed,
    assertFilter,
    countActionable,
    filterActionable,
    isActionable,
    migrateLegacy,
    migrateLegacyAll,
    normalize,
    normalizeAll,
    normalizeStatus,
    normalizeUpdate,
  };
})();
