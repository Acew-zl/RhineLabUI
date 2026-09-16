export const searchEngines = { bing: 'https://www.bing.com/search?q=', google: 'https://www.google.com/search?q=', baidu: 'https://www.baidu.com/s?wd=' };
export function searchTarget(input: string, engine: keyof typeof searchEngines = 'bing') {
  const value = input.trim();
  if (!value) return undefined;
  try {
    const candidate = /^https?:\/\//i.test(value) ? value : /^(?:localhost|\[[\da-f:]+\]|[^\s/:?#@]+\.[^\s/:?#@]+)(?::\d+)?(?:[/?#]|$)/iu.test(value) ? `https://${value}` : '';
    if (candidate) { const url = new URL(candidate); if (['http:', 'https:'].includes(url.protocol)) return url.href; }
  } catch { /* Treat as search text. */ }
  return searchEngines[engine] + encodeURIComponent(value);
}

export interface SearchBookmark { title: string; bookmarkUrl?: string; bookmarkFolder?: string; empty?: boolean; }
/** Build normalized text once; query text stays local and is never persisted. */
export function createBookmarkSearch(records: readonly SearchBookmark[]) {
  const index = records.filter(record => !record.empty && record.bookmarkUrl).map(record => ({
    record, title: record.title.normalize('NFKC').toLowerCase(),
    text: `${record.title} ${record.bookmarkUrl} ${record.bookmarkFolder ?? ''}`.normalize('NFKC').toLowerCase(),
  }));
  return (query: string, limit = 5) => {
    const value = query.trim().normalize('NFKC').toLowerCase();
    if (!value) return [];
    const tokens = value.split(/\s+/u);
    return index.filter(item => tokens.every(token => item.text.includes(token)))
      .sort((a, b) => Number(b.title === value) - Number(a.title === value) || Number(b.title.startsWith(value)) - Number(a.title.startsWith(value)))
      .slice(0, Math.max(0, limit)).map(item => item.record);
  };
}
