/** "daily" plays the full opening on the first new tab of each local day, then the brief one. */
export type BookmarkStartupMode = 'daily' | 'full' | 'brief' | 'direct';
export type OpeningMode = Exclude<BookmarkStartupMode, 'daily'>;
export const normalizeStartupMode = (value: unknown): BookmarkStartupMode =>
  value === 'full' || value === 'brief' || value === 'direct' ? value : 'daily';
const STARTUP_KEY = 'rhine-bookmark-startup';
const DAILY_KEY = 'rhine-bookmark-startup-full-date';
let preference: BookmarkStartupMode = 'daily';
export function reloadBookmarkStartupMode() {
  try { preference = normalizeStartupMode(localStorage.getItem(STARTUP_KEY)); } catch { /* Session defaults. */ }
}
reloadBookmarkStartupMode();
export const getBookmarkStartupMode = () => preference;
export function setBookmarkStartupMode(value: string) {
  preference = normalizeStartupMode(value);
  try { localStorage.setItem(STARTUP_KEY, preference); } catch { /* Session only. */ }
}
const pad = (value: number) => String(value).padStart(2, '0');
export const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export function resolveOpeningMode(mode: BookmarkStartupMode, lastFullDate: string | null, today: string): OpeningMode {
  return mode === 'daily' ? (lastFullDate === today ? 'brief' : 'full') : mode;
}
let dailyFull = false;
/** The opening used by this page; read once when the page starts. */
export function openingModeForPage(now = new Date()): OpeningMode {
  let last: string | null = null;
  try { last = localStorage.getItem(DAILY_KEY); } catch { /* Treat as the first opening today. */ }
  const mode = resolveOpeningMode(preference, last, localDate(now));
  dailyFull = preference === 'daily' && mode === 'full';
  return mode;
}
/** Called once the full opening has been watched or skipped; later tabs today use the brief one. */
export function markDailyOpeningShown(now = new Date()) {
  if (!dailyFull) return;
  dailyFull = false;
  try { localStorage.setItem(DAILY_KEY, localDate(now)); } catch { /* The next page may play it again. */ }
}
/** Brief mode shows the beginning while loading; no mode enters unfinished 3D. */
export function bookmarkStartupReady(mode: BookmarkStartupMode, time: number, ready: boolean) {
  return ready && (mode === 'direct' || (mode === 'brief' && time >= 2.96));
}
