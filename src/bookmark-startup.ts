export type BookmarkStartupMode = 'full' | 'brief' | 'direct';
export const normalizeStartupMode = (value: unknown): BookmarkStartupMode => value === 'brief' || value === 'direct' ? value : 'full';
let preference: BookmarkStartupMode = 'full';
try { preference = normalizeStartupMode(localStorage.getItem('rhine-bookmark-startup')); } catch { /* Session defaults. */ }
export const getBookmarkStartupMode = () => preference;
export function setBookmarkStartupMode(value: string) {
  preference = normalizeStartupMode(value);
  try { localStorage.setItem('rhine-bookmark-startup', preference); } catch { /* Session only. */ }
}
/** Brief mode shows the beginning while loading; no mode enters unfinished 3D. */
export function bookmarkStartupReady(mode: BookmarkStartupMode, time: number, ready: boolean) {
  return ready && (mode === 'direct' || (mode === 'brief' && time >= 2.96));
}
