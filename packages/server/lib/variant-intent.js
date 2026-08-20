const DEFAULT_VARIANT_COUNT = 3;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertVariantIntent(value) {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'default_count,requested') {
    throw new TypeError('Variant Intent must contain only requested and default_count');
  }
  if (value.requested !== true) {
    throw new TypeError('Variant Intent requested must be true');
  }
  if (value.default_count !== DEFAULT_VARIANT_COUNT) {
    throw new TypeError(`Variant Intent default_count must be ${DEFAULT_VARIANT_COUNT}`);
  }
  return value;
}

export function assertAnnotationVariantIntent(annotation) {
  if (annotation.variant_intent !== undefined) assertVariantIntent(annotation.variant_intent);
  return annotation;
}

export function applyVariantIntentUpdate(annotation, updates) {
  const updated = { ...annotation, ...updates };
  if (Object.hasOwn(updates, 'variant_intent') && updates.variant_intent === null) {
    delete updated.variant_intent;
  }
  return assertAnnotationVariantIntent(updated);
}

export function preserveVariantIntent(existing, incoming) {
  if (existing?.variant_intent !== undefined && !Object.hasOwn(incoming, 'variant_intent')) {
    return assertAnnotationVariantIntent({ ...incoming, variant_intent: existing.variant_intent });
  }
  return assertAnnotationVariantIntent(incoming);
}
