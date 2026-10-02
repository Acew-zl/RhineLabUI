// Uses an isolated Edge profile under release/, never the user's bookmarks/profile.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const extension = resolve(process.env.DISPATCH_ROOT || 'release/extension');
const output = resolve('release/review-0.8.7/native');
await mkdir(output, { recursive: true });
const requests = [];
const server = createServer((req, res) => { requests.push({ path: req.url, time: Date.now() }); res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><title>Dispatch test destination</title><p>TEST DESTINATION READY</p>'); });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const context = await chromium.launchPersistentContext(resolve(output, `edge-profile-${Date.now()}`), {
  channel: 'msedge', headless: true, viewport: { width: 1920, height: 1080 },
  ignoreDefaultArgs: ['--disable-extensions'], args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
const report = { results: [], requests, errors: [] };
await context.addInitScript(() => {
  localStorage.setItem('rhine-user-name', JSON.stringify({ name: 'TESTER', confirmed: true }));
  localStorage.setItem('rhine-bookmark-startup', 'direct');
  localStorage.setItem('rhine-settings', JSON.stringify({ sound: false, music: false, motion: 'full', renderPace: 'balanced', idleMotion: 'off' }));
});
const page = context.pages()[0] || await context.newPage();
page.on('pageerror', error => report.errors.push(error.message));
try {
  await page.goto('chrome://newtab/');
  await page.waitForFunction(() => window.rhine && window.chrome?.runtime?.id, undefined, { timeout: 45000 });
  report.extensionId = await page.evaluate(() => chrome.runtime.id);
  const fixture = await page.evaluate(async base => {
    const roots = await chrome.bookmarks.getTree();
    const bar = roots[0].children.find(node => node.folderType === 'bookmarks-bar' || node.id === '1');
    const first = await chrome.bookmarks.create({ parentId: bar.id, title: '验证主页', url: base + '/fixture-a' });
    const folder = await chrome.bookmarks.create({ parentId: bar.id, title: '验证文件夹' });
    const target = await chrome.bookmarks.create({ parentId: folder.id, title: '验证书签', url: base + '/fixture-b' });
    return { first, target };
  }, base);
  await page.reload();
  await page.waitForFunction(() => window.rhine?.stats().ready && window.rhine.stats().loaded, undefined, { timeout: 60000 });
  const owner = await page.evaluate(() => chrome.tabs.getCurrent());
  await page.evaluate(() => {
    window.nativeDispatchCalls = [];
    const create = chrome.tabs.create.bind(chrome.tabs), update = chrome.tabs.update.bind(chrome.tabs);
    chrome.tabs.create = async props => { const tab = await create(props); window.nativeDispatchCalls.push({ action: 'create', props, id: tab.id, time: performance.now() }); return tab; };
    chrome.tabs.update = async (id, props) => { const s = rhine.stats(); window.nativeDispatchCalls.push({ action: 'update', id, props, time: performance.now(), mode: s.mode, clarity: s.decryption.clarity }); return update(id, props); };
  });
  await page.locator('#web-search').fill('验证书签');
  const newPage = context.waitForEvent('page');
  const confirmedAt = Date.now();
  await page.locator(`[data-bookmark-id="${fixture.target.id}"]`).click();
  const destination = await newPage;
  await destination.waitForURL(base + '/fixture-b');
  await destination.waitForLoadState('domcontentloaded');
  assert.equal(await page.evaluate(() => document.hidden), false, 'Start page remains active while target loads');
  assert.equal(await page.evaluate(() => rhine.stats().bookmarkDispatch.pending), true);
  const current = await page.evaluate(() => chrome.tabs.query({ active: true, currentWindow: true }));
  assert.equal(current[0].id, owner.id);
  await page.waitForFunction(() => window.nativeDispatchCalls.some(call => call.action === 'update'), undefined, { timeout: 18000 });
  report.nativeCalls = await page.evaluate(() => window.nativeDispatchCalls);
  const active = await page.evaluate(() => chrome.tabs.query({ active: true, currentWindow: true }));
  assert.equal(active[0].id, report.nativeCalls.find(call => call.action === 'create').id);
  const state = await page.evaluate(() => rhine.stats());
  assert.equal(state.mode, 'detail'); assert.ok(state.decryption.clarity >= .995);
  assert.ok(requests.some(req => req.path === '/fixture-b' && req.time >= confirmedAt));
  report.results.push('Real tabs.create(active:false) loads the destination while the start page remains active; tabs.update focuses it after decryption');
  report.confirmedToFocusMs = Date.now() - confirmedAt;
  await page.bringToFront(); await page.keyboard.press('Escape');
  await page.waitForTimeout(4000);
  await page.locator('#web-search').fill('验证主页');
  const background = context.waitForEvent('page');
  await page.locator(`[data-bookmark-id="${fixture.first.id}"]`).click({ modifiers: ['Control'] });
  await (await background).waitForURL(base + '/fixture-a');
  assert.equal(await page.evaluate(() => document.hidden), false);
  report.results.push('Real Ctrl-click background opening preserves browser focus');
  await page.keyboard.press('Escape'); await page.locator('#web-search').fill(''); await page.locator('#web-search').blur();
  const before = await page.evaluate(() => rhine.stats().selected);
  const point = await page.evaluate(() => {
    const s = rhine.stats(), host = document.querySelector('#three-scene'), b = host.getBoundingClientRect();
    return { x: b.left + (s.labelTopLeft[0] + 20) * b.width / host.clientWidth, y: b.top + (s.labelTopLeft[1] + s.labelBottomLeft[1]) / 2 * b.height / host.clientHeight };
  });
  const cardTab = context.waitForEvent('page');
  await page.mouse.click(point.x, point.y, { button: 'middle' });
  await (await cardTab).waitForLoadState('domcontentloaded');
  assert.equal(await page.evaluate(() => document.hidden), false);
  assert.equal(await page.evaluate(() => rhine.stats().selected), before);
  report.results.push('Real middle-click on the physical 3D card opens a background tab without changing selection');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} catch (error) { report.failure = String(error); report.state = await page.evaluate(async () => ({ stats: window.rhine?.stats(), hidden: document.hidden, active: await chrome.tabs.query({ active: true, currentWindow: true }) })).catch(() => null); console.log(JSON.stringify(report, null, 2)); throw error; }
finally { await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2)); await context.close(); await new Promise(done => server.close(done)); }
