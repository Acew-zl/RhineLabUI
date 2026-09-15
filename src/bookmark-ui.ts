import { bookmarkStatus } from './bookmarks';
import { coverPreferences } from './bookmark-covers';
import { searchTarget, searchEngines as engines } from './bookmark-search';
let engine: keyof typeof engines = 'bing';
try { const saved = localStorage.getItem('rhine-search-engine'); if (saved && Object.hasOwn(engines, saved)) engine = saved as keyof typeof engines; } catch { /* Default. */ }
export function setSearchEngine(value: string) {
  if (!Object.hasOwn(engines, value)) return;
  engine = value as keyof typeof engines;
  try { localStorage.setItem('rhine-search-engine', engine); } catch { /* Session only. */ }
}
export function bookmarkSettingsMarkup() {
  return `<label><div><strong>BOOKMARK LOGO</strong><span>在三维档案封面显示站点 Logo</span></div><input type="checkbox" data-cover="logo" ${coverPreferences.logo ? 'checked' : ''}/><i class="toggle"></i></label><label><div><strong>BOOKMARK TITLE</strong><span>在封面显示浏览器保存的书签名称 / 备注</span></div><input type="checkbox" data-cover="title" ${coverPreferences.title ? 'checked' : ''}/><i class="toggle"></i></label><label><div><strong>SEARCH ENGINE</strong><span>搜索框使用的搜索引擎</span></div><select id="bookmark-search-engine" aria-label="搜索引擎">${Object.keys(engines).map(key => `<option value="${key}" ${engine === key ? 'selected' : ''}>${{bing:'Bing',google:'Google',baidu:'百度'}[key]}</option>`).join('')}</select></label>`;
}
export function mountBookmarkUI() {
  document.querySelector<HTMLElement>('#stage')!.dataset.bookmarks = 'true';
  document.querySelector('#archive-ui')!.insertAdjacentHTML('beforeend', '<form class="bookmark-search" role="search"><label for="web-search">SEARCH / 检索网络</label><div><input id="web-search" type="search" autocomplete="off" placeholder="搜索网络或输入网址" aria-label="搜索网络或输入网址"/><button type="submit" aria-label="开始搜索">↗</button></div></form>');
  document.querySelector('.bookmark-search')!.addEventListener('submit', event => {
    event.preventDefault();
    const target = searchTarget((document.querySelector('#web-search') as HTMLInputElement).value, engine);
    if (target) location.assign(target);
  });
  const status = document.createElement('div');
  status.className = 'bookmark-status'; status.setAttribute('role', 'status');
  status.hidden = !bookmarkStatus; status.textContent = bookmarkStatus;
  document.querySelector('#viewport')!.append(status);
  window.addEventListener('rhine-bookmarks-changed', () => {
    status.hidden = false;
    status.innerHTML = '书签栏已更新 <button type="button">刷新书签 ↻</button>';
    status.querySelector('button')!.addEventListener('click', () => location.reload());
  });
  document.querySelector('.archive-callout .read-file')!.insertAdjacentHTML('afterend', '<button class="bookmark-inspect" data-action="inspect-bookmark">查看档案详情 ↗</button>');
  document.querySelector('.read-file')!.innerHTML = 'OPEN BOOKMARK <span>↗</span>';
  document.querySelector('#archive-ui')!.setAttribute('aria-label', '书签选择');
}
