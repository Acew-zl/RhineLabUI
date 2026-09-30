// 0.8.6 everyday-use checks against the built extension, served with its CSP and the
// explicitly marked demo bookmarks. WebGL is disabled so the 2D fallback is exercised
// and every case runs quickly; the 3D paths are covered by the unit tests and the
// verification record. Browser pages (chrome://) and "Other bookmarks" need the
// installed extension and are not part of this HTTP check.
//   PLAYWRIGHT_MODULE=... [BROWSER_CHANNEL=msedge | BROWSER_PATH=...] node scripts/check-extension-experience.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.env.EXPERIENCE_ROOT || 'release/extension');
const output = resolve(process.env.EXPERIENCE_OUTPUT || 'verification/extension-0.8.6');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  const path = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname.replace(/^\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream', 'Content-Security-Policy': manifest.content_security_policy.extension_pages }).end(await readFile(path));
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
  args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-software-rasterizer'],
});
const base = `http://127.0.0.1:${server.address().port}/?bookmarks-demo=1`;
const errors = [], results = [];
const stats = page => page.evaluate(() => window.rhine?.stats?.());
const until = (page, predicate, timeout = 60000) => page.waitForFunction(predicate, undefined, { timeout });
async function context(storage = {}, viewport = { width: 1366, height: 768 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(values => {
    // Seed once per browser context; later pages keep what earlier pages changed.
    if (localStorage.getItem('experience-check-seeded')) return;
    localStorage.setItem('experience-check-seeded', '1');
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  }, { 'rhine-user-name': { name: 'TESTER', confirmed: true }, ...storage });
  return ctx;
}
async function open(ctx) {
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  return page;
}
const archive = page => until(page, () => window.rhine?.stats().mode === 'archive' && window.rhine.stats().ready).then(() => page.waitForTimeout(1200));
try {
  // 1. Without WebGL the page still reaches a usable 2D interface.
  {
    const ctx = await context({ 'rhine-bookmark-startup': 'direct' });
    const page = await open(ctx);
    await archive(page);
    const s = await stats(page);
    assert.equal(s.threeState, 'off');
    assert.equal(s.preparation.phase, '2d');
    assert.match(await page.locator('.three-notice').innerText(), /三维显示暂不可用/);
    const first = s.selected;
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    assert.notEqual((await stats(page)).selected, first, 'Arrow keys still select bookmarks');
    await page.locator('.bookmark-inspect').dispatchEvent('click');
    await until(page, () => window.rhine.stats().mode === 'detail');
    assert.equal(await page.locator('[data-action="model-viewer"]').isVisible(), false, 'The 3D viewer entry is hidden');
    await page.keyboard.press('Escape');
    await page.screenshot({ path: resolve(output, 'fallback-2d.png') });
    await page.locator('.three-notice-close').click();
    assert.ok(await page.evaluate(() => Number(localStorage.getItem('rhine-three-notice-dismissed')) > 0));
    await ctx.close();
    results.push('2D fallback: archive, selection, details and dismissible notice without WebGL');
  }
  // 2. Search: ordinary words are searched; the other reading is one step down.
  {
    const ctx = await context({ 'rhine-bookmark-startup': 'direct', 'rhine-search-engine': 'bing' });
    const page = await open(ctx);
    await archive(page);
    const opened = [];
    await page.exposeFunction('recordOpen', url => opened.push(url));
    await page.evaluate(() => { window.open = url => { window.recordOpen(String(url)); return null; }; });
    const run = async (text, keys) => {
      await page.locator('#web-search').fill('');
      await page.locator('#web-search').focus();
      await page.keyboard.type(text);
      await page.waitForTimeout(200);
      const rows = await page.locator('#bookmark-suggestions [role=option]').allInnerTexts();
      for (const key of keys) await page.keyboard.press(key);
      await page.waitForTimeout(200);
      return { rows, url: opened.pop() };
    };
    assert.equal((await run('node.js', ['Enter'])).url, 'https://www.bing.com/search?q=node.js');
    const alternative = await run('node.js', ['ArrowDown', 'Enter']);
    assert.match(alternative.rows[0], /打开网址「node\.js」/);
    assert.equal(alternative.url, 'https://node.js/');
    assert.equal((await run('3.14', ['Enter'])).url, 'https://www.bing.com/search?q=3.14');
    assert.equal((await run('localhost:3000', ['Enter'])).url, 'http://localhost:3000/');
    assert.equal((await run('github.com', ['Enter'])).url, 'https://github.com/');
    const searchInstead = await run('github.com', ['ArrowDown', 'Enter']);
    assert.match(searchInstead.rows[0], /搜索「github\.com」/);
    assert.equal(searchInstead.url, 'https://www.bing.com/search?q=github.com');
    await page.locator('#web-search').fill('');
    await page.locator('#web-search').focus();
    await page.keyboard.type('node.js');
    await page.waitForTimeout(300);
    await page.screenshot({ path: resolve(output, 'search-alternative.png'), clip: { x: 380, y: 20, width: 620, height: 260 } });
    await ctx.close();
    results.push('Search: node.js/3.14 searched, localhost over HTTP, github.com opened, alternative row both ways');
  }
  // 3. Sound starts muted for everyone and the nav button restores the last combination.
  {
    const ctx = await context({ 'rhine-settings': { sound: true, music: true, bookmarkClarityVersion: 1 } });
    const page = await open(ctx);
    await until(page, () => window.rhine?.stats().startup === 'started');
    const s = await stats(page);
    assert.equal(s.startupMode, 'full', 'The first opening today is the full one');
    assert.deepEqual([s.audio.preferences.sound, s.audio.preferences.music], [false, false], 'Earlier default sound is migrated to muted');
    await archive(page);
    assert.equal(await page.evaluate(() => localStorage.getItem('rhine-bookmark-startup-full-date')), await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }));
    const button = page.locator('[data-action="toggle-sound"]');
    assert.equal(await button.getAttribute('data-muted'), 'true');
    await button.click();
    assert.equal(await button.getAttribute('data-muted'), 'false');
    assert.deepEqual(await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('rhine-settings')); return [p.sound, p.music]; }), [true, true]);
    await page.screenshot({ path: resolve(output, 'sound-button.png'), clip: { x: 900, y: 60, width: 466, height: 80 } });
    const second = await open(ctx);
    await until(second, () => window.rhine?.stats().startup === 'started');
    assert.equal((await stats(second)).startupMode, 'brief', 'Later openings today are brief');
    await ctx.close();
    results.push('Sound: migrated to muted, button toggles and persists; daily opening full then brief');
  }
  // 4. Open pages share settings and favorites; the motion and theme settings follow the system.
  {
    const ctx = await context({ 'rhine-bookmark-startup': 'direct' });
    const a = await open(ctx), b = await open(ctx);
    await archive(a); await archive(b);
    await a.locator('.settings-button').dispatchEvent('click');
    await a.locator('[data-color-theme="dark"]').waitFor({ state: 'attached' });
    await a.locator('[data-color-theme="dark"]').dispatchEvent('click');
    await until(b, () => window.rhine.stats().theme.choice === 'dark', 5000);
    await a.keyboard.press('Escape');
    await b.locator('[data-action="toggle-sound"]').dispatchEvent('click');
    await until(a, () => window.rhine.stats().audio.preferences.sound === true, 5000);
    const stored = await a.evaluate(() => JSON.parse(localStorage.getItem('rhine-settings')));
    assert.equal(stored.colorTheme, 'dark');
    assert.equal(stored.sound, true, 'Neither page undid the other page\'s change');
    await a.close(); await b.close();
    const c = await open(ctx);
    await c.emulateMedia({ reducedMotion: 'reduce' });
    await archive(c);
    // Media-query changes arrive with the next rendering update, which software
    // compositing can delay; wait for the state rather than a fixed time.
    await until(c, () => window.rhine.stats().motion.reduced === true, 15000);
    await c.emulateMedia({ reducedMotion: 'no-preference' });
    await until(c, () => window.rhine.stats().motion.reduced === false, 15000);
    assert.equal((await stats(c)).motion.preference, 'system', 'Follows the system live');
    await ctx.close();
    results.push('Sync: theme and sound shared between open pages; motion follows the system live');
  }
  // 5. Small screens: remaining labels are at least 12 display pixels; the nav never covers the search.
  {
    for (const viewport of [{ width: 1366, height: 768 }, { width: 1100, height: 700 }, { width: 1600, height: 1200 }]) {
      const ctx = await context({ 'rhine-bookmark-startup': 'direct' }, viewport);
      const page = await open(ctx);
      await archive(page);
      const small = await page.evaluate(() => {
        const found = [];
        const walker = document.createTreeWalker(document.querySelector('#stage'), NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const el = node.parentElement;
          if (!node.textContent.trim() || !el || el.closest('#boot')) continue;
          const rects = [...el.getClientRects()].filter(r => r.width > 3 && r.height > 3 && r.bottom > 0 && r.top < innerHeight);
          let opacity = 1; for (let e = el; e; e = e.parentElement) opacity *= +getComputedStyle(e).opacity;
          const size = parseFloat(getComputedStyle(el).fontSize) * (el.currentCSSZoom ?? 1);
          if (rects.length && opacity > .05 && size > 0 && size < 11.9) found.push(`${el.className || el.tagName}: ${size.toFixed(1)}px`);
        }
        return found;
      });
      assert.deepEqual(small, [], `${viewport.width}×${viewport.height} small text`);
      const overlap = await page.evaluate(() => {
        const s = document.querySelector('.bookmark-search').getBoundingClientRect(), n = document.querySelector('.system-nav').getBoundingClientRect();
        return !(s.right <= n.left || n.right <= s.left || s.bottom <= n.top || n.bottom <= s.top);
      });
      assert.equal(overlap, false, `${viewport.width}×${viewport.height} search/nav overlap`);
      await ctx.close();
    }
    results.push('Layout: no visible archive text below 12px and no search/nav overlap at 1366×768, 1100×700, 1600×1200');
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ passed: true, version: manifest.version, results, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, version: manifest.version, results }, null, 2));
} finally {
  await browser.close();
  server.close();
}
