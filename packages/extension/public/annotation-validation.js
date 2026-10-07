globalThis.WaypointAnnotationValidation = (() => {
  function hasMeaningfulContent(annotation) {
    return typeof annotation.comment === 'string' && annotation.comment.trim().length > 0
      || annotation.pending_changes
        && typeof annotation.pending_changes === 'object'
        && !Array.isArray(annotation.pending_changes)
        && Object.keys(annotation.pending_changes).length > 0
      || typeof annotation.css === 'string' && annotation.css.trim().length > 0
      || typeof annotation.screenshot?.data_url === 'string' && annotation.screenshot.data_url.trim().length > 0
      || typeof annotation.screenshot?.attachment_id === 'string' && annotation.screenshot.attachment_id.trim().length > 0
      || Array.isArray(annotation.attachments) && annotation.attachments.length > 0
      || annotation.has_screenshot === true
      || annotation.has_attachments === true;
  }

  function assertAnnotation(annotation) {
    if (!annotation || typeof annotation !== 'object' || Array.isArray(annotation)) {
      throw new TypeError('Annotation must be an object');
    }
    if (!WaypointAnnotationId.isValid(annotation.id)) throw new TypeError('Invalid Waypoint annotation ID');
    if (typeof annotation.url !== 'string' || annotation.url.trim().length === 0) {
      throw new TypeError('Annotation URL is required');
    }
    try {
      new URL(annotation.url);
    } catch {
      throw new TypeError('Annotation URL must be absolute');
    }
    if (!hasMeaningfulContent(annotation)) {
      throw new TypeError('Annotation must include a comment, visual change, screenshot, or attachment');
    }
    WaypointAnnotationTargets.normalize(annotation);
    WaypointDesignIntent.assertAnnotation(annotation);
    WaypointVariantIntent.assertAnnotation(annotation);
    return annotation;
  }

  function assertAll(annotations) {
    if (!Array.isArray(annotations)) throw new TypeError('Annotations must be an array');
    for (const annotation of annotations) assertAnnotation(annotation);
    return annotations;
  }

  return { assertAll, assertAnnotation, hasMeaningfulContent };
})();
