(() => {
  const DEFAULT_STALE_AFTER_DAYS = 30;
  const DAY_MS = 86400000;

  function activityAt(annotation) {
    const timestamp = Date.parse(annotation?.updated_at || annotation?.created_at || '');
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  function isOlderThan(annotation, cutoff) {
    const timestamp = activityAt(annotation);
    return timestamp !== null && timestamp <= cutoff;
  }

  function originFor(annotation) {
    try {
      return new URL(annotation.url).origin;
    } catch {
      return null;
    }
  }

  function summarize(annotations, { now = Date.now(), staleAfterDays = DEFAULT_STALE_AFTER_DAYS } = {}) {
    const collection = Array.isArray(annotations) ? annotations : [];
    const cutoff = now - staleAfterDays * DAY_MS;
    const origins = new Set();
    let oldPendingCount = 0;
    let cleanupCandidateCount = 0;
    let oldestActivity = null;

    for (const annotation of collection) {
      const origin = originFor(annotation);
      if (origin) origins.add(origin);
      const timestamp = activityAt(annotation);
      if (timestamp !== null && (oldestActivity === null || timestamp < oldestActivity)) oldestActivity = timestamp;
      if (!isOlderThan(annotation, cutoff)) continue;
      if (annotation.status === 'pending') oldPendingCount += 1;
      if (annotation.status === 'resolved' || annotation.status === 'discarded') cleanupCandidateCount += 1;
    }

    return {
      project_count: origins.size,
      annotation_count: collection.length,
      old_pending_count: oldPendingCount,
      cleanup_candidate_count: cleanupCandidateCount,
      review_count: oldPendingCount + cleanupCandidateCount,
      oldest_activity_at: oldestActivity === null ? null : new Date(oldestActivity).toISOString(),
      stale_after_days: staleAfterDays,
    };
  }

  function snapshot(annotations, options = {}) {
    const collection = Array.isArray(annotations) ? annotations : [];
    const projects = new Map();

    for (const annotation of collection) {
      const origin = originFor(annotation);
      if (!origin) continue;
      const projectAnnotations = projects.get(origin) || [];
      projectAnnotations.push(annotation);
      projects.set(origin, projectAnnotations);
    }

    return {
      summary: summarize(collection, options),
      projects: [...projects].map(([origin, projectAnnotations]) => {
        const projectSummary = summarize(projectAnnotations, options);
        const routes = new Set(projectAnnotations.map(annotation => {
          try {
            const url = new URL(annotation.url);
            return `${url.pathname}${url.search}${url.hash}`;
          } catch {
            return annotation.url;
          }
        }));
        const counts = { pending: 0, claimed: 0, resolved: 0, discarded: 0 };
        for (const annotation of projectAnnotations) {
          if (Object.hasOwn(counts, annotation.status)) counts[annotation.status] += 1;
        }
        const latestActivity = projectAnnotations.reduce((latest, annotation) => {
          const timestamp = activityAt(annotation);
          return timestamp !== null && (latest === null || timestamp > latest) ? timestamp : latest;
        }, null);
        return {
          origin,
          annotation_count: projectAnnotations.length,
          route_count: routes.size,
          status_counts: counts,
          old_pending_count: projectSummary.old_pending_count,
          cleanup_candidate_count: projectSummary.cleanup_candidate_count,
          last_activity_at: latestActivity === null ? null : new Date(latestActivity).toISOString(),
          approximate_bytes: JSON.stringify(projectAnnotations).length,
        };
      }),
    };
  }

  function selectIds(annotations, selection, { now = Date.now(), staleAfterDays = DEFAULT_STALE_AFTER_DAYS } = {}) {
    const collection = Array.isArray(annotations) ? annotations : [];
    const cutoff = now - staleAfterDays * DAY_MS;
    if (selection?.scope === 'all') return collection.map(annotation => annotation.id);
    if (selection?.scope === 'project') {
      return collection
        .filter(annotation => originFor(annotation) === selection.origin)
        .map(annotation => annotation.id);
    }
    if (selection?.scope === 'old_history') {
      return collection
        .filter(annotation => ['resolved', 'discarded'].includes(annotation.status) && isOlderThan(annotation, cutoff))
        .map(annotation => annotation.id);
    }
    throw new TypeError('Unknown Data & Storage selection scope');
  }

  globalThis.WaypointDataManagement = {
    selectIds,
    snapshot,
    summarize,
  };
})();
