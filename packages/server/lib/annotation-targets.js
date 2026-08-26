const TARGET_KEYS = [
  'selector',
  'viewport',
  'element_context',
  'source_file_path',
  'source_line_range',
  'component_name',
  'project_area',
  'source_map_available',
  'context_hints',
  'source_identity',
  'source_mapping',
  'screenshot',
  'parent_chain',
  'badge_offset',
];

function targetIdentity(target, index) {
  return `${target.selector || `page:${index}`}\u0000${JSON.stringify(target.source_identity ?? null)}`;
}

export function assertAnnotationTargets(annotation) {
  if (!Array.isArray(annotation.targets) || annotation.targets.length < 1 || annotation.targets.length > 8) {
    throw new TypeError('Annotation must include between 1 and 8 Targets');
  }

  const identities = new Set();
  for (const [index, target] of annotation.targets.entries()) {
    if (!target || typeof target !== 'object' || Array.isArray(target)) {
      throw new TypeError('Each Target must be an object');
    }
    if (annotation.targets.length > 1 && (typeof target.selector !== 'string' || target.selector.trim().length === 0)) {
      throw new TypeError('Each Target must include a selector');
    }
    const identity = targetIdentity(target, index);
    if (identities.has(identity)) throw new TypeError('Annotation Targets must be unique');
    identities.add(identity);
  }

  return annotation.targets;
}

export function normalizeAnnotationTargets(annotation) {
  if (Array.isArray(annotation?.targets)) {
    assertAnnotationTargets(annotation);
    return annotation;
  }

  const target = Object.fromEntries(
    TARGET_KEYS.flatMap(key => key in annotation ? [[key, annotation[key]]] : []),
  );
  const normalized = Object.fromEntries(
    Object.entries(annotation).filter(([key]) => !TARGET_KEYS.includes(key)),
  );
  normalized.targets = [target];
  assertAnnotationTargets(normalized);
  return normalized;
}
