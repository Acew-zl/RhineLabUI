import { cp, copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';

// Vite owns this explicit output directory. Never copy the repo or private kits.
const chromeStore = process.argv.includes('--chrome-store');
const root = resolve(chromeStore ? 'release/extension-chrome' : 'release/extension');
for (const folder of ['fonts', 'icons', 'licenses', 'archives']) {
  await cp(resolve('public', folder), join(root, folder), {
    recursive: true,
    filter: source => !relative(resolve('public/fonts'), source).split(sep).includes('novecento'),
  });
}
await mkdir(join(root, 'audio'), { recursive: true });
for (const name of ['atmosphere', 'motif', 'pulse'])
  await copyFile(`public/audio/${name}.ogg`, join(root, 'audio', `${name}.ogg`));
await copyFile('public/favicon.svg', join(root, 'favicon.svg'));
await copyFile(chromeStore ? 'extension/manifest.chrome.json' : 'extension/manifest.json', join(root, 'manifest.json'));
await copyFile('LICENSE', join(root, 'LICENSE'));
for (const name of ['PRIVACY.md', 'THIRD_PARTY_NOTICES.md']) await copyFile(name, join(root, name));
await copyFile('node_modules/three/LICENSE', join(root, 'licenses/three.txt'));
let bytes = 0, files = 0;
for (const file of await readdir(root, { recursive: true })) {
  const info = await stat(join(root, file));
  if (info.isFile()) { bytes += info.size; files++; }
}
console.log(`Extension: ${root} (${files} files, ${(bytes / 1024 / 1024).toFixed(1)} MiB).`);
