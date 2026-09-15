import * as THREE from 'three';
import { records, type ArchiveRecord } from './data';
import { faviconUrl } from './bookmarks';
import { themeMaterial } from './theme-material';
import { yieldPreparation } from './presentation-preparation';

export const coverPreferences = { logo: true, title: true };
try {
  const saved = JSON.parse(localStorage.getItem('rhine-bookmark-covers') ?? '{}');
  for (const key of ['logo', 'title'] as const) if (typeof saved[key] === 'boolean') coverPreferences[key] = saved[key];
} catch { /* Keep defaults when storage is unavailable. */ }
export function saveCoverPreference(key: 'logo' | 'title', value: boolean) {
  coverPreferences[key] = value;
  try { localStorage.setItem('rhine-bookmark-covers', JSON.stringify(coverPreferences)); } catch { /* Session only. */ }
}
export const coverGeometry = () => new THREE.PlaneGeometry(3.8, 1.6).translate(0, 2.5, .265);
const icons = new Map<string, HTMLImageElement | null>();
const pending = new Set<string>();
const queue: { url: string; source: string }[] = [];
const listeners = new Set<() => void>();
let active = 0;
export const onBookmarkIcon = (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); };
function pumpIcons() {
  while (active < 6 && queue.length) {
    const { url, source } = queue.shift()!;
    active++;
    const image = new Image();
    image.src = source;
    void image.decode().then(() => { icons.set(url, image); }).catch(() => { icons.set(url, null); }).finally(() => {
      active--; pending.delete(url); listeners.forEach(listener => listener()); pumpIcons();
    });
  }
}
export function bookmarkIcon(record: ArchiveRecord, request = true) {
  const url = record.bookmarkUrl;
  if (request && url && !icons.has(url) && !pending.has(url)) {
    const source = faviconUrl(url);
    if (source) { pending.add(url); queue.push({ url, source }); pumpIcons(); }
  }
  return url ? icons.get(url) : null;
}

function lines(context: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [''];
  for (const char of Array.from(text)) {
    const last = result.length - 1;
    if (context.measureText(result[last] + char).width <= width) result[last] += char;
    else if (last === 0) result.push(char);
    else {
      while (context.measureText(result[1] + '…').width > width) result[1] = Array.from(result[1]).slice(0, -1).join('');
      result[1] += '…'; break;
    }
  }
  return result;
}

export function paintBookmarkCover(context: CanvasRenderingContext2D, record: ArchiveRecord, width: number, height: number) {
  context.clearRect(0, 0, width, height);
  if (!coverPreferences.logo && !coverPreferences.title) return;
  context.fillStyle = '#e6e2d9'; context.fillRect(0, 0, width, height);
  context.fillStyle = '#171713'; context.fillRect(width * .035, height * .08, width * .93, Math.max(1, height * .012));
  const icon = bookmarkIcon(record, false);
  const size = height * .47;
  const x = coverPreferences.title ? width * .06 : (width - size) / 2;
  if (coverPreferences.logo && !record.empty) {
    if (icon) context.drawImage(icon, x, (height - size) / 2, size, size);
    else {
      context.strokeStyle = '#77766c'; context.lineWidth = Math.max(1, height * .01);
      context.strokeRect(x, (height - size) / 2, size, size);
      context.font = `600 ${height * .26}px MiSans`; context.textAlign = 'center'; context.textBaseline = 'middle';
      context.fillText(Array.from(record.title)[0]?.toUpperCase() ?? '◇', x + size / 2, height / 2);
    }
  }
  if (coverPreferences.title) {
    const start = coverPreferences.logo && !record.empty ? x + size + width * .045 : width * .06;
    context.font = `600 ${height * .19}px MiSans`; context.textAlign = 'left'; context.textBaseline = 'middle';
    const text = lines(context, record.title, width * .94 - start);
    text.forEach((line, i) => context.fillText(line, start, height * .5 + (i - (text.length - 1) / 2) * height * .25));
  }
  context.textAlign = 'left'; context.textBaseline = 'alphabetic';
}

/** One atlas and one instanced draw for the background covers; shares the card transforms. */
export class BookmarkCovers {
  readonly mesh: THREE.InstancedMesh;
  private canvas = document.createElement('canvas');
  private texture: THREE.CanvasTexture;
  private columns: number;
  private rows: number;
  private width: number;
  private height: number;
  private indexes = new THREE.InstancedBufferAttribute(new Float32Array(288), 1);
  private paintedIcons = new Map<number, HTMLImageElement | null | undefined>();
  private unsubscribe: () => void;
  private dirty = false;
  constructor(maxSize: number, private invalidate: () => void) {
    const limit = Math.min(4096, maxSize);
    let tile = 256;
    while (Math.ceil(Math.sqrt(records.length)) * tile > limit && tile > 16) tile /= 2;
    this.columns = Math.min(Math.floor(limit / tile), Math.ceil(Math.sqrt(records.length)));
    this.rows = Math.ceil(records.length / this.columns);
    this.width = tile; this.height = Math.max(8, Math.floor(tile * 440 / 1024));
    this.canvas.width = this.columns * this.width;
    this.canvas.height = this.rows * this.height;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    const geometry = coverGeometry();
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
