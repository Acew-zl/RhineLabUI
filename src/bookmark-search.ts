import { topLevelDomains } from './tld-list.ts';

export const searchEngines = { bing: 'https://www.bing.com/search?q=', google: 'https://www.google.com/search?q=', baidu: 'https://www.baidu.com/s?wd=' };
const knownTlds = new Set(topLevelDomains.split(' '));
// Private-use names (mDNS, home routers, local development) are addresses on this network.
const privateSuffixes = new Set(['local', 'lan', 'home', 'internal', 'intranet', 'corp', 'localdomain', 'test', 'localhost']);
const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const webUrl = (value: string) => {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
};
/**
 * What Enter does with typed text, and the other choice offered in the list.
 * "url": open the address (searching the text is the alternative).
 * "search": search the web; `url` is offered when the text only resembles an address.
 */
export type SearchIntent = { kind: 'url'; url: string } | { kind: 'search'; url?: string };
export function classifySearchInput(input: string): SearchIntent | undefined {
  const value = input.trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) {
    const url = webUrl(value);
    return url ? { kind: 'url', url } : { kind: 'search' };
  }
  const match = /^(localhost|\[[\da-f:.]+\]|[^\s/:?#@]+)(:\d{1,5})?(?:[/?#].*)?$/isu.exec(value);
  if (!match) return { kind: 'search' };
  const [, host, port] = match;
  // Local servers, routers and IP addresses usually serve plain HTTP.
  if (/^localhost$/i.test(host) || host.startsWith('[') || ipv4.test(host)) {
    const url = webUrl(`http://${value}`);
    return url ? { kind: 'url', url } : { kind: 'search' };
  }
  // Numbers such as 3.14 or 1.5 are text, never partial IP addresses.
  if (/^[\d.]+$/.test(host)) return { kind: 'search' };
  if (!host.includes('.')) return { kind: 'search', url: port ? webUrl(`http://${value}`) : undefined };
  const rawTld = host.split('.').at(-1)!;
  const secure = webUrl(`https://${value}`);
  const labels = secure ? new URL(secure).hostname.split('.') : [];
  // Empty labels ("e.g.") and endings that cannot be a domain ("1.5倍") stay searches.
  if (!secure || labels.some(label => !label) || !/^\p{L}{2,63}$/u.test(rawTld)) return { kind: 'search' };
  if (knownTlds.has(labels.at(-1)!)) return { kind: 'url', url: secure };
  // An explicit port or a private-use name is a server (for example nas.local:5000);
  // other dotted words such as node.js are searched, with the address as the alternative.
  if (port || privateSuffixes.has(labels.at(-1)!)) {
    const url = webUrl(`http://${value}`);
    if (url) return { kind: 'url', url };
  }
  return { kind: 'search', url: secure };
}
export function directNavigationTarget(input: string) {
  const intent = classifySearchInput(input);
  return intent?.kind === 'url' ? intent.url : undefined;
}
export function webSearchTarget(input: string, engine: keyof typeof searchEngines = 'bing') {
  const value = input.trim();
  return value ? searchEngines[engine] + encodeURIComponent(value) : undefined;
}
export function searchTarget(input: string, engine: keyof typeof searchEngines = 'bing') {
  return directNavigationTarget(input) ?? webSearchTarget(input, engine);
}

export interface SearchBookmark { title: string; id?: string; bookmarkUrl?: string; bookmarkFolder?: string; empty?: boolean; }
/** Build normalized text once; query text stays local and is never persisted. */
export function createBookmarkSearch<T extends SearchBookmark>(records: readonly T[], options: { includeUnavailable?: boolean } = {}) {
  const index = records.filter(record => !record.empty && (record.bookmarkUrl || options.includeUnavailable)).map(record => ({
    record, title: record.title.normalize('NFKC').toLowerCase(),
    text: `${record.id ?? ''} ${record.title} ${record.bookmarkUrl ?? ''} ${record.bookmarkFolder ?? ''}`.normalize('NFKC').toLowerCase(),
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
