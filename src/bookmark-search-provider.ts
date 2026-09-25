import { searchEngines, searchTarget } from './bookmark-search.ts';

export { searchTarget };
export const engineNames = { bing: 'Bing', google: 'Google', baidu: '百度' };
export const engineOptions = Object.keys(searchEngines);
let engine: keyof typeof searchEngines = 'bing';
try { const saved = localStorage.getItem('rhine-search-engine'); if (saved && Object.hasOwn(searchEngines, saved)) engine = saved as keyof typeof searchEngines; } catch { /* Default. */ }
export const getSearchEngine = () => engine;
export function setSearchEngine(value: string) {
  if (!Object.hasOwn(searchEngines, value)) return;
  engine = value as keyof typeof searchEngines;
  try { localStorage.setItem('rhine-search-engine', engine); } catch { /* Session only. */ }
  document.querySelectorAll<HTMLSelectElement>('[data-search-engine]').forEach(select => { select.value = engine; });
}
export function bindSearchEngineSelect(form: Element) {
  form.querySelector<HTMLSelectElement>('[data-search-engine]')?.addEventListener('change', event => setSearchEngine((event.target as HTMLSelectElement).value));
}
