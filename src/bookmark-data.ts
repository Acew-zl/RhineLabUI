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

export function bookmarkColumns(tree: BookmarkNode[]) {
  const roots = tree.flatMap(node => node.children ?? []);
  // Modern Chromium identifies permanent roots by type; older versions use 1.
  const bars = roots.filter(node => node.folderType === 'bookmarks-bar');
  const selected = bars.length ? bars : roots.filter(node => node.id === '1');
  const children = selected.flatMap(node => node.children ?? []);
  const groups: { name: string; id: string; items: { node: BookmarkNode; path: string }[] }[] = [
    { name: '书签栏', id: 'bar', items: children.filter(node => node.url !== undefined).map(node => ({ node, path: '书签栏' })) },
  ];
  function collect(node: BookmarkNode, path: string): { node: BookmarkNode; path: string }[] {
    return (node.children ?? []).flatMap(child => child.url !== undefined ? [{ node: child, path }] : collect(child, `${path} / ${child.title || '未命名文件夹'}`));
  }
  for (const folder of children.filter(node => node.url === undefined))
    groups.push({ name: folder.title || '未命名文件夹', id: folder.id, items: collect(folder, folder.title || '未命名文件夹') });
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
        abstract: empty ? '在浏览器书签栏的对应位置添加书签后，刷新此页即可显示。' : node.url!,
        findings: [path], source: target ?? '', bookmarkId: node.id,
        bookmarkUrl: target, bookmarkFolder: path, empty,
      });
    }
  }
  return { records: result, columns: groups.map(group => group.name) };
}
