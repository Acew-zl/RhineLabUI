import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const chromeStore = process.argv.includes('--chrome-store');
const root = resolve(chromeStore ? 'release/extension-chrome' : 'release/extension');
const files = (await readdir(root, { recursive: true })).map(p => p.replaceAll('\\', '/'));
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.chrome_url_overrides.newtab, 'index.html');
assert.deepEqual(manifest.permissions?.toSorted(), chromeStore ? ['bookmarks', 'favicon', 'search'] : ['bookmarks', 'favicon']);
assert.equal(manifest.version, chromeStore ? '0.8.3' : '0.8.2');
assert.equal(manifest.host_permissions?.length ?? 0, 0);
assert.ok(!manifest.background, 'No permanent background process is needed');
for (const path of Object.values(manifest.icons)) await access(join(root, path));
const html = await readFile(join(root, 'index.html'), 'utf8');
assert.ok(!/rel="manifest"|\son\w+\s*=|<script(?![^>]*\bsrc=)[^>]*>/i.test(html));
assert.ok(!files.some(p => /^(sw\.js|manifest\.webmanifest|pwa-build\.json|update\.html)$/.test(p)));
assert.ok(!files.some(p => /(^|\/)(novecento|node_modules|art|reference|verification)(\/|$)|\.blend$/.test(p)));
for (const model of ['cassette', 'assembly'])
  assert.ok(files.some(p => new RegExp(`^assets/archive-${model}\\.[a-f0-9]+\\.glb$`).test(p)));
for (const name of ['atmosphere', 'motif', 'pulse']) await access(join(root, `audio/${name}.ogg`));
const scripts = await Promise.all(files.filter(p => p.endsWith('.js')).map(p => readFile(join(root, p), 'utf8')));
if (chromeStore) {
  assert.ok(scripts.some(script => script.includes('chrome?.search') && script.includes('.query(')), 'Chrome build must call the default-provider search API');
  assert.ok(!scripts.some(script => /www\.(bing|google|baidu)\.com\/(?:search|s\?)/.test(script)), 'Chrome build must not bundle hard-coded search providers');
  assert.ok(!scripts.some(script => script.includes('rhine-search-engine')), 'Chrome build must not save an independent search provider');
  assert.ok(!scripts.some(script => script.includes('data-search-engine')), 'Chrome build must not offer an independent provider selector');
} else {
  assert.ok(scripts.some(script => script.includes('rhine-search-engine')), 'Full build keeps the user-selectable search providers');
}
// Verify every generated CSS font/image reference resolves inside the package.
for (const file of files.filter(p => p.endsWith('.css'))) {
  const css = await readFile(join(root, file), 'utf8');
  for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
    const url = match[1];
    if (url.startsWith('data:') || url.startsWith('#')) continue;
    assert.ok(!/^(?:https?:)?\/\//.test(url), `Remote asset: ${url}`);
    const local = new URL(url, `https://extension.invalid/${file}`).pathname;
    await access(join(root, decodeURIComponent(local)));
  }
}
console.log('Extension package checks passed: local assets, CSP entry, no PWA or extra permissions.');
