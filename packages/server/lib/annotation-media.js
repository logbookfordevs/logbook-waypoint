export function targetHasScreenshot(target) {
  return Boolean(
    target?.has_screenshot
    || target?.screenshot?.data_url
    || target?.screenshot?.attachment_id,
  );
}

export function annotationHasScreenshot(annotation, targets = []) {
  return Boolean(
    annotation?.has_screenshot
    || annotation?.screenshot?.data_url
    || annotation?.screenshot?.attachment_id
    || targets.some(targetHasScreenshot),
  );
}
