import test from 'node:test';
import assert from 'node:assert/strict';
import { BookmarkDispatch } from '../src/bookmark-dispatch.ts';
import { backgroundBookmarkGesture, openBookmarkInBackground } from '../src/bookmark-navigation.ts';
import { bookmarkQuietZone } from '../src/bookmark-quiet-zones.ts';
import { createBookmarkSearch } from '../src/bookmark-search.ts';

function fixture() {
  const calls = [];
  let next = 10;
  return { calls, host: { open: (...args) => calls.push(['window', ...args]), location: { assign: url => calls.push(['assign', url]) }, tabs: {
    getCurrent: async () => ({ id: 7, index: 2 }),
    create: async props => { calls.push(['create', props]); return { id: next++ }; },
    update: async (id, props) => { calls.push(['update', id, props]); },
  }, fileAccess: async () => true } };
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const turn = () => new Promise(resolve => setImmediate(resolve));

test('confirmed dispatch loads a background page immediately and focuses only after presentation', async () => {
  const { calls, host } = fixture(), dispatch = new BookmarkDispatch(host), animation = deferred();
  const opening = dispatch.open('https://example.com/a', { mode: 'new-tab', present: () => animation.promise });
  await turn();
  assert.deepEqual(calls, [['create', { url: 'https://example.com/a', active: false, index: 3, openerTabId: 7 }]]);
  assert.ok(dispatch.pending);
  animation.resolve(true); await opening;
  assert.deepEqual(calls.at(-1), ['update', 10, { active: true }]);
  assert.equal(dispatch.pending, false);
});

test('cancel and hidden-page guard leave the destination in the background', async () => {
  for (const cancelled of [true, false]) {
    const { calls, host } = fixture(), dispatch = new BookmarkDispatch(host), animation = deferred();
    const opening = dispatch.open('https://example.com', { mode: 'new-tab', present: () => animation.promise, canActivate: () => false });
    await turn();
    if (cancelled) dispatch.cancel();
    animation.resolve(true); await opening;
    assert.equal(calls.filter(call => call[0] === 'create').length, 1);
    assert.equal(calls.filter(call => call[0] === 'update').length, 0);
    assert.equal(dispatch.pending, false);
  }
});

test('duplicate confirmations do not duplicate tabs; a newer target owns focus', async () => {
  const { calls, host } = fixture(), dispatch = new BookmarkDispatch(host), a = deferred(), b = deferred();
  const first = dispatch.open('https://example.com/a', { mode: 'new-tab', present: () => a.promise });
  await turn();
  await dispatch.open('https://example.com/a', { mode: 'new-tab', present: () => { throw Error('duplicate'); } });
  const second = dispatch.open('https://example.com/b', { mode: 'new-tab', present: () => b.promise });
  await turn(); a.resolve(true); b.resolve(true); await Promise.all([first, second]);
  assert.equal(calls.filter(call => call[0] === 'create').length, 2);
  assert.deepEqual(calls.filter(call => call[0] === 'update'), [['update', 11, { active: true }]]);
});

test('current-page preference waits for motion without creating an extra tab', async () => {
  const { calls, host } = fixture(), dispatch = new BookmarkDispatch(host), animation = deferred();
  const opening = dispatch.open('https://example.com', { mode: 'current-tab', present: () => animation.promise });
  await turn(); assert.equal(calls.length, 0);
  animation.resolve(true); await opening;
  assert.deepEqual(calls, [['assign', 'https://example.com/']]);
});

test('web preview and reduced/no-scene paths keep synchronous user activation', async () => {
  const { calls, host } = fixture(); delete host.tabs;
  const dispatch = new BookmarkDispatch(host);
  const opening = dispatch.open('https://example.com', { mode: 'new-tab', present: () => { throw Error('cannot stage in a web preview'); } });
  assert.equal(calls[0][0], 'window'); await opening;
  const ext = fixture(); await new BookmarkDispatch(ext.host).open('https://example.com', { mode: 'new-tab' });
  assert.equal(ext.calls[0][0], 'window');
});

test('background link gesture overrides current-page preference and respects local-file access', async () => {
  const { calls, host } = fixture();
  await openBookmarkInBackground('https://example.com', host);
  assert.equal(calls[0][1].active, false);
  await openBookmarkInBackground('javascript:alert(1)', host);
  await openBookmarkInBackground('file:///C:/notes.txt', { ...host, fileAccess: async () => false });
  assert.equal(calls.length, 1);
  const mouse = { button: 0, ctrlKey: true, metaKey: false };
  assert.ok(backgroundBookmarkGesture(mouse, false));
  assert.equal(backgroundBookmarkGesture(mouse, true), false);
  assert.ok(backgroundBookmarkGesture({ ...mouse, ctrlKey: false, metaKey: true }, true));
  assert.ok(backgroundBookmarkGesture({ ...mouse, button: 1 }, true));
  assert.equal(backgroundBookmarkGesture({ ...mouse, button: 2 }, false), false);
});

test('HUD quiet zones map screen coordinates correctly at zoomed/offset stages', () => {
  const bounds = { left: 100, top: 50, right: 1100, bottom: 550, width: 1000, height: 500 };
  const label = { left: 200, top: 400, right: 400, bottom: 450, width: 200, height: 50 };
  const zone = bookmarkQuietZone(label, bounds, 0);
  for (const [i, expected] of [.1, .2, .3, .3].entries()) assert.ok(Math.abs(zone[i] - expected) < 1e-9);
  const scaled = object => Object.fromEntries(Object.entries(object).map(([k,v]) => [k,v * 1.5]));
  assert.deepEqual(bookmarkQuietZone(scaled(label), scaled(bounds), 0), zone);
  assert.deepEqual(bookmarkQuietZone({ ...label, left: -300, right: -100 }, bounds), [2,2,2,2]);
});

test('both search surfaces share multi-token/width normalization and stable title ranking', () => {
  const bookmarks = [{ id: 'X-001', title: 'ＧｉｔＨｕｂ', bookmarkUrl: 'https://github.com', bookmarkFolder: '开发工具' }, { id: 'X-002', title: 'GitHub Docs', bookmarkUrl: 'https://docs.github.com', bookmarkFolder: '开发工具' }, { id: 'X-003', title: '脚本', bookmarkFolder: '开发工具' }];
  const top = createBookmarkSearch(bookmarks), index = createBookmarkSearch(bookmarks, { includeUnavailable: true });
  assert.deepEqual(top('开发 github', Infinity), index('开发 github', Infinity));
  assert.equal(top('github')[0], bookmarks[0]);
  assert.deepEqual(index('x-003'), [bookmarks[2]]);
  assert.deepEqual(top('x-003'), []);
});
