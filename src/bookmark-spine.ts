import { PlaneGeometry } from 'three';

export const SPINE_TEXTURE_WIDTH = 2048;
export const SPINE_TEXTURE_HEIGHT = 128;
/** Upward-facing perimeter rail, above y=3.689, z=-.113.. .197.
 * Keep the decal on the top edge, with no label on the vertical side or front.
 */
export function bookmarkSpineGeometry() {
  return new PlaneGeometry(4.32, .27)
    .rotateX(-Math.PI / 2).translate(0, 3.702, .042);
}
