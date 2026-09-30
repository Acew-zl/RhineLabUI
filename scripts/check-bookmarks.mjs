import { bookmarkStartupReady, normalizeStartupMode, resolveOpeningMode, localDate } from '../src/bookmark-startup.ts';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookmarkColumns, bookmarkTarget, bookmarkDisplayTitle } from '../src/bookmark-data.ts';
import { installBookmarkCatalog, records, columnFiles } from '../src/data.ts';
import { fileAtCell, selectionCell } from '../src/archive-loop.ts';
import { searchTarget, createBookmarkSearch, classifySearchInput, webSearchTarget } from '../src/bookmark-search.ts';
import { bookmarkSpineGeometry } from '../src/bookmark-spine.ts';
import { getBookmarkOpenMode, normalizeOpenMode, openBookmarkDestination, setBookmarkOpenMode } from '../src/bookmark-navigation.ts';
import { loadBookmarkIcon } from '../src/bookmark-icon-loader.ts';

test('favicon loading retries cached size/root candidates and decodes owned pixels', async () => {
  const calls = [];
  const result = await loadBookmarkIcon(['page32', 'page16', 'root32'], async url => {
    calls.push(url);
    if (url === 'page32') throw new Error('not available');
    return new Blob([url]);
  }, async blob => {
    const text = await blob.text();
    if (text === 'page16') throw new Error('decode error');
    return { pixels: text };
  });
  assert.deepEqual(result, { pixels: 'root32' });
  assert.deepEqual(calls, ['page32', 'page16', 'root32']);
  await assert.rejects(loadBookmarkIcon([], async () => new Blob(), async () => null), /接口不可用/);
});

test('spine decal lies on the upward-facing top edge and never on the front or vertical side', () => {
  const geometry = bookmarkSpineGeometry();
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  assert.ok(min.y > 3.7 && max.y < 3.71, 'Spine must face upward above the top rail');
  assert.ok(min.x > -2.5 && max.x < 2.5 && min.z > -.113 && max.z < .197);
  const normal = geometry.getAttribute('normal');
  for (let i = 0; i < normal.count; i++) assert.ok(normal.getY(i) > .99);
  const position = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) if (uv.getX(i) === 0) assert.ok(position.getX(i) < -2);
  geometry.dispose();
});

