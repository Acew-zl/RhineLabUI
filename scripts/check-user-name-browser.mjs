import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.env.USER_NAME_ROOT || 'release/extension');
const output = resolve(process.env.USER_NAME_OUTPUT || 'verification/user-name');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const server = createServer(async (request, response) => {
  const path = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname.replace(/^\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    response.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream', 'Content-Security-Policy': manifest.content_security_policy.extension_pages }).end(await readFile(path));
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [], results = [];
const url = `http://127.0.0.1:${server.address().port}/?bookmarks-demo=1`;
async function newCase(startup = 'full', reduced = false, width = 1920, height = 1080) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(({ startup, reduced }) => {
    if (!localStorage.getItem('rhine-settings')) localStorage.setItem('rhine-settings', JSON.stringify({ sound: false, music: false, reduced, renderPace: 'efficient' }));
    if (!localStorage.getItem('rhine-bookmark-startup')) localStorage.setItem('rhine-bookmark-startup', startup);
  }, { startup, reduced });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  return { context, page };
}
const ready = page => page.waitForFunction(() => window.rhine?.stats().ready, undefined, { timeout: 90000 });
const waiting = page => page.waitForFunction(() => window.rhine?.stats().identity.waiting, undefined, { timeout: 90000 });
const profile = page => page.evaluate(() => JSON.parse(localStorage.getItem('rhine-user-name')));
try {
  const { context, page } = await newCase();
  await waiting(page);
  assert.equal(await page.locator('#boot-user-name').getAttribute('placeholder'), 'JOYCE MOORE');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'boot-user-name');
  await page.waitForTimeout(1700);
  assert.ok(Math.abs((await page.evaluate(() => rhine.stats().bootTime)) - 13.56) < .15, 'Opening must remain paused while typing');
  assert.equal(await profile(page), null);
  await page.screenshot({ path: resolve(output, 'first-use.png') });
  await page.locator('#boot-user-name').fill('研究员 <Ace> 👩🏽‍🔬');
  await page.locator('#boot-user-name').evaluate(input => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', isComposing: true }));
  });
  assert.equal(await profile(page), null, 'IME candidate Enter must not confirm the form');
  await page.locator('#boot-user-name').evaluate(input => input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true })));
  await page.keyboard.press('Enter');
  assert.equal((await profile(page)).name, '研究员 <Ace> 👩🏽‍🔬');
  assert.equal((await profile(page)).confirmed, true);
  assert.equal(await page.locator('#user-name-prompt').isVisible(), false);
  await page.waitForTimeout(200);
  assert.ok((await page.locator('#auth-message').textContent()).includes('研究员 <Ace> 👩🏽‍🔬'));
  await page.screenshot({ path: resolve(output, 'confirmed.png') });
  await ready(page);
  await page.evaluate(() => rhine.archive());
  await page.locator('[data-action="settings"]').first().click();
  await page.locator('.bookmark-settings-group summary').filter({ hasText: '03 / 启动与动效' }).click();
  await page.locator('#display-name').fill('Acew-zl');
  await page.locator('#display-name').press('Enter');
  assert.equal((await profile(page)).name, 'Acew-zl');
  assert.equal(await page.locator('.settings-intro [data-user-name]').textContent(), 'Acew-zl');
  await page.locator('#display-name').evaluate(input => input.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: resolve(output, 'settings.png') });
  await page.locator('[data-action="close-modal"]').click();
  assert.equal(await page.locator('.system-footer [data-user-name]').textContent(), 'Acew-zl');
  await page.reload();
  await page.waitForFunction(() => window.rhine?.stats().startup === 'started', undefined, { timeout: 90000 });
  await page.evaluate(() => rhine.seek(8.56));
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#user-name-prompt').isVisible(), false);
  assert.ok((await page.locator('#auth-message').textContent()).includes('Acew-zl'));
  // Existing open tabs share only the local terminal identity.
  const other = await context.newPage();
  other.on('pageerror', error => errors.push(error.message));
  await other.goto(url);
  await other.evaluate(() => localStorage.setItem('rhine-user-name', JSON.stringify({ name: '另一位研究员', confirmed: true })));
  await page.waitForFunction(() => document.querySelector('.system-footer [data-user-name]').textContent === '另一位研究员');
  await page.reload();
  await page.waitForFunction(() => window.rhine?.stats().startup === 'started', undefined, { timeout: 90000 });
  await page.evaluate(() => rhine.seek(8.56));
  await page.waitForTimeout(200);
  assert.ok((await page.locator('#auth-message').textContent()).includes('另一位研究员'), 'Saved non-Latin names must be available in the next opening');
  results.push('full opening, paused time, custom Unicode, IME, settings, reopening and cross-tab sync');
  await context.close();
  for (const [startup, reduced, width, height] of [['direct', false, 1440, 900], ['brief', false, 1366, 768], ['full', true, 1920, 1080]]) {
    const { context, page } = await newCase(startup, reduced, width, height);
    await waiting(page);
    const box = await page.locator('#boot-user-name').boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width && box.y > 0 && box.y < height, 'Name input must fit the opening');
    await page.locator('#boot-user-name').press('Enter');
    assert.deepEqual(await profile(page), { name: 'JOYCE MOORE', confirmed: true });
    await ready(page);
    await page.waitForFunction(() => rhine.stats().mode === 'archive');
    assert.equal(await page.evaluate(() => localStorage.getItem('rhine-bookmark-startup')), startup);
    await page.reload();
    await ready(page);
    assert.equal(await page.locator('#user-name-prompt').isVisible(), false);
    results.push(`${startup}, reduced=${reduced}: blank default remembered, first-use setup respects later startup preference`);
    await context.close();
  }
  const skipped = await newCase();
  await skipped.page.waitForFunction(() => window.rhine?.stats().startup === 'started', undefined, { timeout: 90000 });
  await skipped.page.locator('#skip').click();
  await waiting(skipped.page);
  await skipped.page.locator('#boot-user-name').press('Enter');
  await ready(skipped.page);
  await skipped.page.waitForFunction(() => rhine.stats().mode === 'archive');
  results.push('first-use skip still offers Enter confirmation before entering archives');
  await skipped.context.close();
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ passed: true, version: manifest.version, browser: browser.version(), root, results, errors }, null, 2));
  console.log(JSON.stringify({ passed: true, version: manifest.version, results, errors }, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
