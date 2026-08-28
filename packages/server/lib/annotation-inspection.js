import { annotationHasScreenshot } from './annotation-media.js';
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
  inspected.has_screenshot = annotationHasScreenshot(annotation, targets);
  inspected.has_attachments = Boolean(annotation.has_attachments || annotation.attachments?.length);
  return inspected;
}
