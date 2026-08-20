globalThis.WaypointVariantPolicy = (() => {
  const ownedFields = ['variant_request', 'variant_presentation'];
  const presentationFields = ['pending_changes', 'css'];
  const workContractFields = ['comment', 'design_intent'];

  function hasAny(value, fields) {
    return fields.some(field => field in (value || {}));
  }

  function assertSaveAllowed(current, annotation) {
    if (hasAny(annotation, ownedFields) || (current?.variant_request && hasAny(annotation, presentationFields))) {
      throw new Error('Variant-owned state can only be changed through a Variant operation');
    }
    if (
      current?.variant_request?.status === 'unresolved'
      && workContractFields.some(field => JSON.stringify(current[field] ?? null) !== JSON.stringify(annotation?.[field] ?? null))
    ) {
      throw new Error('An unresolved Variant request locks the Annotation work contract');
    }
    if (
      current?.variant_request?.status === 'unresolved'
      && annotation?.status === 'resolved'
    ) {
      throw new Error('An unresolved Variant request cannot become Resolved');
    }
  }

  function assertUpdateAllowed(current, updates) {
    if (hasAny(updates, ownedFields) || (current?.variant_request && hasAny(updates, presentationFields))) {
      throw new Error('Variant-owned state can only be changed through a Variant operation');
    }
    if (current?.variant_request?.status === 'unresolved' && hasAny(updates, workContractFields)) {
      throw new Error('An unresolved Variant request locks the Annotation work contract');
    }
    if (
      current?.variant_request?.status === 'unresolved'
      && updates?.status === 'resolved'
    ) {
      throw new Error('An unresolved Variant request cannot become Resolved');
    }
  }

  function assertDeleteAllowed(annotation) {
    if (annotation?.variant_request?.status === 'unresolved') {
      throw new Error('Finalize or discard the unresolved Variant request before deleting its Annotation');
    }
  }

  return { assertDeleteAllowed, assertSaveAllowed, assertUpdateAllowed };
})();
