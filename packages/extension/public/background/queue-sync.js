var WaypointQueueSync = (() => {
  function hasVariantOwnedState(annotation) {
    return Boolean(annotation?.variant_request || annotation?.variant_presentation);
  }

  function withoutSyncFlag(annotation) {
    const { _synced, ...content } = annotation;
    return content;
  }

  function withServerLifecycle(candidate, server) {
    const merged = { ...candidate, status: server.status };
    if (Object.hasOwn(server, 'claim')) merged.claim = server.claim;
    else delete merged.claim;
    if (Object.hasOwn(server, 'resolution_record')) merged.resolution_record = server.resolution_record;
    else delete merged.resolution_record;
    return merged;
  }

  function withPreservedDesignIntent(candidate, local, server, removeDesignIntent = false) {
    if (removeDesignIntent) {
      const withoutDesignIntent = { ...candidate };
      delete withoutDesignIntent.design_intent;
      return withoutDesignIntent;
    }
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
      withServerLifecycle(merged, server),
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
          const merged = withPreservedIntents(withServerLifecycle(local, server), local, server, removeDesignIntent, removeVariantIntent);
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
          const merged = withPreservedIntents(withServerLifecycle(local, server), local, server, removeDesignIntent, removeVariantIntent);
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

  return { merge };
})();
