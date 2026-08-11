import { createAnnotationId, isValidAnnotationId } from '@logbookfordevs/waypoint/annotation-id';
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';

function filterValidAnnotations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter(annotation => {
    if (!annotation || typeof annotation !== 'object') return false;
    return isValidAnnotationId(Reflect.get(annotation, 'id'));
  });
}

export default defineUnlistedScript(() => {
  Object.defineProperty(globalThis, 'WaypointAnnotationId', {
    value: Object.freeze({
      create: createAnnotationId,
      isValid: isValidAnnotationId,
      filterValid: filterValidAnnotations,
    }),
  });
});
