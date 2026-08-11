import { createAnnotationId, isValidAnnotationId } from '@logbookfordevs/waypoint/annotation-id';
import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';

export default defineUnlistedScript(() => {
  Object.defineProperty(globalThis, 'WaypointAnnotationId', {
    value: Object.freeze({
      create: createAnnotationId,
      isValid: isValidAnnotationId,
    }),
  });
});
