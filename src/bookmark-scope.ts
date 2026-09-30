/** Whether "Other bookmarks" and "Mobile bookmarks" appear as columns; they are always searchable. */
const SCOPE_KEY = 'rhine-bookmark-other-roots';
let includeOther = false;
export function reloadBookmarkScope() {
  try { includeOther = localStorage.getItem(SCOPE_KEY) === 'true'; } catch { /* Bookmarks bar only. */ }
}
reloadBookmarkScope();
export const getIncludeOtherBookmarks = () => includeOther;
export function setIncludeOtherBookmarks(value: boolean) {
  includeOther = value;
  try { localStorage.setItem(SCOPE_KEY, String(value)); } catch { /* Session only. */ }
}
