import { getBookmarkSummaryLogo, mountBookmarkSummaryLogo, bookmarkResultIcon, refreshBookmarkResultIcons } from './bookmark-summary';
import { getBookmarkStartupMode } from './bookmark-startup';
import { bookmarkDisplayTitle } from './bookmark-data';
import { bookmarkStatus } from './bookmarks';
import { coverPreferences, bookmarkIconStatus, retryBookmarkIcons, onBookmarkIcon } from './bookmark-covers';
import { createBookmarkSearch } from './bookmark-search';
import { searchTarget, engineNames, engineOptions, getSearchEngine, bindSearchEngineSelect } from '@search-provider';
import { submitChromeSearch } from './chrome-search';
import { isChromeStore } from './platform';
import { records, columnFiles, fileLocation } from './data';
import { getBookmarkOpenMode, openBookmarkDestination } from './bookmark-navigation';
export { setSearchEngine } from '@search-provider';
export function focusBookmarkSearch() { document.querySelector<HTMLInputElement>('#web-search')?.focus(); }
export function bookmarkSettingsMarkup(section: 'navigation' | 'display' | 'startup') {
  if (section === 'navigation') return `
    ${isChromeStore ? '<p class="bookmark-setting-note">网络搜索使用 Chrome 当前的默认搜索引擎，可在浏览器设置中修改。</p>' : `<label><div><strong>搜索引擎 / SEARCH ENGINE</strong><span>网络搜索默认使用的引擎</span></div><select id="bookmark-search-engine" aria-label="搜索引擎">${engineOptions.map(key => `<option value="${key}" ${getSearchEngine() === key ? 'selected' : ''}>${engineNames[key as keyof typeof engineNames]}</option>`).join('')}</select></label>`}
    <label><div><strong>链接打开方式 / OPEN LINKS</strong><span>应用于书签与搜索结果；新标签页会保留当前导航</span></div><select id="bookmark-open-mode" aria-label="链接打开方式"><option value="new-tab" ${getBookmarkOpenMode() === 'new-tab' ? 'selected' : ''}>新标签页（默认）</option><option value="current-tab" ${getBookmarkOpenMode() === 'current-tab' ? 'selected' : ''}>当前页</option></select></label>`;
  if (section === 'display') return `
    <label><div><strong>名称旁的网站 Logo</strong><span>在右侧选中书签的名称左边显示，独立于书脊设置</span></div><input type="checkbox" id="bookmark-summary-logo" ${getBookmarkSummaryLogo() ? 'checked' : ''}/><i class="toggle"></i></label>
    <label><div><strong>书脊 Logo</strong><span>在档案顶部朝上的书脊显示网站图标</span></div><input type="checkbox" data-cover="logo" ${coverPreferences.logo ? 'checked' : ''}/><i class="toggle"></i></label>
    <label><div><strong>书脊名称 / 备注</strong><span>与浏览器保存的名称一致；空名称保留为空</span></div><input type="checkbox" data-cover="title" ${coverPreferences.title ? 'checked' : ''}/><i class="toggle"></i></label>
    <details class="bookmark-icon-help"><summary>图标加载状态与重试</summary><div class="bookmark-icon-status"><span data-icon-status>${bookmarkIconStatus()}</span><button type="button" data-retry-icons>重试图标 ↻</button></div></details>`;
  return `<label><div><strong>启动方式 / STARTUP</strong><span>下次打开生效。简短动画在三维就绪后跳转；直接进入仅显示加载提示。</span></div><select id="bookmark-startup-mode" aria-label="启动方式">${[['full', '完整启动动画'], ['brief', '简短动画 · 就绪即进入'], ['direct', '直接进入三维档案']].map(([value, label]) => `<option value="${value}" ${getBookmarkStartupMode() === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><p class="bookmark-setting-note">自动进入时，声音在首次交互后启用。</p>`;
}
export function mountBookmarkUI() {
  onBookmarkIcon(() => { const status = document.querySelector('[data-icon-status]'); if (status) status.textContent = bookmarkIconStatus(); });
  document.addEventListener('click', event => { if ((event.target as Element).closest('[data-retry-icons]')) retryBookmarkIcons(); });
  document.querySelector<HTMLElement>('#stage')!.dataset.bookmarks = 'true';
  const callout = document.querySelector('.archive-callout')!;
  callout.prepend(document.querySelector('.column-navigation')!);
  mountBookmarkSummaryLogo();
  const name = document.querySelector<HTMLElement>('#column-name')!;
  const position = document.createElement('span'); position.id = 'bookmark-folder-position'; name.closest('.column-navigation > div')!.append(position);
  document.querySelector('#column-number')!.firstChild!.textContent = 'FOLDER / 文件夹 ';
  document.querySelector('[data-action="column-prev"]')!.setAttribute('aria-label', '上一个文件夹');
  document.querySelector('[data-action="column-next"]')!.setAttribute('aria-label', '下一个文件夹');
  document.querySelector('.system-nav [data-action="search"] .key')?.remove();
  document.querySelector('#archive-ui')!.insertAdjacentHTML('beforeend', `<form class="bookmark-search" role="search" aria-label="网络与书签搜索"><div class="bookmark-search-heading"><label for="web-search">SEARCH / 检索</label>${isChromeStore ? '<span class="bookmark-default-search">浏览器默认搜索</span>' : `<select data-search-engine aria-label="搜索栏引擎">${Object.entries(engineNames).map(([key, label]) => `<option value="${key}" ${getSearchEngine() === key ? 'selected' : ''}>${label}</option>`).join('')}</select>`}<span class="key" aria-hidden="true">/</span></div><div class="search-field"><span aria-hidden="true">⌕</span><input id="web-search" type="text" role="combobox" aria-autocomplete="list" aria-controls="bookmark-suggestions" aria-expanded="false" autocomplete="off" spellcheck="false" placeholder="搜索、输入网址或查找书签" aria-label="搜索网络或输入网址"/><button class="search-clear" type="button" aria-label="清空搜索" hidden>×</button><button class="search-submit" type="submit" aria-label="开始搜索">↗</button></div><div class="bookmark-search-popup" hidden><div class="bookmark-search-caption">BOOKMARKS / 本地书签<span>↑ ↓ 选择 · ENTER 打开</span></div><div id="bookmark-suggestions" role="listbox" aria-label="匹配的书签"></div><p class="bookmark-search-empty" hidden>没有匹配的书签 · 按 Enter 搜索网络</p></div><div class="search-announcement" aria-live="polite"></div></form>`);
  const form = document.querySelector<HTMLFormElement>('.bookmark-search')!;
  const input = form.querySelector<HTMLInputElement>('#web-search')!;
  const popup = form.querySelector<HTMLElement>('.bookmark-search-popup')!;
  const list = form.querySelector<HTMLElement>('#bookmark-suggestions')!;
  const clear = form.querySelector<HTMLButtonElement>('.search-clear')!;
  const announce = form.querySelector<HTMLElement>('.search-announcement')!;
  const find = createBookmarkSearch(records);
  const recordIndexes = new Map(records.map((record, index) => [record, index]));
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
      const title = document.createElement('strong'); title.textContent = bookmarkDisplayTitle(record);
      const path = document.createElement('small'); path.textContent = `${record.bookmarkFolder ?? ''} / ${record.bookmarkUrl}`;
      row.insertAdjacentHTML('afterbegin', bookmarkResultIcon(recordIndexes.get(record)!));
      const identity = document.createElement('span'); identity.className = 'bookmark-result-identity'; identity.append(title, path); row.append(identity); row.title = `${record.title}\n${record.bookmarkUrl}`;
      row.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') event.preventDefault(); });
      row.addEventListener('click', () => { if (record.bookmarkUrl) openBookmarkDestination(record.bookmarkUrl); });
      list.append(row);
    });
    form.querySelector<HTMLElement>('.bookmark-search-empty')!.hidden = matches.length > 0;
    popup.hidden = false; input.setAttribute('aria-expanded', 'true'); refreshBookmarkResultIcons();
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
  bindSearchEngineSelect(form);
  document.addEventListener('pointerdown', event => { if (!form.contains(event.target as Node)) close(); });
  form.addEventListener('focusout', () => { queueMicrotask(() => { if (!form.contains(document.activeElement)) close(); }); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (composing) return;
    if (active >= 0) {
      const target = matches[active]?.bookmarkUrl;
      if (target) openBookmarkDestination(target);
    } else if (isChromeStore) {
      void submitChromeSearch(input.value, getBookmarkOpenMode()).catch(() => { announce.textContent = '浏览器默认搜索暂时不可用，请重试。'; });
    } else {
      const target = searchTarget(input.value, getSearchEngine());
      if (target) openBookmarkDestination(target);
    }
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
  const actions = document.createElement('div'); actions.className = 'bookmark-actions';
  const open = document.querySelector('.archive-callout .read-file')!;
  open.before(actions); actions.append(open);
  open.innerHTML = '打开书签 <span>↗</span>';
  actions.insertAdjacentHTML('beforeend', '<button class="bookmark-inspect" data-action="inspect-bookmark">档案详情 <span>→</span></button>');
  document.querySelector('#archive-ui')!.setAttribute('aria-label', '书签选择');
}

export function updateBookmarkFolderPosition(index: number) {
  const location = fileLocation(index), files = columnFiles(location.lane);
  const count = files.filter(i => !records[i].empty).length;
  document.querySelector('#bookmark-folder-position')!.textContent = count ? `第 ${files.indexOf(index) + 1} 项 / 共 ${count} 项` : '此文件夹暂无书签';
}
