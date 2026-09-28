import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = resolve(process.env.PERFORMANCE_ROOT || 'release/extension');
const output = resolve(process.env.PERFORMANCE_OUTPUT || 'verification/newtab-performance');
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const server = createServer(async (request, response) => {
  const path = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname.replace(/^\/$/, '/index.html'));
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    const bytes = await readFile(path);
    response.writeHead(200, {
      'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.ogg': 'audio/ogg', '.svg': 'image/svg+xml' })[extname(path)] || 'application/octet-stream',
      'Content-Security-Policy': manifest.content_security_policy.extension_pages,
    }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const browserSession = await browser.newBrowserCDPSession();
async function sampleGpu() {
  if (process.env.GPU_COUNTERS !== '1') return null;
  const { processInfo } = await browserSession.send('SystemInfo.getProcessInfo');
  const gpu = processInfo.find(process => process.type === 'GPU');
  assert.ok(gpu, 'The browser must expose its GPU process for WDDM sampling');
  const { stdout } = await promisify(execFile)('pwsh.exe', ['-NoProfile', '-File', resolve('scripts/sample-gpu.ps1'), '-ProcessId', String(gpu.id), '-Samples', '8'], { windowsHide: true, timeout: 30000 });
  const samples = JSON.parse(stdout);
  assert.ok(samples.some(sample => sample.engines.length), 'The GPU process must have an observable 3D engine');
  return { processId: gpu.id, mean: samples.reduce((sum, sample) => sum + sample.process3d, 0) / samples.length, samples };
}
const results = [], errors = [];
try {
  for (const pace of (process.env.PACE_CASES || 'display,balanced,efficient').split(',')) {
    const context = await browser.newContext({ viewport: { width: 2048, height: 1280 }, deviceScaleFactor: 1.25 });
    await context.addInitScript(pace => {
      if (!localStorage.getItem('rhine-settings')) localStorage.setItem('rhine-settings', JSON.stringify({ sound: false, music: false, reduced: false, renderPace: pace }));
    }, pace);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?bookmarks-demo=1&scene=archive`);
    await page.waitForFunction(() => window.rhine?.stats().ready, undefined, { timeout: 90000 });
    await page.waitForTimeout(7000);
    console.log(`${pace}: sampling idle`);
    const before = await page.evaluate(() => rhine.stats());
    const counters = sampleGpu();
    const start = Date.now();
    await page.waitForTimeout(8000);
    const after = await page.evaluate(() => rhine.stats());
    const idleSeconds = (Date.now() - start) / 1000;
    const gpu = await counters;
    const idle = { seconds: idleSeconds, renders: after.renderedFrames - before.renderedFrames, reportedFps: after.fps };
    idle.rendersPerSecond = idle.renders / idle.seconds;
    console.log(`${pace}: sampling continuous pointer input`);
    const activeBefore = await page.evaluate(() => rhine.stats());
    const activeStart = Date.now();
    for (let i = 0; i < 120; i++) { await page.mouse.move(750 + i % 30, 500 + i % 20); await page.waitForTimeout(25); }
    const activeAfter = await page.evaluate(() => rhine.stats());
    const active = { seconds: (Date.now() - activeStart) / 1000, renders: activeAfter.renderedFrames - activeBefore.renderedFrames, reportedFps: activeAfter.fps };
    active.rendersPerSecond = active.renders / active.seconds;
    const rendering = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map(canvas => {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return null;
      const debug = gl.getExtension('WEBGL_debug_renderer_info');
      return { width: canvas.width, height: canvas.height, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
    }).filter(Boolean));
    if (pace !== 'display') {
      assert.ok(idle.rendersPerSecond <= (pace === 'balanced' ? 31 : 16));
      assert.ok(active.rendersPerSecond <= (pace === 'balanced' ? 61 : 31), 'Continuous input must not bypass the cap');
    }
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1500);
    assert.notEqual((await page.evaluate(() => rhine.stats())).selected, activeAfter.selected);
    const result = { pace, idle, active, gpu, rendering, renderCadence: after.renderCadence };
    results.push(result);
    await page.screenshot({ path: resolve(output, `${pace}.png`) });
    await writeFile(resolve(output, 'results.json'), JSON.stringify({ passed: false, browser: browser.version(), viewport: { width: 2048, height: 1280, deviceScaleFactor: 1.25 }, errors, results }, null, 2));
    console.log(JSON.stringify({ pace, idleFps: idle.rendersPerSecond, activeFps: active.rendersPerSecond, gpu3d: gpu?.mean, renderCadence: after.renderCadence }));
    // The setting is reachable through the real UI and persists after reload.
    if (pace === 'balanced') {
      await page.locator('[data-action="inspect-bookmark"]').click();
      await page.waitForFunction(() => rhine.stats().cameraDetail > .95, undefined, { timeout: 10000 });
      await page.evaluate(() => rhine.archive());
      await page.waitForFunction(() => rhine.stats().cameraDetail < .05, undefined, { timeout: 10000 });
      await page.locator('[data-action="settings"]').first().click();
      await page.locator('.bookmark-settings-group summary').filter({ hasText: '04 / 画面与性能' }).click();
      await page.locator('#render-pace').selectOption('efficient');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('rhine-settings')).renderPace), 'efficient');
      await page.screenshot({ path: resolve(output, 'settings.png') });
      await page.reload();
      await page.waitForFunction(() => window.rhine?.stats().ready, undefined, { timeout: 90000 });
      assert.equal((await page.evaluate(() => rhine.stats())).renderCadence.pace, 'efficient');
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ passed: true, browser: browser.version(), viewport: { width: 2048, height: 1280, deviceScaleFactor: 1.25 }, errors, results }, null, 2));
} finally { await browser.close(); server.close(); }
