export type ScreenRect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
/** CSS pixels to normalized WebGL coordinates, independent of DPR/stage zoom. */
export function bookmarkQuietZone(rect: ScreenRect, bounds: ScreenRect, padding = 6): [number, number, number, number] {
  if (!bounds.width || !bounds.height || !rect.width || !rect.height || rect.right < bounds.left || rect.left > bounds.right || rect.bottom < bounds.top || rect.top > bounds.bottom) return [2, 2, 2, 2];
  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  return [clamp((rect.left - padding - bounds.left) / bounds.width), clamp(1 - (rect.bottom + padding - bounds.top) / bounds.height),
    clamp((rect.right + padding - bounds.left) / bounds.width), clamp(1 - (rect.top - padding - bounds.top) / bounds.height)];
}
