import { annotationHasScreenshot, targetHasScreenshot } from './annotation-media.js';
import { normalizeAnnotationTargets } from './annotation-targets.js';

function portableAnnotation(annotation, hasScreenshot) {
  annotation = normalizeAnnotationTargets(annotation);
  const {
    screenshot,
    has_screenshot,
    source_file_path,
    source_line_range,
    source_map_available,
    context_hints,
    component_name,
    file_path_hint,
    line_range_hint,
    variant_presentation,
    variant_request,
    pending_changes,
    css,
    resolution_record,
    ...portableFields
  } = annotation;
  const targets = annotation.targets.map((target) => {
    const {
      screenshot: targetScreenshot,
      source_file_path: targetSourceFilePath,
      source_line_range: targetSourceLineRange,
      source_map_available: targetSourceMapAvailable,
      context_hints: targetContextHints,
      component_name: targetComponentName,
      source_identity: targetSourceIdentity,
      source_mapping: targetSourceMapping,
      ...portableTarget
    } = target;
    return {
      ...portableTarget,
      has_screenshot: targetHasScreenshot({ ...target, screenshot: targetScreenshot }),
    };
  });
  const portableVariantRequest = variant_request && {
    status: variant_request.status,
    active_variant_key: variant_request.active_variant_key,
    ...(variant_request.requested_count !== undefined ? { requested_count: variant_request.requested_count } : {}),
    variants: variant_request.variants?.map(({ key, name, state }) => ({ key, name, state })),
  };
  return {
    ...portableFields,
    targets,
    ...(!variant_request && pending_changes !== undefined ? { pending_changes } : {}),
    ...(!variant_request && css !== undefined ? { css } : {}),
    ...(portableVariantRequest ? { variant_request: portableVariantRequest } : {}),
    ...(resolution_record ? { resolution_record: { summary: resolution_record.summary } } : {}),
    has_screenshot: hasScreenshot,
  };
}

function toPortableAnnotation(annotation) {
  const targets = normalizeAnnotationTargets(annotation).targets;
  return portableAnnotation(annotation, annotationHasScreenshot(annotation, targets));
}

export function toReadAnnotation(annotation) {
  const portable = toPortableAnnotation(annotation);
  const withResolutionRecord = annotation.resolution_record
    ? { ...portable, resolution_record: structuredClone(annotation.resolution_record) }
    : portable;
  if (!annotation.variant_request) return withResolutionRecord;
  return {
    ...withResolutionRecord,
    ...(annotation.variant_presentation !== undefined ? { variant_presentation: structuredClone(annotation.variant_presentation) } : {}),
    ...(annotation.pending_changes !== undefined ? { pending_changes: structuredClone(annotation.pending_changes) } : {}),
    ...(annotation.css !== undefined ? { css: annotation.css } : {}),
  };
}
