/** Decorative terminal identity. No browser account or network access. */
export const DEFAULT_USER_NAME = 'JOYCE MOORE';
export const USER_NAME_KEY = 'rhine-user-name';
export const USER_NAME_BOOT_TIME = 8.56;
export const USER_NAME_LIMIT = 24;
const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
export const nameCharacters = (value: string) => Array.from(segments.segment(value), part => part.segment);
export function normalizeUserName(value: string) {
  const text = value.normalize('NFC').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '').trim();
  return nameCharacters(text).slice(0, USER_NAME_LIMIT).join('') || DEFAULT_USER_NAME;
}
export interface UserNameProfile { name: string; confirmed: boolean }
type NameStorage = Pick<Storage, 'getItem' | 'setItem'>;
export function readUserName(storage: NameStorage): UserNameProfile {
  try {
    const value = JSON.parse(storage.getItem(USER_NAME_KEY) ?? 'null');
    if (value?.confirmed === true && typeof value.name === 'string')
      return { name: normalizeUserName(value.name), confirmed: true };
  } catch { /* Missing, damaged or unavailable storage uses the initial prompt. */ }
  return { name: DEFAULT_USER_NAME, confirmed: false };
}
export function writeUserName(storage: NameStorage, name: string): boolean {
  try {
    storage.setItem(USER_NAME_KEY, JSON.stringify({ name: normalizeUserName(name), confirmed: true }));
    return true;
  } catch { return false; }
}
