export const ANNOTATION_ID_PREFIX = 'waypoint_';

const ANNOTATION_ID_PATTERN = /^waypoint_[0-9]{10,16}_[a-z0-9]{6,32}$/;

function randomSegment() {
  const bytes = new Uint8Array(8);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, byte => byte.toString(36).padStart(2, '0')).join('');
}

export function createAnnotationId() {
  return `${ANNOTATION_ID_PREFIX}${Date.now()}_${randomSegment()}`;
}

export function isValidAnnotationId(value) {
  return typeof value === 'string' && ANNOTATION_ID_PATTERN.test(value);
}
