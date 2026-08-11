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
    return merged;
  }

  function mergeVariantFields(local, server) {
    const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
    const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();
    const merged = { ...(serverTime > localTime ? server : local) };
    const variantOwner = hasVariantOwnedState(server) ? server : local;
    for (const field of ['variant_request', 'variant_presentation', 'pending_changes', 'css']) {
      if (field in variantOwner) merged[field] = variantOwner[field];
      else delete merged[field];
    }
    const lifecycleMerged = withServerLifecycle(merged, server);
    const matchesServer = JSON.stringify(withoutSyncFlag(lifecycleMerged)) === JSON.stringify(withoutSyncFlag(server));
    return { ...lifecycleMerged, _synced: matchesServer };
  }

  function merge(localAnnotations, serverAnnotations, deletedAnnotationIds = []) {
    const deletedIds = new Set(deletedAnnotationIds.filter(WaypointAnnotationId.isValid));
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
        const localOwnsVariant = hasVariantOwnedState(local);
        const serverOwnsVariant = hasVariantOwnedState(server);
        if (localOwnsVariant && !serverOwnsVariant) {
          const merged = withServerLifecycle(local, server);
          annotations.push(merged);
          if (JSON.stringify(merged) !== JSON.stringify(local)) changed = true;
          continue;
        }
        if (localOwnsVariant || serverOwnsVariant) {
          const merged = mergeVariantFields(local, server);
          annotations.push(merged);
          if (JSON.stringify(merged) !== JSON.stringify(local) || !merged._synced) changed = true;
          continue;
        }
        const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
        const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();
        if (serverTime > localTime) {
          annotations.push({ ...server, _synced: true });
          changed = true;
        } else {
          const merged = withServerLifecycle(local, server);
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
