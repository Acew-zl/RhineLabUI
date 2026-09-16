import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookmarkColumns, bookmarkTarget } from '../src/bookmark-data.ts';
import { installBookmarkCatalog, records, columnFiles } from '../src/data.ts';
import { fileAtCell, selectionCell } from '../src/archive-loop.ts';
import { searchTarget, createBookmarkSearch } from '../src/bookmark-search.ts';
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
test('web search encodes queries and only navigates HTTP(S) URLs directly', () => {
  assert.equal(searchTarget('   '),undefined);
  assert.equal(searchTarget('example.com/a'), 'https://example.com/a');
  assert.equal(searchTarget('https://example.com/a?q=x'), 'https://example.com/a?q=x');
  assert.equal(searchTarget('莱茵 生命 & logo', 'google'), 'https://www.google.com/search?q=' + encodeURIComponent('莱茵 生命 & logo'));
  assert.equal(searchTarget('javascript:alert(1)'), 'https://www.bing.com/search?q=javascript%3Aalert(1)');
  assert.equal(searchTarget('example.com?q=a#b'), 'https://example.com/?q=a#b');
  assert.equal(searchTarget('localhost:5190/a'), 'https://localhost:5190/a');
  assert.equal(searchTarget('http://127.0.0.1:5190/'), 'http://127.0.0.1:5190/');
  assert.equal(searchTarget('someone@example.com'), 'https://www.bing.com/search?q=someone%40example.com');
  assert.equal(searchTarget('data:text/html,<script>'), 'https://www.bing.com/search?q=data%3Atext%2Fhtml%2C%3Cscript%3E');
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
  assert.equal(columnFiles(1).length,2000);
  assert.equal(columnFiles(1),columnFiles(1), 'Reuse cached column indexes during rendering');
  assert.equal(records[fileAtCell({lane:1,row:2011})].title,'书签1999');
  assert.equal(records[fileAtCell({lane:1,row:2012})].title,'书签0');
});