test('new-tab default preserves the navigation page; current-tab is an explicit preference', () => {
  assert.equal(getBookmarkOpenMode(), 'new-tab');
  assert.equal(normalizeOpenMode('invalid'), 'new-tab');
  const calls = [];
  const host = { open: (...args) => calls.push(['new', ...args]), location: { assign: url => calls.push(['current', url]) } };
  openBookmarkDestination('https://example.com', host);
  assert.deepEqual(calls.pop(), ['new', 'https://example.com/', '_blank', 'noopener,noreferrer']);
  setBookmarkOpenMode('current-tab');
  openBookmarkDestination('https://example.com/page', host);
  assert.deepEqual(calls.pop(), ['current', 'https://example.com/page']);
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'invalid']) openBookmarkDestination(url, host);
  assert.equal(calls.length, 0);
  setBookmarkOpenMode('new-tab');
});
test('browser pages and local files open through the extension tab API beside the start page', async () => {
  const calls = [];
  const tabs = {
    getCurrent: async () => ({ id: 7, index: 2 }),
    create: async properties => { calls.push(['create', properties]); },
    update: async (id, properties) => { calls.push(['update', id, properties]); },
  };
  const host = { open: (...args) => calls.push(['window', ...args]), location: { assign: url => calls.push(['assign', url]) }, tabs, fileAccess: async () => true };
  await openBookmarkDestination('chrome://settings/', host, 'new-tab');
  await openBookmarkDestination('edge://settings/', host, 'current-tab');
  await openBookmarkDestination('file:///C:/notes.txt', host, 'new-tab');
  // Web pages still open synchronously inside the user gesture.
  await openBookmarkDestination('https://example.com/', host, 'new-tab');
  assert.deepEqual(calls, [
    ['create', { url: 'chrome://settings/', index: 3, openerTabId: 7 }],
    ['update', 7, { url: 'edge://settings/' }],
    ['create', { url: 'file:///C:/notes.txt', index: 3, openerTabId: 7 }],
    ['window', 'https://example.com/', '_blank', 'noopener,noreferrer'],
  ]);
  const notices = [];
  const { setNavigationNotice } = await import('../src/bookmark-navigation.ts');
  setNavigationNotice(message => notices.push(message));
  await openBookmarkDestination('file:///C:/notes.txt', { ...host, fileAccess: async () => false }, 'new-tab');
  await openBookmarkDestination('chrome://settings/', { ...host, tabs: { ...tabs, create: async () => { throw new Error('blocked'); } } }, 'new-tab');
  assert.equal(calls.length, 4, 'A blocked local file does not open a tab');
  assert.match(notices[0], /允许访问文件网址/);
  assert.match(notices[1], /不允许/);
  setNavigationNotice(() => {});
});
test('web search encodes queries and only navigates HTTP(S) URLs directly', () => {
  assert.equal(searchTarget('   '),undefined);
  assert.equal(searchTarget('example.com/a'), 'https://example.com/a');
  assert.equal(searchTarget('https://example.com/a?q=x'), 'https://example.com/a?q=x');
  assert.equal(searchTarget('莱茵 生命 & logo', 'google'), 'https://www.google.com/search?q=' + encodeURIComponent('莱茵 生命 & logo'));
  assert.equal(searchTarget('javascript:alert(1)'), 'https://www.bing.com/search?q=javascript%3Aalert(1)');
  assert.equal(searchTarget('example.com?q=a#b'), 'https://example.com/?q=a#b');
  assert.equal(searchTarget('localhost:5190/a'), 'http://localhost:5190/a');
  assert.equal(searchTarget('http://127.0.0.1:5190/'), 'http://127.0.0.1:5190/');
  assert.equal(searchTarget('someone@example.com'), 'https://www.bing.com/search?q=someone%40example.com');
  assert.equal(searchTarget('data:text/html,<script>'), 'https://www.bing.com/search?q=data%3Atext%2Fhtml%2C%3Cscript%3E');
});
test('typed text is an address only with a real domain ending, an IP address or a local server', () => {
  const google = 'https://www.google.com/search?q=';
  // Ordinary words and numbers are searched rather than opened as hosts.
  for (const text of ['3.14', '1.1', '10.0', '1.2.3', 'node.js', 'package.json', 'e.g.', 'a..b', '1.5倍', 'C++', 'vue 3.5', 'nas:5000'])
    assert.equal(searchTarget(text, 'google'), google + encodeURIComponent(text), text);
  assert.equal(searchTarget('github.com', 'google'), 'https://github.com/');
  assert.equal(searchTarget('GitHub.com/foo'), 'https://github.com/foo');
  assert.equal(searchTarget('莱茵.中国'), 'https://xn--bl1awj.xn--fiqs8s/');
  // Local servers, routers and IP addresses use plain HTTP.
  assert.equal(searchTarget('localhost:3000'), 'http://localhost:3000/');
  assert.equal(searchTarget('192.168.1.1'), 'http://192.168.1.1/');
  assert.equal(searchTarget('[::1]:8080/a'), 'http://[::1]:8080/a');
  assert.equal(searchTarget('nas.local:5000'), 'http://nas.local:5000/');
  assert.equal(searchTarget('printer.local/'), 'http://printer.local/');
  // The other reading of ambiguous text is offered as the list alternative.
  assert.deepEqual(classifySearchInput('node.js'), { kind: 'search', url: 'https://node.js/' });
  assert.deepEqual(classifySearchInput('nas:5000'), { kind: 'search', url: 'http://nas:5000/' });
  assert.deepEqual(classifySearchInput('3.14'), { kind: 'search' });
  assert.deepEqual(classifySearchInput('github.com'), { kind: 'url', url: 'https://github.com/' });
  assert.equal(classifySearchInput('   '), undefined);
  assert.equal(webSearchTarget('github.com', 'bing'), 'https://www.bing.com/search?q=github.com');
});
test('local search ranks exact/prefix titles, matches all terms, and excludes unavailable targets', () => {
  const find = createBookmarkSearch([
    { title: 'Tools', bookmarkUrl: 'https://github.com', bookmarkFolder: '开发' },
    { title: 'GitHub Docs', bookmarkUrl: 'https://docs.github.com', bookmarkFolder: '学习 / 文档' },
    { title: 'GitHub', bookmarkUrl: 'https://github.com/me', bookmarkFolder: '开发' },
    { title: 'GitHub 空列', empty: true },
    { title: 'GitHub 脚本' },
  ]);
  assert.deepEqual(find('ＧＩＴＨＵＢ').map(r => r.title), ['GitHub', 'GitHub Docs', 'Tools']);
  assert.deepEqual(find('文档 github').map(r => r.title), ['GitHub Docs']);
  assert.equal(find('github', 1)[0].title, 'GitHub');
  assert.deepEqual(find('missing'), []);
  assert.deepEqual(find('   '), []);
});
const tree = [{id:'0', title:'', children:[{id:'1', title:'书签栏', children:[
  {id:'a', title:'自定义备注 <>&', url:'https://example.com/a'},
  {id:'f1', title:'同名', children:[{id:'f2', title:'子目录', children:[{id:'b', title:'深层备注', url:'https://example.com/b'}]}]},
  {id:'f3', title:'同名', children:[]},
  {id:'f4', title:'很多', children:Array.from({length:45},(_,i)=>({id:`many${i}`, title:`项${i}`, url:`https://example.com/${i}`}))},
]}, {id:'2',title:'其他书签',children:[{id:'outside',title:'不在书签栏',url:'https://example.com/other'}]}]}];
test('bar leaves first; top folders preserve browser order and nest by path', () => {
  const catalog = bookmarkColumns(tree);
  assert.deepEqual(catalog.columns, ['书签栏','同名','同名 (2)','很多']);
  assert.equal(catalog.records[0].title, '自定义备注 <>&');
  assert.equal(catalog.records[1].bookmarkFolder, '同名 / 子目录');
  assert.equal(catalog.records[2].empty,true);
  assert.equal(catalog.records.length,48);
  assert.ok(!catalog.records.some(r=>r.bookmarkId==='outside'));
});
test('other and mobile bookmarks are searchable, and become columns only when chosen', () => {
  const withOther = [{ id: '0', title: '', children: [
    { id: '1', title: '书签栏', folderType: 'bookmarks-bar', children: [{ id: 'f', title: '学习', children: [{ id: 'a', title: 'MDN', url: 'https://developer.mozilla.org/' }] }] },
    { id: '2', title: '其他书签', folderType: 'other', children: [{ id: 'o', title: 'Docs', url: 'https://docs.example/' }, { id: 'of', title: '归档', children: [{ id: 'o2', title: 'Old', url: 'https://old.example/' }] }] },
    { id: '3', title: '移动设备书签', folderType: 'mobile', children: [{ id: 'm', title: 'Phone', url: 'https://m.example/' }, { id: 'js', title: 'Run', url: 'javascript:void(0)' }] },
  ] }];
  const barOnly = bookmarkColumns(withOther);
  // A bar with only folders no longer opens on an empty placeholder column.
  assert.deepEqual(barOnly.columns, ['学习']);
  assert.ok(!barOnly.records.some(record => record.empty));
  assert.deepEqual(barOnly.extras.map(extra => [extra.title, extra.bookmarkFolder]), [['Docs', '其他书签'], ['Old', '其他书签 / 归档'], ['Phone', '移动设备书签']]);
  const all = bookmarkColumns(withOther, { includeOther: true });
  assert.deepEqual(all.columns, ['学习', '其他书签', '归档', '移动设备书签']);
  assert.equal(all.extras.length, 0);
  assert.equal(all.records.find(record => record.title === 'Old').bookmarkFolder, '其他书签 / 归档');
});
test('empty bar still provides a usable placeholder', () => {
  const catalog = bookmarkColumns([]);
  assert.equal(catalog.columns.length,1); assert.equal(catalog.records.length,1);
  assert.equal(catalog.records[0].bookmarkUrl,undefined);
});
test('folder type supports multiple modern local/account bookmark bars', () => {
  const result=bookmarkColumns([{id:'root',title:'',children:[
    {id:'local',title:'',folderType:'bookmarks-bar',children:[{id:'a',title:'A',url:'https://a.test'}]},
    {id:'account',title:'',folderType:'bookmarks-bar',children:[{id:'b',title:'B',url:'https://b.test'}]},
  ]}]);
  assert.deepEqual(result.records.map(r=>r.title),['A','B']);
});
test('bookmarklet and unsafe URL schemes cannot execute', () => {
  for (const value of ['javascript:alert(1)','data:text/html,test','vbscript:test','invalid']) assert.equal(bookmarkTarget(value),undefined);
  assert.equal(bookmarkTarget('https://example.com'), 'https://example.com/');
});
test('variable folder lengths including over 32 entries loop without cross-folder selection', () => {
  const catalog=bookmarkColumns(tree); installBookmarkCatalog(catalog.records,catalog.columns);
  for (let lane=-10;lane<10;lane++) for(let row=-100;row<100;row++) {
    const i=fileAtCell({lane,row}); assert.ok(Number.isInteger(i));
    assert.equal(records[i].category,catalog.columns[((lane%4)+4)%4]);
  }
  const last=columnFiles(3).at(-1),first=columnFiles(3)[0];
  const next=selectionCell(first,{lane:3,row:56},{axis:'row',direction:1});
  assert.equal(fileAtCell(next),first); assert.equal(records[last].title,'项44');
});
test('large catalogs are indexed once and expose every bookmark', () => {
  const catalog=bookmarkColumns([{id:'0',title:'',children:[{id:'1',title:'',children:[{id:'f',title:'大型目录',children:Array.from({length:2000},(_,i)=>({id:`b${i}`,title:`书签${i}`,url:`https://example.com/${i}`}))}]}]}]);
  installBookmarkCatalog(catalog.records,catalog.columns);
  // The bar holds only this folder, so it is the first column.
  assert.deepEqual(catalog.columns,['大型目录']);
  assert.equal(columnFiles(0).length,2000);
  assert.equal(columnFiles(0),columnFiles(0), 'Reuse cached column indexes during rendering');
  assert.equal(records[fileAtCell({lane:0,row:2011})].title,'书签1999');
  assert.equal(records[fileAtCell({lane:0,row:2012})].title,'书签0');
});


