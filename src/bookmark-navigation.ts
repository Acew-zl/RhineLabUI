import { bookmarkTarget } from './bookmark-data.ts';

export type BookmarkOpenMode = 'new-tab' | 'current-tab';
export const normalizeOpenMode = (value: unknown): BookmarkOpenMode => value === 'current-tab' ? value : 'new-tab';
const OPEN_MODE_KEY = 'rhine-bookmark-open-mode';
let openMode: BookmarkOpenMode = 'new-tab';
export function reloadBookmarkOpenMode() {
  try { openMode = normalizeOpenMode(localStorage.getItem(OPEN_MODE_KEY)); } catch { /* Keep the navigation page by default. */ }
}
reloadBookmarkOpenMode();
export const getBookmarkOpenMode = () => openMode;
export function setBookmarkOpenMode(value: string) {
  openMode = normalizeOpenMode(value);
  try { localStorage.setItem(OPEN_MODE_KEY, openMode); } catch { /* Session only. */ }
}
type TabsApi = {
  create(properties: { url: string; active?: boolean; index?: number; openerTabId?: number }): Promise<{ id?: number } | undefined>;
  update(tabId: number, properties: { url?: string; active?: boolean }): Promise<unknown>;
  getCurrent(): Promise<{ id?: number; index?: number } | undefined>;
};
export type NavigationHost = {
  open(url: string, target: string, features: string): unknown;
  location: { assign(url: string): void };
  /** Extension tab API; pages cannot navigate to browser pages (chrome://) or local files. */
  tabs?: TabsApi;
  fileAccess?: () => Promise<boolean>;
};
let notice: (message: string) => void = () => {};
export function setNavigationNotice(listener: (message: string) => void) { notice = listener; }
export function browserHost(): NavigationHost {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: { tabs?: TabsApi; extension?: { isAllowedFileSchemeAccess?(): Promise<boolean> } } }).chrome;
  const allowed = chromeApi?.extension?.isAllowedFileSchemeAccess;
  return {
    open: (url, target, features) => window.open(url, target, features),
    location: window.location,
    tabs: chromeApi?.tabs?.create ? chromeApi.tabs : undefined,
    fileAccess: allowed ? () => allowed.call(chromeApi!.extension) : undefined,
  };
}
/** Native link gestures; macOS Ctrl-click remains a context-menu gesture. */
export function backgroundBookmarkGesture(event: { button: number; ctrlKey: boolean; metaKey: boolean; shiftKey?: boolean; altKey?: boolean }, mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)) {
  return event.button === 1 || (event.button === 0 && !event.shiftKey && !event.altKey && (mac ? event.metaKey : event.ctrlKey));
}
/** Starts loading now, without taking focus away from the navigation page. */
export async function openBookmarkInBackground(value: string, host: NavigationHost = browserHost()) {
  const url = bookmarkTarget(value);
  if (!url) return;
  if (!host.tabs) {
    // A normal web preview cannot choose a background tab. Keep its synchronous
    // click path instead of delaying window.open until popup activation is lost.
    openBookmarkDestination(url, host, 'new-tab');
    return;
  }
  try {
    if (url.startsWith('file:') && host.fileAccess && !(await host.fileAccess())) {
      notice('打开本地文件需要在扩展详情页开启「允许访问文件网址」。');
      return;
    }
    const current = await host.tabs.getCurrent().catch(() => undefined);
    const tab = await host.tabs.create({ url, active: false,
      ...(current?.index !== undefined ? { index: current.index + 1 } : {}),
      ...(current?.id !== undefined ? { openerTabId: current.id } : {}),
    });
    if (tab?.id === undefined) return;
    return { activate: async () => {
      try { await host.tabs!.update(tab.id!, { active: true }); }
      catch { notice('目标标签页已关闭或无法切换，请重新打开书签。'); }
    } };
  } catch { notice('浏览器不允许打开此地址，可复制网址后在地址栏打开。'); }
}
async function openBrowserPage(url: string, host: NavigationHost & { tabs: TabsApi }, mode: BookmarkOpenMode) {
  try {
    if (url.startsWith('file:') && host.fileAccess && !(await host.fileAccess())) {
      notice('打开本地文件需要在扩展详情页开启「允许访问文件网址」。');
      return;
    }
    const current = await host.tabs.getCurrent().catch(() => undefined);
    if (mode === 'current-tab' && current?.id !== undefined) await host.tabs.update(current.id, { url });
    else await host.tabs.create({
      url,
      ...(current?.index !== undefined ? { index: current.index + 1 } : {}),
      ...(current?.id !== undefined ? { openerTabId: current.id } : {}),
    });
  } catch {
    notice('浏览器不允许从起始页打开此地址，可复制网址后在地址栏打开。');
  }
}
/** Web pages open synchronously inside the user's click/Enter gesture to allow a new tab. */
export function openBookmarkDestination(value: string, host: NavigationHost = browserHost(), mode = openMode): Promise<void> | void {
  const url = bookmarkTarget(value);
  if (!url) return;
  const web = /^https?:/i.test(url);
  if (!web && host.tabs) return openBrowserPage(url, { ...host, tabs: host.tabs }, mode);
  if (/^(?:chrome|edge|file):/i.test(url)) notice('网页预览无法打开浏览器内部页面或本地文件；请在已安装的扩展中使用。');
  if (mode === 'current-tab') host.location.assign(url);
  else host.open(url, '_blank', 'noopener,noreferrer');
}
