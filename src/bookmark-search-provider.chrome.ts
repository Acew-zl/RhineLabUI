/** Build-time replacement: Chrome Store package contains no hard-coded web provider. */
export const engineNames = {} as Record<string, string>;
export const engineOptions: string[] = [];
export const getSearchEngine = () => '';
export function setSearchEngine(_value: string) { /* Browser setting owns the default provider. */ }
export function bindSearchEngineSelect(_form: Element) { /* No provider selector in this build. */ }
export function searchTarget(_input: string, _engine?: string): string | undefined { return undefined; }
