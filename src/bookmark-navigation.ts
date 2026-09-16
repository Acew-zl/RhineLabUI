import { bookmarkTarget } from './bookmark-data.ts';

export type BookmarkOpenMode = 'new-tab' | 'current-tab';
export const normalizeOpenMode = (value: unknown): BookmarkOpenMode => value === 'current-tab' ? value : 'new-tab';
let openMode: BookmarkOpenMode = 'new-tab';
try { openMode = normalizeOpenMode(localStorage.getItem('rhine-bookmark-open-mode')); } catch { /* Keep the navigation page by default. */ }
export const getBookmarkOpenMode = () => openMode;
export function setBookmarkOpenMode(value: string) {
  openMode = normalizeOpenMode(value);
  try { localStorage.setItem('rhine-bookmark-open-mode', openMode); } catch { /* Session only. */ }
}
type NavigationHost = { open(url: string, target: string, features: string): unknown; location: { assign(url: string): void } };
/** Called synchronously inside the user's click/Enter gesture to allow a new tab. */
export function openBookmarkDestination(value: string, host: NavigationHost = window, mode = openMode) {
  const url = bookmarkTarget(value);
  if (!url) return;
  if (mode === 'current-tab') host.location.assign(url);
  else host.open(url, '_blank', 'noopener,noreferrer');
}
