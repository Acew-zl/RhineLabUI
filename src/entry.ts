import { isExtension } from './platform';
async function enter() {
  if (isExtension) await (await import('./bookmarks')).initializeBookmarks();
  await import('./main');
}
void enter();
