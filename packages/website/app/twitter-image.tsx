import { createSocialImage, socialImageSize } from '@/lib/social-image';

export const alt = 'Logbook Waypoint — Pin the point. Chart the change.';
export const contentType = 'image/png';
export const size = socialImageSize;

export default function TwitterImage() {
  return createSocialImage();
}
