import { bookmarkColumns, type BookmarkNode } from './bookmark-data';
import { installBookmarkCatalog } from './data';

interface BookmarkEvent { addListener(listener: () => void): void; }
interface BookmarkAPI {
  getTree(): Promise<BookmarkNode[]>;
  onChanged: BookmarkEvent; onCreated: BookmarkEvent; onRemoved: BookmarkEvent;
  onMoved: BookmarkEvent; onChildrenReordered: BookmarkEvent;
}
const host = (globalThis as typeof globalThis & { chrome?: { runtime?: { id?: string; getURL(path: string): string }; bookmarks?: BookmarkAPI } }).chrome;
export let bookmarkStatus = '';
export const faviconUrl = (pageUrl?: string) => {
  if (!pageUrl || !/^https?:/i.test(pageUrl) || !host?.runtime?.id) return undefined;
  const url = new URL(host.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', pageUrl);
  url.searchParams.set('size', '64');
  return url.href;
};

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
  const catalog = bookmarkColumns(tree);
  installBookmarkCatalog(catalog.records, catalog.columns);
  if (host?.bookmarks) {
    let pending: ReturnType<typeof setTimeout>;
    const changed = () => {
      clearTimeout(pending);
      pending = setTimeout(() => window.dispatchEvent(new Event('rhine-bookmarks-changed')), 250);
    };
    for (const event of [host.bookmarks.onChanged, host.bookmarks.onCreated, host.bookmarks.onRemoved, host.bookmarks.onMoved, host.bookmarks.onChildrenReordered]) event.addListener(changed);
  }
}
