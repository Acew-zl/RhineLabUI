import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bookmarkColumns, bookmarkTarget } from '../src/bookmark-data.ts';
import { installBookmarkCatalog, records, columnFiles } from '../src/data.ts';
import { fileAtCell, selectionCell } from '../src/archive-loop.ts';
import { searchTarget, createBookmarkSearch } from '../src/bookmark-search.ts';
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
