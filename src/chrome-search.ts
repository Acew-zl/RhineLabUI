import { directNavigationTarget } from './bookmark-search.ts';
import { openBookmarkDestination, type BookmarkOpenMode } from './bookmark-navigation.ts';

type SearchApi = { query(details: { text: string; disposition: 'CURRENT_TAB' | 'NEW_TAB' }): Promise<void> };

/** Chrome Store build: web queries always follow the browser's default search provider. */
export function submitChromeSearch(
  input: string,
  mode: BookmarkOpenMode,
  api: SearchApi | undefined = (globalThis as typeof globalThis & { chrome?: { search?: SearchApi } }).chrome?.search,
  open: (url: string) => void = openBookmarkDestination,
): Promise<void> {
  const text = input.trim();
  if (!text) return Promise.resolve();
  const direct = directNavigationTarget(text);
  if (direct) { open(direct); return Promise.resolve(); }
  if (!api) return Promise.reject(new Error('浏览器默认搜索功能不可用'));
  try { return Promise.resolve(api.query({ text, disposition: mode === 'new-tab' ? 'NEW_TAB' : 'CURRENT_TAB' })); }
  catch (error) { return Promise.reject(error); }
}
