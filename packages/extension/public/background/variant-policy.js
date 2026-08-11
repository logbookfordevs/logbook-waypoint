globalThis.WaypointVariantPolicy = (() => {
  const ownedFields = ['variant_request', 'variant_presentation'];
  const presentationFields = ['pending_changes', 'css'];

  function hasAny(value, fields) {
    return fields.some(field => field in (value || {}));
  }

  function assertSaveAllowed(current, annotation) {
    if (hasAny(annotation, ownedFields) || (current?.variant_request && hasAny(annotation, presentationFields))) {
      throw new Error('Variant-owned state can only be changed through a Variant operation');
    }
  }

  function assertUpdateAllowed(current, updates) {
    if (hasAny(updates, ownedFields) || (current?.variant_request && hasAny(updates, presentationFields))) {
      throw new Error('Variant-owned state can only be changed through a Variant operation');
    }
    if (
      current?.variant_request?.status === 'unresolved'
      && ['resolved', 'completed'].includes(updates?.status)
    ) {
      throw new Error('An unresolved Variant request cannot become Resolved');
    }
  }

  return { assertSaveAllowed, assertUpdateAllowed };
})();
