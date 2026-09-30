import { searchEngines, searchTarget, webSearchTarget as engineSearch } from './bookmark-search.ts';

export { searchTarget };
export const engineNames = { bing: 'Bing', google: 'Google', baidu: '百度' };
export const engineOptions = Object.keys(searchEngines);
let engine: keyof typeof searchEngines = 'bing';
/** Re-read the stored engine (another open page may have changed it). */
export function reloadSearchEngine() {
  try { const saved = localStorage.getItem('rhine-search-engine'); engine = saved && Object.hasOwn(searchEngines, saved) ? saved as keyof typeof searchEngines : 'bing'; } catch { /* Default. */ }
  if (typeof document !== 'undefined') document.querySelectorAll<HTMLSelectElement>('[data-search-engine], #bookmark-search-engine').forEach(select => { select.value = engine; });
}
reloadSearchEngine();
export const getSearchEngine = () => engine;
/** Always searches, even when the text is an address (the list's alternative action). */
export const webSearchTarget = (input: string) => engineSearch(input, engine);
export function setSearchEngine(value: string) {
  if (!Object.hasOwn(searchEngines, value)) return;
  engine = value as keyof typeof searchEngines;
  try { localStorage.setItem('rhine-search-engine', engine); } catch { /* Session only. */ }
  document.querySelectorAll<HTMLSelectElement>('[data-search-engine]').forEach(select => { select.value = engine; });
}
export function bindSearchEngineSelect(form: Element) {
  form.querySelector<HTMLSelectElement>('[data-search-engine]')?.addEventListener('change', event => setSearchEngine((event.target as HTMLSelectElement).value));
}
