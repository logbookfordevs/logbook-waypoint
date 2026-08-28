var WaypointAnnotationPage = (() => {
  function key(value) {
    try {
      const url = new URL(value);
      return `${url.origin}${url.pathname}`;
    } catch {
      return null;
    }
  }

  function matches(left, right) {
    const leftKey = key(left);
    return leftKey !== null && leftKey === key(right);
  }

  return { key, matches };
})();

globalThis.WaypointAnnotationPage = WaypointAnnotationPage;
