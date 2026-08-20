import { isValidAnnotationId } from './annotation-id.js';
import { assertAnnotationDesignIntent } from './design-intent.js';
import { assertAnnotationVariantIntent } from './variant-intent.js';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasNonEmptyRecord(value) {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.keys(value).length > 0;
}

function hasScreenshotReferenceOrData(screenshot) {
  return screenshot !== null
    && typeof screenshot === 'object'
    && !Array.isArray(screenshot)
    && (isNonEmptyString(screenshot.attachment_id) || isNonEmptyString(screenshot.data_url));
}

export function isValidAnnotationUrl(value) {
  if (!isNonEmptyString(value)) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function hasMeaningfulAnnotationContent(annotation) {
  return isNonEmptyString(annotation.comment)
    || hasNonEmptyRecord(annotation.pending_changes)
    || isNonEmptyString(annotation.css)
    || hasScreenshotReferenceOrData(annotation.screenshot)
    || Array.isArray(annotation.attachments) && annotation.attachments.length > 0
    || annotation.has_screenshot === true
    || annotation.has_attachments === true;
}

export function assertValidAnnotation(annotation) {
  if (!annotation || typeof annotation !== 'object' || Array.isArray(annotation)) {
    throw new TypeError('Annotation must be an object');
  }
  if (!isValidAnnotationId(annotation.id)) {
    throw new TypeError('Invalid annotation ID');
  }
  if (!isValidAnnotationUrl(annotation.url)) {
    throw new TypeError('Annotation must have a valid URL');
  }
  if (!hasMeaningfulAnnotationContent(annotation)) {
    throw new TypeError('Annotation must have meaningful content');
  }
  assertAnnotationDesignIntent(annotation);
  assertAnnotationVariantIntent(annotation);
}