test('bookmark names stay verbatim, including empty names and URL-looking titles', () => {
  const names = ['', '  自定义备注  ', 'https://my-saved-title.example/', '工作 <>&'];
  const catalog = bookmarkColumns([{ id: '0', title: '', children: [{ id: '1', title: '', children: names.map((title, i) => ({ id: String(i + 2), title, url: 'https://different-host.example/' })) }] }]);
  assert.deepEqual(catalog.records.map(record => record.title), names);
});


test('startup choices never expose an unprepared scene and full replay stays full', () => {
  assert.equal(normalizeStartupMode('broken'), 'daily');
  assert.equal(normalizeStartupMode(null), 'daily', 'Users who never chose get the daily opening');
  for (const mode of ['full', 'brief', 'direct']) assert.equal(normalizeStartupMode(mode), mode, 'An explicit choice is kept');
  for (const mode of ['full', 'brief', 'direct']) assert.equal(bookmarkStartupReady(mode, 100, false), false);
  assert.equal(bookmarkStartupReady('full', 100, true), false);
  assert.equal(bookmarkStartupReady('brief', 2, true), false);
  assert.equal(bookmarkStartupReady('brief', 3, true), true);
  assert.equal(bookmarkStartupReady('direct', 0, true), true);
});
test('daily opening plays the full film once per local day, then the brief one', () => {
  const today = localDate(new Date(2026, 8, 30, 23, 59));
  assert.equal(today, '2026-09-30');
  assert.equal(resolveOpeningMode('daily', null, today), 'full');
  assert.equal(resolveOpeningMode('daily', '2026-09-29', today), 'full');
  assert.equal(resolveOpeningMode('daily', today, today), 'brief');
  assert.equal(resolveOpeningMode('full', today, today), 'full');
  assert.equal(resolveOpeningMode('direct', null, today), 'direct');
  assert.equal(localDate(new Date(2026, 9, 1, 0, 0)), '2026-10-01');
});
test('unnamed bookmark body uses its URL without modifying the spine title', () => {
  const record = { title: '', bookmarkUrl: 'https://example.com/path', abstract: 'raw' };
  assert.equal(bookmarkDisplayTitle(record), record.bookmarkUrl);
  assert.equal(record.title, '');
  assert.equal(bookmarkDisplayTitle({ ...record, title: '自定义备注' }), '自定义备注');
  assert.equal(bookmarkDisplayTitle({ title: '', abstract: 'chrome://settings' }), 'chrome://settings');
});
