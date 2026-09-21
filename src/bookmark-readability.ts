/** Keep one readable cycle around the continuous browsing position. Adjacent
 * copies crossfade at cycle boundaries instead of popping when selection flips. */
export function cycleLabelOpacity(distance: number, period: number) {
  const edge = Math.max(1, period) / 2;
  const blend = Math.min(.45, edge * .4);
  const t = Math.max(0, Math.min(1, (Math.abs(distance) - edge + blend) / (2 * blend)));
  return 1 - t * t * (3 - 2 * t);
}

/** Add six degrees of top visibility without changing model size or position. */
export const BOOKMARK_READING_ELEVATION = 6 * Math.PI / 180;
