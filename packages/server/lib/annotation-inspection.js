import { annotationTargets } from './annotation-summary.js';
import { toReadAnnotation } from './watch-queue.js';

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function withoutEmbeddedContent(value) {
  if (Array.isArray(value)) return value.map(withoutEmbeddedContent);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'data_url')
      .map(([key, nestedValue]) => [key, withoutEmbeddedContent(nestedValue)]),
  );
}

export function inspectAnnotation(annotation) {
  const inspected = withoutEmbeddedContent(toReadAnnotation(annotation));
  const targets = annotationTargets(annotation);
  inspected.targets = targets.map((target, index) => withoutEmbeddedContent({
    ...inspected.targets?.[index],
    ...clone(target),
  }));
  if (inspected.targets.length === 1) Object.assign(inspected, inspected.targets[0]);
  inspected.has_screenshot = Boolean(
    annotation.has_screenshot
    || annotation.screenshot?.data_url
    || annotation.screenshot?.attachment_id
    || targets.some(target => (
      target?.has_screenshot
      || target?.screenshot?.data_url
      || target?.screenshot?.attachment_id
    )),
  );
  inspected.has_attachments = Boolean(annotation.has_attachments || annotation.attachments?.length);
  return inspected;
}
