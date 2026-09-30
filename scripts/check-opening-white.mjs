// The white fade at the end of the opening (video 26.16–26.88 s) must cover the whole
// display at every aspect ratio. Serves the built extension with WebGL disabled, seeks
// to the white peak, stops the frame loop and measures the white layer against the page.
//   PLAYWRIGHT_MODULE=... [BROWSER_CHANNEL=msedge | BROWSER_PATH=...] [WHITE_OUTPUT=dir] node scripts/check-opening-white.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.env.WHITE_ROOT || 'release/extension');
const output = process.env.WHITE_OUTPUT && resolve(process.env.WHITE_OUTPUT);
if (output) await mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  const path = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname.replace(/^\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try { response.writeHead(200, { 'Content-Type': types[extname(path)] ?? 'application/octet-stream' }).end(await readFile(path)); }
  catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}),
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
  args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-software-rasterizer'],
});
// 16:9, a 1080p browser window below its toolbars, ultrawide, 16:10, laptop, phones.
const sizes = ['1920x1080', '1920x960', '2560x1080', '1440x900', '1280x800', '1366x768', '390x844', '844x390'];
const themes = ['light', 'dark'];
const results = [];
try {
  for (const theme of themes) for (const size of sizes) {
    const [width, height] = size.split('x').map(Number);
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addInitScript(colorTheme => {
      localStorage.setItem('rhine-user-name', JSON.stringify({ name: 'TESTER', confirmed: true }));
      localStorage.setItem('rhine-bookmark-startup', 'full');
      localStorage.setItem('rhine-settings', JSON.stringify({ colorTheme }));
    }, theme);
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}/?bookmarks-demo=1`);
    await page.waitForFunction(() => window.rhine?.stats?.().startup === 'started' && window.rhine.stats().ready, undefined, { timeout: 60000 });
    await page.waitForTimeout(1200); // loading overlay fade
    const probe = await page.evaluate(() => new Promise(done => {
      window.rhine.seek(21.7);
      const white = document.querySelector('.boot-white');
      const check = () => {
        if (Number(getComputedStyle(white).opacity) <= 0.9) { requestAnimationFrame(check); return; }
        window.requestAnimationFrame = () => 0;
        const box = white.getBoundingClientRect();
        done({ mode: window.rhine.stats().mode, layout: document.querySelector('#stage').dataset.layout,
          gaps: [Math.max(0, box.left), Math.max(0, box.top), Math.max(0, innerWidth - box.right), Math.max(0, innerHeight - box.bottom)].map(v => Math.round(v * 10) / 10) });
      };
      requestAnimationFrame(check);
    }));
    if (output) await page.screenshot({ path: `${output}/${theme}-${size}.png` });
    await ctx.close();
    assert.equal(probe.mode, 'boot', `${theme} ${size}: still in the opening`);
    assert.equal(probe.layout, 'opening', `${theme} ${size}: opening layout`);
    assert.deepEqual(probe.gaps, [0, 0, 0, 0], `${theme} ${size}: white gaps left/top/right/bottom ${probe.gaps.join('/')}`);
    results.push(`${theme} ${size}`);
  }
  console.log(`Opening white covers the display: ${results.length} cases (${sizes.join(', ')}; light and dark).`);
} finally {
  await browser.close();
  server.close();
}
