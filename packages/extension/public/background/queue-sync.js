var VibeQueueSync = (() => {
  function hasVariantOwnedState(annotation) {
    return Boolean(annotation?.variant_request || annotation?.variant_presentation);
  }

  function merge(localAnnotations, serverAnnotations, deletedAnnotationIds = []) {
    const deletedIds = new Set(deletedAnnotationIds);
    const localMap = new Map(localAnnotations.map(annotation => [annotation.id, annotation]));
    const serverMap = new Map(serverAnnotations.map(annotation => [annotation.id, annotation]));
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
          annotations.push(local);
          continue;
        }
        if (serverOwnsVariant) {
          annotations.push({ ...server, _synced: true });
          if (!localOwnsVariant || JSON.stringify(local) !== JSON.stringify(server)) changed = true;
          continue;
        }
        const localTime = new Date(local.updated_at || local.created_at || 0).getTime();
        const serverTime = new Date(server.updated_at || server.created_at || 0).getTime();
        if (serverTime > localTime) {
          annotations.push({ ...server, _synced: true });
          changed = true;
        } else {
          if (!local._synced) flagsChanged = true;
          annotations.push({ ...local, _synced: true });
          if (localTime > serverTime) changed = true;
        }
      } else if (local) {
        if (local._synced) {
          changed = true;
        } else {
          annotations.push(local);
          changed = true;
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
