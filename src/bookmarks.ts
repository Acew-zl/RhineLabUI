import { bookmarkColumns, EMPTY_BAR_GUIDE, type BookmarkNode, type BookmarkExtra } from './bookmark-data';
import { getIncludeOtherBookmarks } from './bookmark-scope';
import { installBookmarkCatalog } from './data';

interface BookmarkEvent { addListener(listener: () => void): void; }
interface BookmarkAPI {
  getTree(): Promise<BookmarkNode[]>;
  onChanged: BookmarkEvent; onCreated: BookmarkEvent; onRemoved: BookmarkEvent;
  onMoved: BookmarkEvent; onChildrenReordered: BookmarkEvent;
}
const host = (globalThis as typeof globalThis & { chrome?: { runtime?: { id?: string; getURL(path: string): string }; bookmarks?: BookmarkAPI } }).chrome;
export let bookmarkStatus = '';
/** Bookmarks outside the displayed columns; the top search still finds them. */
export let bookmarkExtras: BookmarkExtra[] = [];
export const faviconUrl = (pageUrl?: string, size = 32) => {
  if (!pageUrl || !/^https?:/i.test(pageUrl) || !host?.runtime?.id) return undefined;
  const url = new URL(host.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', String(size));
  return url.href;
};

export function faviconSources(pageUrl: string) {
  const candidates = [faviconUrl(pageUrl), faviconUrl(pageUrl, 16)];
  try { candidates.push(faviconUrl(new URL(pageUrl).origin + '/')); } catch { /* Unsupported URL. */ }
  return [...new Set(candidates.filter((value): value is string => !!value))];
}

export async function initializeBookmarks() {
  let tree: BookmarkNode[] = [];
  try {
    if (!host?.bookmarks) {
      if (new URLSearchParams(location.search).get('bookmarks-demo') === '1') {
        tree = (await import('./bookmarks-demo')).demoBookmarks;
        bookmarkStatus = '书签演示数据 · 安装扩展后读取你的书签栏';
      } else throw new Error('需要浏览器书签权限');
    } else tree = await host.bookmarks.getTree();
  } catch {
    bookmarkStatus = '无法读取书签：请在扩展管理页重新加载扩展，并允许书签权限。';
  }
  const catalog = bookmarkColumns(tree, { includeOther: getIncludeOtherBookmarks() });
  bookmarkExtras = catalog.extras;
  installBookmarkCatalog(catalog.records, catalog.columns);
  if (!bookmarkStatus && catalog.records.every(record => record.empty) && !catalog.columns.slice(1).length)
    bookmarkStatus = catalog.extras.length
      ? `书签栏还没有书签；「其他书签」等位置的 ${catalog.extras.length} 个书签可直接搜索，也可在「设置 → 书签显示」中显示为档案列。`
      : EMPTY_BAR_GUIDE;
  if (host?.bookmarks) {
    let pending: ReturnType<typeof setTimeout>;
    const changed = () => {
      clearTimeout(pending);
      pending = setTimeout(() => window.dispatchEvent(new Event('rhine-bookmarks-changed')), 250);
    };
    for (const event of [host.bookmarks.onChanged, host.bookmarks.onCreated, host.bookmarks.onRemoved, host.bookmarks.onMoved, host.bookmarks.onChildrenReordered]) event.addListener(changed);
  }
}
