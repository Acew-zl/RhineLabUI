export const searchEngines = { bing: 'https://www.bing.com/search?q=', google: 'https://www.google.com/search?q=', baidu: 'https://www.baidu.com/s?wd=' };
export function searchTarget(input: string, engine: keyof typeof searchEngines = 'bing') {
  const value = input.trim();
  if (!value) return undefined;
  try {
    const candidate = /^(https?:\/\/)/i.test(value) ? value : /^[^\s/:]+\.[^\s/:]+(?::\d+)?(?:\/|$)/u.test(value) ? `https://${value}` : '';
    if (candidate) { const url = new URL(candidate); if (['http:', 'https:'].includes(url.protocol)) return url.href; }
  } catch { /* Treat as search text. */ }
  return searchEngines[engine] + encodeURIComponent(value);
}
