const VARIANT_KEY = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/;

export class VariantContractError extends Error {
  constructor(message, remainingCleanup = []) {
    super(message);
    this.name = 'VariantContractError';
    this.remaining_cleanup = remainingCleanup;
  }
}

function fail(message, remainingCleanup) {
  throw new VariantContractError(message, remainingCleanup);
}

function clone(annotation) {
  return structuredClone(annotation);
}

function unique(values) {
  return [...new Set(values)];
}

function validateCandidates(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) fail('A variant request requires at least one Variant');

  const keys = candidates.map(candidate => candidate?.key);
  const names = candidates.map(candidate => candidate?.name?.trim());
  if (keys.some(key => typeof key !== 'string' || !VARIANT_KEY.test(key))) fail('Every Variant requires a stable implementation key');
  if (names.some(name => !name)) fail('Every Variant requires a human-readable name');
  if (candidates.some(candidate => !candidate.implementation || typeof candidate.implementation !== 'object' || Array.isArray(candidate.implementation))) {
    fail('Every Variant requires an implementation object');
  }
  if (candidates.some(candidate => candidate.scaffold !== undefined && (!Array.isArray(candidate.scaffold) || candidate.scaffold.some(key => typeof key !== 'string' || !key)))) {
    fail('Variant Scaffold keys must be non-empty strings');
  }
  const normalizedNames = names.map(name => name.toLocaleLowerCase());
  if (new Set(keys).size !== keys.length || new Set(normalizedNames).size !== normalizedNames.length) fail('Variant keys and names must be unique within the request');
}

function requireUnresolved(annotation) {
  const request = annotation?.variant_request;
  if (!request || request.status !== 'unresolved') fail('Annotation does not have an unresolved Variant request');
  return request;
}

function requireVariant(request, key) {
  const variant = request.variants.find(candidate => candidate.key === key);
  if (!variant) fail(`Variant implementation key could not be reconciled: ${key}`);
  return variant;
}

function assertSingleActive(request) {
  if (request.variants.length > 0 && request.variants.filter(variant => variant.state === 'active').length !== 1) {
    fail('Exactly one Variant must be Active while unresolved Variants exist');
  }
}

function present(annotation, variant) {
  annotation.variant_presentation = clone(variant.implementation);
  for (const field of ['pending_changes', 'css']) {
    if (field in variant.implementation) annotation[field] = clone(variant.implementation[field]);
    else delete annotation[field];
  }
  return annotation;
}

export function createVariantRequest(annotation, candidates) {
  if (!annotation?.id) fail('A variant request requires an Annotation');
  if (annotation.variant_request) fail('Annotation already has explicit Variant state');
  validateCandidates(candidates);

  const next = clone(annotation);
  next.variant_request = {
    status: 'unresolved',
    active_variant_key: candidates[0].key,
    variants: candidates.map((candidate, index) => ({
      key: candidate.key,
      name: candidate.name.trim(),
      state: index === 0 ? 'active' : 'inactive',
      implementation: clone(candidate.implementation ?? {}),
      scaffold: unique(candidate.scaffold ?? []),
    })),
    scaffold: unique(candidates.flatMap(candidate => candidate.scaffold ?? [])),
  };
  return present(next, next.variant_request.variants[0]);
}

export function addVariant(annotation, candidate) {
  const request = requireUnresolved(annotation);
  validateCandidates([...request.variants, candidate]);
  const next = clone(annotation);
  next.variant_request.variants.push({
    key: candidate.key,
    name: candidate.name.trim(),
    state: 'inactive',
    implementation: clone(candidate.implementation ?? {}),
    scaffold: unique(candidate.scaffold ?? []),
  });
  next.variant_request.scaffold = unique([...next.variant_request.scaffold, ...(candidate.scaffold ?? [])]);
  assertSingleActive(next.variant_request);
  return next;
}

export function activateVariant(annotation, key) {
  const request = requireUnresolved(annotation);
  requireVariant(request, key);
  const next = clone(annotation);
  next.variant_request.active_variant_key = key;
  next.variant_request.variants = next.variant_request.variants.map(variant => ({
    ...variant,
    state: variant.key === key ? 'active' : 'inactive',
  }));
  assertSingleActive(next.variant_request);
  return present(next, requireVariant(next.variant_request, key));
}

async function removeCleanup(operations, targets) {
  if (!operations?.remove) fail('Variant Scaffold operations are unavailable', targets);
  let result;
  try {
    result = await operations.remove(targets);
  } catch (error) {
    fail(`Variant cleanup failed: ${error.message}`, targets);
  }
  const remaining = unique(result?.remaining ?? targets);
  if (remaining.length > 0) fail('Variant cleanup is incomplete', remaining);
}

export async function discardVariant(annotation, key, operations) {
  const request = requireUnresolved(annotation);
  const discarded = requireVariant(request, key);
  if (discarded.state === 'active') fail('Activate another surviving Variant before discarding the Active Variant');

  const survivors = request.variants.filter(variant => variant.key !== key);
  const survivorScaffold = new Set(survivors.flatMap(variant => variant.scaffold));
  const exclusiveScaffold = discarded.scaffold.filter(scaffoldKey => !survivorScaffold.has(scaffoldKey));
  await removeCleanup(operations, [`implementation:${key}`, ...exclusiveScaffold]);

  const next = clone(annotation);
  next.variant_request.variants = next.variant_request.variants.filter(variant => variant.key !== key);
  next.variant_request.scaffold = next.variant_request.scaffold.filter(scaffoldKey => !exclusiveScaffold.includes(scaffoldKey));
  assertSingleActive(next.variant_request);
  return next;
}

export async function finalizeVariant(annotation, key, operations) {
  const request = requireUnresolved(annotation);
  const chosen = requireVariant(request, key);
  const discardedImplementationKeys = request.variants
    .filter(variant => variant.key !== key)
    .map(variant => `implementation:${variant.key}`);
  await removeCleanup(operations, [...discardedImplementationKeys, ...request.scaffold]);

  const next = clone(annotation);
  next.variant_request = {
    status: 'finalized',
    active_variant_key: key,
    variants: [{ ...clone(chosen), state: 'active', scaffold: [] }],
    scaffold: [],
  };
  return present(next, next.variant_request.variants[0]);
}

export function assertAnnotationResolvable(annotation) {
  const request = annotation?.variant_request;
  if (!request) return;
  if (request.status !== 'finalized') fail('Variant request must be finalized before the Annotation can be Resolved');
  if (request.scaffold?.length || request.variants?.some(variant => variant.scaffold?.length)) {
    fail('Annotation cannot be Resolved while Variant Scaffold remains', request.scaffold ?? []);
  }
}
