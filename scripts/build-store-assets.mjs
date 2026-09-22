// Prepare store graphics from the existing vector identity; no generated artwork.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { default: sharp } = await import(process.env.SHARP_MODULE ? pathToFileURL(resolve(process.env.SHARP_MODULE)).href : 'sharp');
await mkdir('store/media', { recursive: true });
const original = await readFile('public/icons/app-icon.svg');
const icon = await sharp(original).resize(96, 96).png().toBuffer();
await sharp({ create: { width: 128, height: 128, channels: 4, background: '#00000000' } }).composite([{ input: icon, left: 16, top: 16 }]).png().toFile('public/icons/icon-128.png');
await sharp('public/icons/icon-128.png').toFile('store/media/icon-128.png');
await sharp(original).resize(300, 300).png().toFile('store/media/icon-300.png');
const promo = `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280"><rect width="440" height="280" fill="#e8e5e1"/><g fill="#171713" font-family="Segoe UI,Arial,sans-serif"><text x="28" y="46" font-size="27" font-weight="700">RHINE LAB</text><text x="29" y="68" font-size="11" letter-spacing="2">3D BOOKMARKS / NEW TAB</text></g><path d="M28 84H412" stroke="#aca69a"/>${Array.from({length:7},(_,i)=>{ const x=50+i*44, y=147-(i===3?26:0); return `<path d="M${x} ${y}l56 -36v88l-56 36z" fill="${i===3?'#f8f5ed':'#ddd8cd'}" stroke="#aba598"/><path d="M${x} ${y}l-9 -4l56 -36l9 4z" fill="#f7f4ed"/><path d="M${x} ${y}v88l-9 -4v-88z" fill="#c9c3b8"/>${i===3?`<path d="M${x} ${y}l56 -36" stroke="#ac6525" stroke-width="2"/>`:''}`;}).join('')}<rect y="249" width="440" height="31" fill="#171713"/><text x="28" y="269" font-family="Segoe UI,Arial,sans-serif" font-size="10" fill="#e8e5e1" letter-spacing="1">LOCAL BOOKMARKS · UNOFFICIAL FAN PROJECT</text></svg>`;
await writeFile('store/media/promo-small.svg',promo);
await sharp(Buffer.from(promo)).png().toFile('store/media/promo-440x280.png');
console.log('Store icons and 440×280 promotional tile ready.');
