var WaypointQueueSync = (() => {
  function hasVariantOwnedState(annotation) {
    return Boolean(annotation?.variant_request || annotation?.variant_presentation);
  }

  function withoutSyncFlag(annotation) {
    const { _synced, ...content } = annotation;
    return content;
  }

  function pendingIds(localAnnotations, serverAnnotations, ...removalLists) {
    const local = WaypointAnnotationCollection.canonicalize(localAnnotations);
    const serverMap = new Map(
      WaypointAnnotationCollection.canonicalize(serverAnnotations)
        .map(annotation => [annotation.id, annotation]),
    );
    const pending = new Set();

    for (const annotation of local) {
      const server = serverMap.get(annotation.id);
      if (
        annotation.status === 'pending'
        && (
          !server
          || annotation._synced === false
        )
      ) {
        pending.add(annotation.id);
      }
    }

    for (const removals of removalLists) {
      for (const id of removals || []) {
        if (WaypointAnnotationId.isValid(id)) pending.add(id);
      }
    }

    return pending;
  }

  function annotationOrigin(annotation) {
    try {
      return new URL(annotation.url).origin;
    } catch {
      return null;
    }
  }

  function pendingIdsForOrigin(localAnnotations, serverAnnotations, origin, ...removalLists) {
    const local = WaypointAnnotationCollection.canonicalize(localAnnotations)
      .filter(annotation => annotationOrigin(annotation) === origin);
    const server = WaypointAnnotationCollection.canonicalize(serverAnnotations)
      .filter(annotation => annotationOrigin(annotation) === origin);
    const scopedIds = new Set([...local, ...server].map(annotation => annotation.id));
    const scopedRemovals = removalLists.map(removals => (
      (removals || []).filter(id => scopedIds.has(id))
    ));
    return pendingIds(local, server, ...scopedRemovals);
  }

  function applyLifecycleFields(candidate, source) {
    const merged = { ...candidate, status: source.status };
    if (Object.hasOwn(source, 'claim')) merged.claim = source.claim;
    else delete merged.claim;
    if (Object.hasOwn(source, 'work_notice')) merged.work_notice = source.work_notice;
    else delete merged.work_notice;
    if (source.status !== 'pending') {
      merged.comment = source.comment;
      if (Object.hasOwn(source, 'design_intent')) merged.design_intent = source.design_intent;
      else delete merged.design_intent;
    }
    if (Object.hasOwn(source, 'resolution_record')) merged.resolution_record = source.resolution_record;
    else delete merged.resolution_record;
    return merged;
  }

  function annotationTime(annotation) {
    return new Date(annotation.updated_at || annotation.created_at || 0).getTime();
  }

  function reconcileLifecycleFields(candidate, server, local = candidate) {
    const localTime = annotationTime(local);
    const serverTime = annotationTime(server);
    const source = local._synced && localTime > serverTime ? local : server;
    return applyLifecycleFields(candidate, source);
  }

  function applyServerLifecycle(local, server) {
    const localTime = annotationTime(local);
    const serverTime = annotationTime(server);
    return {
      ...applyLifecycleFields(local, server),
      updated_at: localTime > serverTime ? local.updated_at : server.updated_at,
      _synced: true,
    };
  }

  function withPreservedDesignIntent(candidate, local, server, removeDesignIntent = false) {
    if (removeDesignIntent) {
      const withoutDesignIntent = { ...candidate };
      delete withoutDesignIntent.design_intent;
      return withoutDesignIntent;
    }
    if (candidate.status !== 'pending') return candidate;
    return WaypointDesignIntent.preserve(server, WaypointDesignIntent.preserve(local, candidate));
  }

  function withPreservedVariantIntent(candidate, local, server, removeVariantIntent = false) {
    if (removeVariantIntent) {
      const withoutVariantIntent = { ...candidate };
      delete withoutVariantIntent.variant_intent;
      return withoutVariantIntent;
    }
    return WaypointVariantIntent.preserve(server, WaypointVariantIntent.preserve(local, candidate));
  }

  function withPreservedIntents(candidate, local, server, removeDesignIntent, removeVariantIntent) {
    return withPreservedVariantIntent(
      withPreservedDesignIntent(candidate, local, server, removeDesignIntent),
      local,
      server,
      removeVariantIntent,
    );
  }

  function mergeVariantFields(local, server, removeDesignIntent, removeVariantIntent) {
    const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
    const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();
    const merged = { ...(serverTime > localTime ? server : local) };
    const variantOwner = hasVariantOwnedState(server) ? server : local;
    for (const field of ['variant_request', 'variant_presentation', 'pending_changes', 'css']) {
      if (field in variantOwner) merged[field] = variantOwner[field];
      else delete merged[field];
    }
    const lifecycleMerged = withPreservedIntents(
      reconcileLifecycleFields(merged, server, local),
      local,
      server,
      removeDesignIntent,
      removeVariantIntent,
    );
    const matchesServer = JSON.stringify(withoutSyncFlag(lifecycleMerged)) === JSON.stringify(withoutSyncFlag(server));
    return { ...lifecycleMerged, _synced: matchesServer };
  }

  function merge(localAnnotations, serverAnnotations, deletedAnnotationIds = [], removedDesignIntentIds = [], removedVariantIntentIds = []) {
    const deletedIds = new Set(deletedAnnotationIds.filter(WaypointAnnotationId.isValid));
    const designIntentRemovals = new Set(removedDesignIntentIds.filter(WaypointAnnotationId.isValid));
    const variantIntentRemovals = new Set(removedVariantIntentIds.filter(WaypointAnnotationId.isValid));
    const localMap = new Map(WaypointAnnotationCollection.canonicalize(localAnnotations).map(annotation => [annotation.id, annotation]));
    const serverMap = new Map(WaypointAnnotationCollection.canonicalize(serverAnnotations).map(annotation => [annotation.id, annotation]));
    const allIds = new Set([...localMap.keys(), ...serverMap.keys()]);
    const annotations = [];
    let changed = false;
    let flagsChanged = false;

    for (const id of allIds) {
      if (deletedIds.has(id)) {
        if (serverMap.has(id)) changed = true;
        continue;
      }

      const local = localMap.get(id);
      const server = serverMap.get(id);
      if (local && server) {
        const removeDesignIntent = designIntentRemovals.has(id);
        const removeVariantIntent = variantIntentRemovals.has(id);
        if (removeDesignIntent && server.design_intent !== undefined) changed = true;
        if (removeVariantIntent && server.variant_intent !== undefined) changed = true;
        const localOwnsVariant = hasVariantOwnedState(local);
        const serverOwnsVariant = hasVariantOwnedState(server);
        if (localOwnsVariant && !serverOwnsVariant) {
          const merged = withPreservedIntents(reconcileLifecycleFields(local, server, local), local, server, removeDesignIntent, removeVariantIntent);
          annotations.push(merged);
          if (JSON.stringify(merged) !== JSON.stringify(local)) changed = true;
          continue;
        }
        if (localOwnsVariant || serverOwnsVariant) {
          const merged = mergeVariantFields(local, server, removeDesignIntent, removeVariantIntent);
          annotations.push(merged);
          if (JSON.stringify(merged) !== JSON.stringify(local) || !merged._synced) changed = true;
          continue;
        }
        const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
        const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();
        if (serverTime > localTime) {
          annotations.push({
            ...withPreservedIntents(server, local, server, removeDesignIntent, removeVariantIntent),
            _synced: !removeDesignIntent && !removeVariantIntent,
          });
          changed = true;
        } else {
          const merged = withPreservedIntents(reconcileLifecycleFields(local, server, local), local, server, removeDesignIntent, removeVariantIntent);
          const matchesServer = JSON.stringify(withoutSyncFlag(merged)) === JSON.stringify(withoutSyncFlag(server));
          if (!matchesServer) flagsChanged = true;
          annotations.push({ ...merged, _synced: matchesServer });
          if (localTime > serverTime || JSON.stringify(merged) !== JSON.stringify(local)) changed = true;
        }
      } else if (local) {
        if (local._synced && local.status === 'pending') {
          changed = true;
        } else {
          annotations.push(local);
          if (!local._synced) changed = true;
        }
      } else if (server) {
        annotations.push({ ...server, _synced: true });
        changed = true;
      }
    }

    return { annotations, changed, flagsChanged };
  }

  return { applyServerLifecycle, merge, pendingIds, pendingIdsForOrigin };
})();
