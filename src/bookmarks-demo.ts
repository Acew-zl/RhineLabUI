import type { BookmarkNode } from './bookmark-data';
// Explicit local preview only. These are examples, never a user's bookmarks.
export const demoBookmarks: BookmarkNode[] = [{ id: '0', title: '', children: [{ id: '1', title: 'Bookmarks bar', children: [
  { id: '10', title: 'GitHub · 我的代码仓库', url: 'https://github.com/' },
  { id: '11', title: '哔哩哔哩', url: 'https://www.bilibili.com/' },
  { id: '18', title: '', url: 'https://example.com/unnamed-bookmark' },
  { id: '12', title: '学习', children: [
    { id: '13', title: 'Three.js 文档', url: 'https://threejs.org/' },
    { id: '14', title: '参考资料', children: [{ id: '15', title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' }] },
  ] },
  { id: '16', title: '空文件夹', children: [] },
  { id: '17', title: '很多书签', children: Array.from({ length: 45 }, (_, i) => ({ id: `demo-${i}`, title: `资料 ${i + 1} · 很长的书签名称用于检查封面文字换行与省略`, url: `https://example.com/${i}` })) },
] }] }];
