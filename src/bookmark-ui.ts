import { bookmarkStatus } from './bookmarks';
import { coverPreferences, bookmarkIconStatus, retryBookmarkIcons, onBookmarkIcon } from './bookmark-covers';
import { searchTarget, searchEngines as engines, createBookmarkSearch } from './bookmark-search';
import { records } from './data';
import { getBookmarkOpenMode, openBookmarkDestination } from './bookmark-navigation';
const engineNames = { bing: 'Bing', google: 'Google', baidu: '百度' };
let engine: keyof typeof engines = 'bing';
try { const saved = localStorage.getItem('rhine-search-engine'); if (saved && Object.hasOwn(engines, saved)) engine = saved as keyof typeof engines; } catch { /* Default. */ }
export function setSearchEngine(value: string) {
  if (!Object.hasOwn(engines, value)) return;
  engine = value as keyof typeof engines;
  try { localStorage.setItem('rhine-search-engine', engine); } catch { /* Session only. */ }
  document.querySelectorAll<HTMLSelectElement>('[data-search-engine]').forEach(select => { select.value = engine; });
}
export function focusBookmarkSearch() { document.querySelector<HTMLInputElement>('#web-search')?.focus(); }
export function bookmarkSettingsMarkup() {
  return `<label><div><strong>OPEN LINKS</strong><span>书签与搜索结果的打开方式；新标签页可保留当前导航</span></div><select id="bookmark-open-mode" aria-label="链接打开方式"><option value="new-tab" ${getBookmarkOpenMode() === 'new-tab' ? 'selected' : ''}>新标签页（默认）</option><option value="current-tab" ${getBookmarkOpenMode() === 'current-tab' ? 'selected' : ''}>当前页</option></select></label><label><div><strong>BOOKMARK LOGO</strong><span>在档案顶部朝上的书脊显示站点 Logo</span></div><input type="checkbox" data-cover="logo" ${coverPreferences.logo ? 'checked' : ''}/><i class="toggle"></i></label><label><div><strong>BOOKMARK TITLE</strong><span>在顶部书脊显示浏览器保存的书签名称 / 备注</span></div><input type="checkbox" data-cover="title" ${coverPreferences.title ? 'checked' : ''}/><i class="toggle"></i></label><label><div><strong>SEARCH ENGINE</strong><span>搜索框使用的搜索引擎</span></div><select id="bookmark-search-engine" aria-label="搜索引擎">${Object.keys(engines).map(key => `<option value="${key}" ${engine === key ? 'selected' : ''}>${engineNames[key as keyof typeof engines]}</option>`).join('')}</select></label><div class="bookmark-icon-status"><span data-icon-status>${bookmarkIconStatus()}</span><button type="button" data-retry-icons>重试图标 ↻</button></div>`;
}
export function mountBookmarkUI() {
  onBookmarkIcon(() => { const status = document.querySelector('[data-icon-status]'); if (status) status.textContent = bookmarkIconStatus(); });
  document.addEventListener('click', event => { if ((event.target as Element).closest('[data-retry-icons]')) retryBookmarkIcons(); });
  document.querySelector<HTMLElement>('#stage')!.dataset.bookmarks = 'true';
  const callout = document.querySelector('.archive-callout')!;
  callout.prepend(document.querySelector('.column-navigation')!);
  document.querySelector('#column-number')!.firstChild!.textContent = 'FOLDER / 文件夹 ';
  document.querySelector('[data-action="column-prev"]')!.setAttribute('aria-label', '上一个文件夹');
  document.querySelector('[data-action="column-next"]')!.setAttribute('aria-label', '下一个文件夹');
  document.querySelector('.system-nav [data-action="search"] .key')?.remove();
  document.querySelector('#archive-ui')!.insertAdjacentHTML('beforeend', `<form class="bookmark-search" role="search" aria-label="网络与书签搜索"><div class="bookmark-search-heading"><label for="web-search">SEARCH / 检索</label><select data-search-engine aria-label="搜索栏引擎">${Object.entries(engineNames).map(([key, label]) => `<option value="${key}" ${engine === key ? 'selected' : ''}>${label}</option>`).join('')}</select><span class="key" aria-hidden="true">/</span></div><div class="search-field"><span aria-hidden="true">⌕</span><input id="web-search" type="text" role="combobox" aria-autocomplete="list" aria-controls="bookmark-suggestions" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="搜索、输入网址或查找书签" aria-label="搜索网络或输入网址"/><button class="search-clear" type="button" aria-label="清空搜索" hidden>×</button><button class="search-submit" type="submit" aria-label="开始搜索">↗</button></div><div class="bookmark-search-popup" hidden><div class="bookmark-search-caption">BOOKMARKS / 本地书签<span>↑ ↓ 选择 · ENTER 打开</span></div><div id="bookmark-suggestions" role="listbox" aria-label="匹配的书签"></div><p class="bookmark-search-empty" hidden>没有匹配的书签 · 按 Enter 搜索网络</p></div><div class="search-announcement" aria-live="polite"></div></form>`);
  const form = document.querySelector<HTMLFormElement>('.bookmark-search')!;
  const input = form.querySelector<HTMLInputElement>('#web-search')!;
  const popup = form.querySelector<HTMLElement>('.bookmark-search-popup')!;
  const list = form.querySelector<HTMLElement>('#bookmark-suggestions')!;
  const clear = form.querySelector<HTMLButtonElement>('.search-clear')!;
  const announce = form.querySelector<HTMLElement>('.search-announcement')!;
  const find = createBookmarkSearch(records);
  let matches = find(''), active = -1, composing = false;
  const close = () => { popup.hidden = true; active = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  const choose = (index: number) => {
    active = index;
    Array.from(list.children).forEach((node, i) => node.setAttribute('aria-selected', String(i === active)));
    if (active < 0) input.removeAttribute('aria-activedescendant');
    else { input.setAttribute('aria-activedescendant', `bookmark-suggestion-${active}`); list.children[active].scrollIntoView({ block: 'nearest' }); }
  };
  const update = () => {
    clear.hidden = !input.value;
    if (composing || !input.value.trim()) { matches = []; list.replaceChildren(); close(); announce.textContent = ''; return; }
    matches = find(input.value); active = -1; list.replaceChildren(); input.removeAttribute('aria-activedescendant');
    matches.forEach((record, i) => {
      const row = document.createElement('button'); row.type = 'button'; row.tabIndex = -1; row.id = `bookmark-suggestion-${i}`; row.setAttribute('role', 'option'); row.setAttribute('aria-selected', 'false');
      const title = document.createElement('strong'); title.textContent = record.title;
      const path = document.createElement('small'); path.textContent = `${record.bookmarkFolder ?? ''} / ${record.bookmarkUrl}`;
      row.append(title, path); row.title = `${record.title}\n${record.bookmarkUrl}`;
      row.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
      row.addEventListener('click', () => { if (record.bookmarkUrl) openBookmarkDestination(record.bookmarkUrl); });
      list.append(row);
    });
    form.querySelector<HTMLElement>('.bookmark-search-empty')!.hidden = matches.length > 0;
    popup.hidden = false; input.setAttribute('aria-expanded', 'true');
    announce.textContent = matches.length ? `${matches.length} 个匹配书签；按上下键选择，或直接 Enter 搜索网络` : '没有匹配书签；按 Enter 搜索网络';
  };
  input.addEventListener('input', update);
  input.addEventListener('focus', update);
  input.addEventListener('compositionstart', () => { composing = true; close(); });
  input.addEventListener('compositionend', () => { composing = false; update(); });
  form.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.isComposing || composing || event.keyCode === 229) {
      if (event.key === 'Enter') event.preventDefault();
      return;
    }
    if (event.target === input && event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      const target = matches[active]?.bookmarkUrl;
      if (target) openBookmarkDestination(target);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!popup.hidden) close(); else if (input.value) { input.value = ''; update(); } else input.blur();
    }
    if (event.target === input && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); if (popup.hidden) update();
      if (matches.length) choose((active + (event.key === 'ArrowDown' ? 1 : active < 0 ? 0 : -1) + matches.length) % matches.length);
    }
  });
  clear.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
  form.querySelector('.search-submit')!.addEventListener('click', () => { active = -1; });
  form.querySelector<HTMLSelectElement>('[data-search-engine]')!.addEventListener('change', event => setSearchEngine((event.target as HTMLSelectElement).value));
  document.addEventListener('pointerdown', event => { if (!form.contains(event.target as Node)) close(); });
  form.addEventListener('focusout', () => { queueMicrotask(() => { if (!form.contains(document.activeElement)) close(); }); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (composing) return;
    const target = active >= 0 ? matches[active]?.bookmarkUrl : searchTarget(input.value, engine);
    if (target) openBookmarkDestination(target);
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
