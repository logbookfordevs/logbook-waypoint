globalThis.WaypointAnnotationCollection = (() => {
  function canonicalize(annotations) {
    return WaypointAnnotationStatus.normalizeAll(WaypointAnnotationId.filterValid(annotations));
  }

  function migrateLegacy(annotations) {
    return WaypointAnnotationStatus.migrateLegacyAll(WaypointAnnotationId.filterValid(annotations));
  }

  return { canonicalize, migrateLegacy };
})();
