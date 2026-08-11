globalThis.WaypointVariantErrors = (() => {
  function formatRemainingCleanup(remaining) {
    return (remaining || []).map(target => {
      if (typeof target === 'string') return target;
      return `${target.kind}:${target.key}`;
    }).join(', ');
  }

  return { formatRemainingCleanup };
})();
