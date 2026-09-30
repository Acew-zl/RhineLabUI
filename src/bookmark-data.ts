import type { ArchiveRecord } from './data.ts';

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  folderType?: string;
  children?: BookmarkNode[];
}

/** The archive's body may show a URL; the spine always retains the raw title. */
export function bookmarkDisplayTitle(record: Pick<ArchiveRecord, 'title' | 'bookmarkUrl'> & { abstract?: string }) {
  return record.title.trim() ? record.title : record.bookmarkUrl || record.abstract || '';
}

export function bookmarkTarget(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'file:', 'ftp:', 'chrome:', 'edge:', 'about:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

/** Search-only bookmark outside the displayed columns (for example "Other bookmarks"). */
export interface BookmarkExtra { title: string; bookmarkUrl: string; bookmarkFolder: string; bookmarkId: string }
const folderName = (node: BookmarkNode) => node.title || '未命名文件夹';
const rootName = (node: BookmarkNode) => node.title.trim() || (node.folderType === 'mobile' || node.id === '3' ? '移动设备书签' : '其他书签');
export const EMPTY_BAR_GUIDE = '书签栏还没有书签。在网页上按 Ctrl+D（Mac 为 ⌘D）并选择保存到「书签栏」，新建标签页即可显示。';
/**
 * The bookmarks bar becomes columns: its loose bookmarks first, then one column per
 * top-level folder. `includeOther` adds the other permanent folders the same way;
 * otherwise their bookmarks remain searchable through `extras`.
 */
export function bookmarkColumns(tree: BookmarkNode[], { includeOther = false } = {}) {
  const roots = tree.flatMap(node => node.children ?? []);
  // Modern Chromium identifies permanent roots by type; older versions use 1.
  const bars = roots.filter(node => node.folderType === 'bookmarks-bar');
  const selected = bars.length ? bars : roots.filter(node => node.id === '1');
  const others = roots.filter(node => !selected.includes(node));
  const children = selected.flatMap(node => node.children ?? []);
  const groups: { name: string; id: string; items: { node: BookmarkNode; path: string }[] }[] = [
    { name: '书签栏', id: 'bar', items: children.filter(node => node.url !== undefined).map(node => ({ node, path: '书签栏' })) },
  ];
  function collect(node: BookmarkNode, path: string): { node: BookmarkNode; path: string }[] {
    return (node.children ?? []).flatMap(child => child.url !== undefined ? [{ node: child, path }] : collect(child, `${path} / ${folderName(child)}`));
  }
  for (const folder of children.filter(node => node.url === undefined))
    groups.push({ name: folderName(folder), id: folder.id, items: collect(folder, folderName(folder)) });
  if (includeOther) for (const root of others) {
    const name = rootName(root);
    const loose = (root.children ?? []).filter(node => node.url !== undefined);
    if (loose.length) groups.push({ name, id: root.id, items: loose.map(node => ({ node, path: name })) });
    for (const folder of (root.children ?? []).filter(node => node.url === undefined))
      groups.push({ name: folderName(folder), id: folder.id, items: collect(folder, `${name} / ${folderName(folder)}`) });
  }
  // A bar holding only folders would otherwise open on an empty placeholder column.
  if (!groups[0].items.length && groups.length > 1) groups.shift();
  const used = new Set<string>();
  const result: ArchiveRecord[] = [];
  for (const group of groups) {
    const base = group.name;
    let suffix = 2;
    while (used.has(group.name)) group.name = `${base} (${suffix++})`;
    used.add(group.name);
    const items = group.items.length ? group.items : [{ node: { id: `empty-${group.id}`, title: '此列暂无书签' }, path: group.name }];
    for (const { node, path } of items) {
      const target = bookmarkTarget(node.url);
      const empty = node.url === undefined;
      let host = '';
      try { host = new URL(node.url!).hostname; } catch { /* Empty placeholder. */ }
      result.push({
        id: `X-${String(result.length + 1).padStart(3, '0')}`,
        title: node.title, en: host || 'BOOKMARK ARCHIVE',
        category: group.name, department: path, date: '', lead: '本地书签',
        clearance: empty ? 'EMPTY FOLDER' : target ? 'BOOKMARK' : 'UNSUPPORTED URL',
        abstract: empty ? (group.id === 'bar' ? EMPTY_BAR_GUIDE : '在浏览器中向这个文件夹添加书签后，刷新此页即可显示。') : node.url!,
        findings: [path], source: target ?? '', bookmarkId: node.id,
        bookmarkUrl: target, bookmarkFolder: path, empty,
      });
    }
  }
  const extras: BookmarkExtra[] = includeOther ? [] : others.flatMap(root => collect(root, rootName(root)))
    .flatMap(({ node, path }) => { const url = bookmarkTarget(node.url); return url ? [{ title: node.title, bookmarkUrl: url, bookmarkFolder: path, bookmarkId: node.id }] : []; });
  return { records: result, columns: groups.map(group => group.name), extras };
}
