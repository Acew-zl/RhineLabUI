import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const sizes = {
  'public/icons/icon-128.png': [128,128],
  'store/media/icon-128.png': [128,128],
  'store/media/icon-300.png': [300,300],
  'store/media/promo-440x280.png': [440,280],
  'store/media/01-light-1280x800.jpg': [1280,800],
  'store/media/03-search-1280x800.jpg': [1280,800],
};
for (const [path, size] of Object.entries(sizes)) {
  const bytes = await readFile(path);
  let actual;
  if (path.endsWith('.png')) {
    assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a',path);
    actual = [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  } else {
    assert.equal(bytes.readUInt16BE(0),0xffd8,path);
    for (let offset = 2; offset + 9 < bytes.length;) {
      assert.equal(bytes[offset],0xff,path);
      const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
      if ([0xc0,0xc1,0xc2].includes(marker)) { actual = [bytes.readUInt16BE(offset + 7),bytes.readUInt16BE(offset + 5)]; break; }
      assert.ok(length >= 2,path); offset += 2 + length;
    }
  }
  assert.deepEqual(actual,size,path);
}
const manifest = JSON.parse(await readFile('release/extension/manifest.json','utf8'));
assert.equal(manifest.version,'0.8.2');
assert.equal(manifest.icons['128'],'icons/icon-128.png');
for (const path of ['PRIVACY.md','THIRD_PARTY_NOTICES.md','LICENSE','licenses/three.txt']) await access(`release/extension/${path}`);
console.log('Store assets: required dimensions, extension version and bundled notices verified.');
