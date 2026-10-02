// Real 3D rendering with explicitly marked demo bookmarks. The HTTP preview
// uses a tab-API spy; a separate unpacked-extension check covers browser focus.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.env.DISPATCH_ROOT || 'release/extension');
const output = resolve('verification/extension-0.8.7');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  const path = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname.replace(/^\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Content-Security-Policy': manifest.content_security_policy.extension_pages }).end(await readFile(path)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const errors = [], results = [];
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await context.addInitScript(() => {
  localStorage.setItem('rhine-user-name', JSON.stringify({ name: 'TESTER', confirmed: true }));
  localStorage.setItem('rhine-bookmark-startup', 'direct');
  localStorage.setItem('rhine-settings', JSON.stringify({ sound: false, music: false, motion: 'full', reduced: false, renderPace: 'balanced', idleMotion: 'off' }));
  window.tabCalls = [];
  let next = 100;
  window.chrome ??= {};
  window.chrome.tabs = {
    getCurrent: async () => ({ id: 7, index: 0 }),
    create: async props => { const id = next++; window.tabCalls.push({ action: 'create', props, id, time: performance.now(), selected: window.rhine?.stats().selected }); return { id }; },
    update: async (id, props) => { const stats = window.rhine.stats(); window.tabCalls.push({ action: 'update', id, props, time: performance.now(), selected: stats.selected, mode: stats.mode, clarity: stats.decryption?.clarity }); },
  };
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const until = predicate => page.waitForFunction(predicate, undefined, { timeout: 20000 });
const stats = () => page.evaluate(() => window.rhine.stats());
const calls = () => page.evaluate(() => window.tabCalls);
const resetCalls = () => page.evaluate(() => { window.tabCalls = []; });
try {
  await page.goto(`http://127.0.0.1:${server.address().port}/?bookmarks-demo=1&scene=archive`);
  await until(() => window.rhine?.stats().ready && window.rhine.stats().loaded && window.rhine.stats().mode === 'archive');
  await page.waitForTimeout(4500);
  await page.screenshot({ path: resolve(output, 'reading-1920.png') });
  assert.equal(errors.length, 0, `Shader/page errors: ${errors.join('\n')}`);
  const initial = (await stats()).selected;
  await page.locator('#web-search').fill('资料');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(400);
  assert.equal((await stats()).selected, initial);
  assert.equal((await calls()).length, 0);
  await page.locator('.bookmark-search-all').click();
  // 45 titles plus MDN's "参考资料" folder path.
  await until(() => document.querySelectorAll('#search-results [data-result]').length === 46);
  assert.equal(await page.locator('#archive-search').inputValue(), '资料');
  assert.equal((await stats()).selected, initial);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  results.push('Typing/arrow browsing do not move the array; all 46 title/folder matches use the same index query');

  await page.locator('#web-search').fill('Three.js');
  const row = page.locator('[data-bookmark-id="13"]');
  await row.click({ modifiers: ['Control'] });
  await until(() => window.tabCalls.length === 1);
  assert.equal((await calls())[0].props.active, false);
  assert.equal((await stats()).selected, initial);
  await row.click({ button: 'middle' });
  await until(() => window.tabCalls.length === 2);
  assert.ok((await calls()).every(call => call.action === 'create' && call.props.active === false));
  assert.equal((await stats()).selected, initial);
  results.push('Ctrl and middle click on search results open only background tabs, leaving selection intact');

  await resetCalls();
  await row.click();
  await until(() => window.tabCalls.some(call => call.action === 'create'));
  assert.equal((await calls())[0].props.active, false);
  assert.equal((await calls()).filter(call => call.action === 'update').length, 0);
  await until(() => window.tabCalls.some(call => call.action === 'update'));
  const opened = await calls(), activated = opened.find(call => call.action === 'update');
  assert.equal(activated.mode, 'detail');
  assert.equal(activated.selected, 'X-004');
  assert.ok(activated.clarity >= .995);
  assert.ok(activated.time > opened[0].time + 500);
  await page.screenshot({ path: resolve(output, 'dispatch-complete.png') });
  results.push(`Foreground confirmation preloads then focuses after lift/decryption (${Math.round(activated.time - opened[0].time)}ms)`);

  await page.keyboard.press('Escape'); await page.waitForTimeout(3500);
  await resetCalls();
  await page.locator('#web-search').fill('GitHub');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await until(() => window.tabCalls.some(call => call.action === 'create'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1800);
  assert.equal((await calls()).filter(call => call.action === 'update').length, 0);
  assert.equal((await stats()).mode, 'archive');
  assert.equal((await stats()).bookmarkDispatch.pending, false);
  results.push('Escape cancels delayed activation without closing the already opened background tab');

  await page.locator('[data-action="search"]').click();
  await page.locator('#archive-search').fill('开发 github');
  assert.equal(await page.locator('#search-results [data-result]').count(), 0);
  await page.locator('#archive-search').fill('GitHub');
  await resetCalls();
  await page.locator('#search-results [data-result="0"]').click({ button: 'middle' });
  await until(() => window.tabCalls.length === 1);
  assert.equal((await calls())[0].props.active, false);
  assert.ok(await page.locator('#archive-search').isVisible());
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  results.push('Archive index shares normalized search and middle-click keeps the directory open');

  await page.evaluate(() => { document.querySelector('#web-search').value = ''; document.activeElement?.blur(); });
  await page.locator('[data-action="settings"]').hover();
  await until(() => window.rhine.stats().renderCadence.settled);
  // The cadence can settle before the final float-level damping tail does.
  await page.waitForTimeout(3000);
  const settled = await stats();
  await page.waitForTimeout(4000);
  const later = await stats();
  assert.equal(later.renderedFrames, settled.renderedFrames, 'HUD focus must preserve static canvas reuse');
  results.push('HUD quiet zones preserve static-frame reuse: zero 3D redraws in a four-second settled sample');
  await page.setViewportSize({ width: 1366, height: 768 }); await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(output, 'reading-1366.png') });
  await page.setViewportSize({ width: 900, height: 1200 }); await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(output, 'reading-portrait.png') });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.locator('[data-action="settings"]').click();
  const appearanceGroup = page.locator('details').filter({ has: page.locator('[data-color-theme="dark"]') }).first();
  if (await appearanceGroup.getAttribute('open') === null) await appearanceGroup.locator('summary').first().click();
  await page.locator('[data-color-theme="dark"]').click();
  await page.locator('[data-action="close-modal"]').click();
  await page.waitForTimeout(2400);
  await page.screenshot({ path: resolve(output, 'reading-dark.png') });
  results.push('HUD/spine rendering checked at 1920×1080, 1366×768, portrait and dark theme');
  assert.equal(errors.length, 0, `Page errors: ${errors.join('\n')}`);
  console.log(JSON.stringify({ version: manifest.version, browser: browser.version(), results, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: resolve(output, 'failure.png') });
  console.log(JSON.stringify({ error: String(error), stats: await stats(), rows: await page.locator('#search-results button').count(), query: await page.locator('#archive-search').inputValue().catch(() => null), text: await page.locator('#modal-root').innerText() }, null, 2));
  throw error;
} finally {
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ version: manifest.version, results, errors }, null, 2));
  await browser.close(); await new Promise(done => server.close(done));
}
