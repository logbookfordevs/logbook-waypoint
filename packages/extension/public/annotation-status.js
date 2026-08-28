globalThis.WaypointAnnotationStatus = (() => {
  const CANONICAL_STATUSES = Object.freeze(['pending', 'claimed', 'resolved', 'discarded']);
  const ACTIONABLE_STATUSES = new Set(['pending', 'claimed']);
  const HISTORICAL_STATUSES = new Set(['resolved', 'discarded']);
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
    if (Object.hasOwn(updates, 'status') || Object.hasOwn(updates, 'claim') || Object.hasOwn(updates, 'work_notice')) {
      throw new TypeError('Annotation lifecycle state, Claim, and Work Notice change only through lifecycle operations');
    }
    return { ...updates };
  }

  function assertSaveAllowed(existing, incoming) {
    if (!existing) {
      if (incoming?.status !== 'pending' || Object.hasOwn(incoming, 'claim') || Object.hasOwn(incoming, 'work_notice')) {
        throw new TypeError('New Annotations must start Pending without a Claim or Work Notice');
      }
      return incoming;
    }
    const existingClaim = Object.hasOwn(existing, 'claim') ? JSON.stringify(existing.claim) : null;
    const incomingClaim = Object.hasOwn(incoming, 'claim') ? JSON.stringify(incoming.claim) : null;
    const existingNotice = Object.hasOwn(existing, 'work_notice') ? JSON.stringify(existing.work_notice) : null;
    const incomingNotice = Object.hasOwn(incoming, 'work_notice') ? JSON.stringify(incoming.work_notice) : null;
    if (existing.status !== incoming?.status || existingClaim !== incomingClaim || existingNotice !== incomingNotice) {
      throw new TypeError('Annotation lifecycle state, Claim, and Work Notice change only through lifecycle operations');
    }
    return incoming;
  }

  function assertUpdateAllowed(annotation) {
    if (normalizeStatus(annotation?.status) !== 'pending') {
      throw new TypeError('Only Pending Annotations can be edited');
    }
    return annotation;
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

  function isHistorical(annotation) {
    return HISTORICAL_STATUSES.has(normalizeStatus(annotation?.status));
  }

  function isRenderable(annotation) {
    return isActionable(annotation);
  }

  function filterRenderable(annotations) {
    return normalizeAll(annotations).filter(isRenderable);
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
    assertUpdateAllowed,
    assertFilter,
    countActionable,
    filterActionable,
    filterRenderable,
    isActionable,
    isHistorical,
    isRenderable,
    migrateLegacy,
    migrateLegacyAll,
    normalize,
    normalizeAll,
    normalizeStatus,
    normalizeUpdate,
  };
})();
