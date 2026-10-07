globalThis.WaypointAnnotationCollection = (() => {
  function canonicalize(annotations) {
    return WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(annotations))
      .map(WaypointAnnotationTargets.normalize);
  }

  function migrateLegacy(annotations) {
    return WaypointAnnotationStatus.migrateLegacyAll(WaypointAnnotationId.filterValid(annotations))
      .map(WaypointAnnotationTargets.normalize);
  }

  return { canonicalize, migrateLegacy };
})();
