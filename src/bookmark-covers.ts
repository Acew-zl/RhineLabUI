import * as THREE from 'three';
import { records, type ArchiveRecord } from './data';
import { faviconSources } from './bookmarks';
import { loadBookmarkIcon } from './bookmark-icon-loader';
import { themeMaterial } from './theme-material';
import { yieldPreparation } from './presentation-preparation';
import { bookmarkSpineGeometry, SPINE_TEXTURE_HEIGHT, SPINE_TEXTURE_WIDTH } from './bookmark-spine';

export const coverPreferences = { logo: true, title: true };
try {
  const saved = JSON.parse(localStorage.getItem('rhine-bookmark-covers') ?? '{}');
  for (const key of ['logo', 'title'] as const) if (typeof saved[key] === 'boolean') coverPreferences[key] = saved[key];
} catch { /* Keep defaults when storage is unavailable. */ }
export function saveCoverPreference(key: 'logo' | 'title', value: boolean) {
  coverPreferences[key] = value;
  try { localStorage.setItem('rhine-bookmark-covers', JSON.stringify(coverPreferences)); } catch { /* Session only. */ }
}
const icons = new Map<string, ImageBitmap | null>();
const pending = new Set<string>();
const queue: { url: string; sources: string[] }[] = [];
const listeners = new Set<() => void>();
let active = 0;
export const onBookmarkIcon = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
let lastIconError = '';
export function bookmarkIconStatus() {
  if (!faviconSources('https://example.invalid/').length) return '网页预览无法读取浏览器图标；请在已安装扩展的新标签页检查';
  const values = [...icons.values()];
  return `${values.filter(Boolean).length} 个已读取 · ${values.filter(value => !value).length} 个暂不可用${lastIconError ? ` · ${lastIconError}` : ''}`;
}
export function retryBookmarkIcons() {
  for (const [url, icon] of icons) if (!icon) icons.delete(url);
  lastIconError = '';
  listeners.forEach(listener => listener());
}
function pumpIcons() {
  while (active < 6 && queue.length) {
    const { url, sources } = queue.shift()!;
    active++;
    void loadBookmarkIcon(sources, async source => {
      const response = await fetch(source, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`图标接口 HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('浏览器未返回图标');
      return blob;
    }, blob => createImageBitmap(blob)).then(image => { icons.set(url, image); }).catch(error => {
      icons.set(url, null);
      lastIconError = error instanceof Error && error.message.startsWith('图标接口 HTTP') ? error.message : '图标读取失败，可重试';
    }).finally(() => {
      active--; pending.delete(url); listeners.forEach(listener => listener()); pumpIcons();
    });
  }
}
export function bookmarkIcon(record: ArchiveRecord, request = true) {
  const url = record.bookmarkUrl;
  if (request && url && !icons.has(url) && !pending.has(url)) {
    const sources = faviconSources(url);
    if (sources.length) { pending.add(url); queue.push({ url, sources }); pumpIcons(); }
  }
  return url ? icons.get(url) : null;
}

export function paintBookmarkCover(context: CanvasRenderingContext2D, record: ArchiveRecord, width: number, height: number) {
  context.clearRect(0, 0, width, height);
  if (!coverPreferences.logo && !coverPreferences.title) return;
  context.fillStyle = '#e6e2d9'; context.fillRect(0, 0, width, height);
  context.fillStyle = '#171713';
  const icon = bookmarkIcon(record, false);
  const size = height * .78;
  const x = height * .12;
  if (coverPreferences.logo && !record.empty) {
    if (icon) {
      const scale = Math.min(size / icon.width, size / icon.height);
      context.drawImage(icon, x + (size - icon.width * scale) / 2, (height - icon.height * scale) / 2, icon.width * scale, icon.height * scale);
    }
    else {
      context.strokeStyle = '#77766c'; context.lineWidth = Math.max(1, height * .01);
      context.strokeRect(x, (height - size) / 2, size, size);
      context.font = `600 ${height * .55}px MiSans`; context.textAlign = 'center'; context.textBaseline = 'middle';
      context.fillText(Array.from(record.title)[0]?.toUpperCase() ?? '◇', x + size / 2, height / 2);
    }
  }
  if (coverPreferences.title) {
    const start = coverPreferences.logo && !record.empty ? x + size + height * .25 : x;
    context.font = `600 ${height * .61}px MiSans`; context.textAlign = 'left'; context.textBaseline = 'middle';
    const available = width - start - x;
    let text = record.title;
    if (context.measureText(text).width > available) {
      const chars = Array.from(text);
      while (chars.length && context.measureText(chars.join('') + '…').width > available) chars.pop();
      text = chars.join('') + '…';
    }
    context.fillText(text, start, height * .51);
  }
  context.textAlign = 'left'; context.textBaseline = 'alphabetic';
}

/** One atlas and one instanced draw for spine decals; shares the card transforms. */
export class BookmarkCovers {
  readonly mesh: THREE.InstancedMesh;
  private canvas = document.createElement('canvas');
  private texture: THREE.CanvasTexture;
  private columns: number;
  private rows: number;
  private width: number;
  private height: number;
  private indexes = new THREE.InstancedBufferAttribute(new Float32Array(288), 1);
  private paintedIcons = new Map<number, ImageBitmap | null | undefined>();
  private unsubscribe: () => void;
  private dirty = false;
  constructor(maxSize: number, private invalidate: () => void) {
    const limit = Math.min(4096, maxSize);
    let tile = 768;
    while (Math.ceil(Math.sqrt(records.length)) * tile > limit && tile > 16) tile /= 2;
    this.columns = Math.min(Math.floor(limit / tile), Math.ceil(Math.sqrt(records.length)));
    this.rows = Math.ceil(records.length / this.columns);
    this.width = tile; this.height = Math.max(8, Math.floor(tile * SPINE_TEXTURE_HEIGHT / SPINE_TEXTURE_WIDTH));
    this.canvas.width = this.columns * this.width;
    this.canvas.height = this.rows * this.height;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    const geometry = bookmarkSpineGeometry();
    geometry.setAttribute('bookmarkIndex', this.indexes);
    const material = new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false });
    material.onBeforeCompile = shader => {
      shader.vertexShader = 'attribute float bookmarkIndex;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>\nvMapUv = vec2((mod(bookmarkIndex, ${this.columns}.0) + mix(.004, .996, uv.x)) / ${this.columns}.0, (${this.rows - 1}.0 - floor(bookmarkIndex / ${this.columns}.0) + mix(.004, .996, uv.y)) / ${this.rows}.0);`);
    };
    material.customProgramCacheKey = () => `bookmark-atlas-${this.columns}-${this.rows}`;
    themeMaterial(material, 'Printed_Canvas', true);
    this.mesh = new THREE.InstancedMesh(geometry, material, 288);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.unsubscribe = onBookmarkIcon(() => { this.dirty = true; this.invalidate(); });
  }
  async prepare() {
    for (let i = 0; i < records.length; i++) {
      this.paint(i);
      if (i % 32 === 31) await yieldPreparation();
    }
    this.texture.needsUpdate = true;
  }
  private paint(index: number) {
    const c = this.canvas.getContext('2d')!;
    c.save(); c.translate(index % this.columns * this.width, Math.floor(index / this.columns) * this.height);
    paintBookmarkCover(c, records[index], this.width, this.height); c.restore();
    this.paintedIcons.set(index, bookmarkIcon(records[index], false));
  }
  refresh() {
    for (let i = 0; i < records.length; i++) this.paint(i);
    this.texture.needsUpdate = true; this.invalidate();
  }
  sync(source: THREE.InstancedMesh, theme: THREE.InstancedBufferAttribute, recordsAtInstances: number[]) {
    this.mesh.visible = coverPreferences.logo || coverPreferences.title;
    if (!this.mesh.visible) return;
    if (this.indexes.count < source.instanceMatrix.count) {
      this.mesh.dispose();
      this.indexes = new THREE.InstancedBufferAttribute(new Float32Array(source.instanceMatrix.count), 1);
      this.mesh.geometry.setAttribute('bookmarkIndex', this.indexes);
    }
    this.mesh.instanceMatrix = source.instanceMatrix;
    this.mesh.geometry.setAttribute('archiveTheme', theme);
    this.mesh.count = recordsAtInstances.length;
    let changed = false, painted = false;
    for (let i = 0; i < recordsAtInstances.length; i++) {
      const index = recordsAtInstances[i];
      if (this.indexes.array[i] !== index) { this.indexes.array[i] = index; changed = true; }
      if (coverPreferences.logo) bookmarkIcon(records[index]);
      if (this.dirty && this.paintedIcons.get(index) !== bookmarkIcon(records[index], false)) { this.paint(index); painted = true; }
    }
    if (changed) this.indexes.needsUpdate = true;
    if (painted) this.texture.needsUpdate = true;
    // Keep dirty until offscreen icons are painted when they next become visible.
  }
  dispose() {
    this.unsubscribe(); this.mesh.removeFromParent(); this.mesh.dispose();
    this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); this.texture.dispose();
  }
}
