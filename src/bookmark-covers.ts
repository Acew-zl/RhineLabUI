import { cycleLabelOpacity } from './bookmark-readability';
import { type ArchiveCell, wrap } from './archive-loop';
import * as THREE from 'three';
import { records, columnFiles, archiveColumns, fileLocation, type ArchiveRecord } from './data';
import { AtlasSlots } from './bookmark-atlas-slots';
import { faviconSources } from './bookmarks';
import { loadBookmarkIcon } from './bookmark-icon-loader';
import { bookmarkColumnColor } from './bookmark-colors';
import { yieldPreparation } from './presentation-preparation';
import { bookmarkSpineGeometry, SPINE_TEXTURE_HEIGHT, SPINE_TEXTURE_WIDTH } from './bookmark-spine';

export const coverPreferences = { logo: true, title: true };
export function reloadCoverPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem('rhine-bookmark-covers') ?? '{}');
    for (const key of ['logo', 'title'] as const) coverPreferences[key] = typeof saved?.[key] === 'boolean' ? saved[key] : true;
  } catch { /* Keep defaults when storage is unavailable. */ }
}
reloadCoverPreferences();
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

export function bookmarkCellOpacity(cell: ArchiveCell, center: ArchiveCell) {
  return cycleLabelOpacity(cell.lane - center.lane, archiveColumns.length)
    * cycleLabelOpacity(cell.row - center.row, columnFiles(wrap(cell.lane, archiveColumns.length)).length);
}

export function paintBookmarkCover(context: CanvasRenderingContext2D, record: ArchiveRecord, width: number, height: number, selected = false) {
  context.clearRect(0, 0, width, height);
  if (selected) {
    // Outside the text/icon area (which ends at 89% of the top rail).
    context.fillStyle = '#ac6525'; context.fillRect(0, height * .95, width, height * .05);
  }
  if (!coverPreferences.logo && !coverPreferences.title) return;
  context.fillStyle = '#' + bookmarkColumnColor(record.category).lerp(new THREE.Color('#f3f0e9'), .72).getHexString(); context.fillRect(0, 0, width, height * .91);
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
      // Longest prefix that fits with an ellipsis; binary search keeps long titles cheap.
      const chars = Array.from(text);
      let low = 0, high = chars.length - 1;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (context.measureText(chars.slice(0, middle).join('') + '…').width > available) high = middle - 1;
        else low = middle;
      }
      text = chars.slice(0, low).join('') + '…';
    }
    context.fillText(text, start, height * .51);
  }
  context.textAlign = 'left'; context.textBaseline = 'alphabetic';
}

const cellDistance = (cell: ArchiveCell, center: ArchiveCell) => Math.abs(cell.lane - center.lane) * 3 + Math.abs(cell.row - center.row);
/** Bookmarks ordered by how near they appear to `origin` when the array first opens. */
export function nearestRecords(origin: number) {
  const lanes = archiveColumns.length, originLane = fileLocation(origin).lane;
  const priority = records.map((_, index) => {
    const { lane, row } = fileLocation(index), count = columnFiles(lane).length, position = row - 12;
    const laneDistance = Math.min(wrap(lane - originLane, lanes), wrap(originLane - lane, lanes));
    return laneDistance * 3 + Math.min(position, count - position);
  });
  return records.map((_, index) => index).sort((a, b) => priority[a] - priority[b]);
}
/** Above this many bookmarks the atlas keeps slots for the visible labels only. */
export const ATLAS_SLOT_CAPACITY = 512;
const UPLOAD_INTERVAL = 250;
const PAINT_BUDGET = 48;
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
  private visibility = new THREE.InstancedBufferAttribute(new Float32Array(288).fill(1), 1);
  private paintedIcons = new Map<number, ImageBitmap | null | undefined>();
  private unsubscribe: () => void;
  private dirty = false;
  // Large collections: slot → record painted there / already uploaded to the GPU.
  private slots?: AtlasSlots;
  private painted: Int32Array;
  private uploaded: Int32Array;
  private unpainted = new Set<number>();
  private pendingUpload = false;
  private lastUpload = -Infinity;
  constructor(maxSize: number, private invalidate: () => void) {
    const capacity = records.length > ATLAS_SLOT_CAPACITY ? ATLAS_SLOT_CAPACITY : records.length;
    if (capacity < records.length) this.slots = new AtlasSlots(capacity);
    this.painted = new Int32Array(capacity).fill(-1);
    this.uploaded = new Int32Array(capacity).fill(-1);
    const limit = Math.min(8192, maxSize);
    let tile = 1024;
    while (Math.ceil(capacity / Math.floor(limit / tile)) * (tile / 16) > limit && tile > 32) tile /= 2;
    this.columns = Math.min(Math.floor(limit / tile), capacity);
    this.rows = Math.ceil(capacity / this.columns);
    this.width = tile; this.height = Math.max(8, Math.floor(tile * SPINE_TEXTURE_HEIGHT / SPINE_TEXTURE_WIDTH));
    this.canvas.width = this.columns * this.width;
    this.canvas.height = this.rows * this.height;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    const geometry = bookmarkSpineGeometry();
    geometry.setAttribute('bookmarkIndex', this.indexes);
    geometry.setAttribute('bookmarkVisibility', this.visibility);
    const material = new THREE.MeshBasicMaterial({ map: this.texture, toneMapped: false, transparent: true, depthWrite: false });
    material.onBeforeCompile = shader => {
      shader.vertexShader = 'attribute float bookmarkIndex; attribute float bookmarkVisibility; varying float labelVisibility; varying float spineScreenY;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nlabelVisibility = bookmarkVisibility;\nspineScreenY = .5 * (gl_Position.y / gl_Position.w + 1.0);');
      shader.fragmentShader = 'varying float labelVisibility; varying float spineScreenY;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'diffuseColor.a *= labelVisibility * (1.0 - smoothstep(.70, .89, spineScreenY));\n#include <opaque_fragment>');
      shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>\nvMapUv = vec2((mod(bookmarkIndex, ${this.columns}.0) + mix(.004, .996, uv.x)) / ${this.columns}.0, (${this.rows - 1}.0 - floor(bookmarkIndex / ${this.columns}.0) + mix(.004, .996, uv.y)) / ${this.rows}.0);`);
    };
    material.customProgramCacheKey = () => `bookmark-atlas-${this.columns}-${this.rows}`;
    this.texture.anisotropy = 16;
    this.mesh = new THREE.InstancedMesh(geometry, material, 288);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    this.unsubscribe = onBookmarkIcon(() => { this.dirty = true; this.invalidate(); });
  }
  async prepare() {
    const order = this.slots ? this.slots.capacity : records.length;
    const initial = this.slots ? nearestRecords(0) : records.map((_, index) => index);
    if (this.slots) this.slots.assign(initial.slice(0, order));
    for (let i = 0; i < order; i++) {
      this.paint(initial[i]);
      if (i % 32 === 31) await yieldPreparation();
    }
    this.upload(true);
  }
  private slotFor(record: number) { return this.slots ? this.slots.slotFor(record) : record; }
  private paint(index: number) {
    const slot = this.slotFor(index);
    if (slot < 0) return;
    const c = this.canvas.getContext('2d')!;
    c.save(); c.translate(slot % this.columns * this.width, Math.floor(slot / this.columns) * this.height);
    paintBookmarkCover(c, records[index], this.width, this.height); c.restore();
    this.paintedIcons.set(index, bookmarkIcon(records[index], false));
    this.painted[slot] = index;
    this.unpainted.delete(index);
    this.pendingUpload = true;
  }
  /** Canvas uploads are whole-texture; while icons stream in, batch them a few times a second. */
  private upload(force = false) {
    if (!this.pendingUpload) return;
    const now = performance.now();
    if (!force && now - this.lastUpload < UPLOAD_INTERVAL) { this.invalidate(); return; }
    this.texture.needsUpdate = true;
    this.uploaded.set(this.painted);
    this.pendingUpload = false;
    this.lastUpload = now;
    this.invalidate();
  }
  refresh() {
    if (this.slots) for (let slot = 0; slot < this.painted.length; slot++) { if (this.painted[slot] >= 0) this.paint(this.painted[slot]); }
    else for (let i = 0; i < records.length; i++) this.paint(i);
    this.upload(true);
  }
  sync(source: THREE.InstancedMesh, theme: THREE.InstancedBufferAttribute, recordsAtInstances: number[], cells?: ArchiveCell[], center?: ArchiveCell) {
    this.mesh.visible = coverPreferences.logo || coverPreferences.title;
    if (!this.mesh.visible) return;
    if (this.indexes.count < source.instanceMatrix.count) {
      this.mesh.dispose();
      this.indexes = new THREE.InstancedBufferAttribute(new Float32Array(source.instanceMatrix.count), 1);
      this.mesh.geometry.setAttribute('bookmarkIndex', this.indexes);
      this.visibility = new THREE.InstancedBufferAttribute(new Float32Array(source.instanceMatrix.count), 1);
      this.mesh.geometry.setAttribute('bookmarkVisibility', this.visibility);
    }
    this.mesh.instanceMatrix = source.instanceMatrix;
    this.mesh.geometry.setAttribute('archiveTheme', theme);
    this.mesh.count = recordsAtInstances.length;
    const opacities = recordsAtInstances.map((index, i) => {
      const cell = cells?.[i];
      return records[index].empty ? 0 : cell && center ? bookmarkCellOpacity(cell, center) : 1;
    });
    if (this.slots) {
      // Nearest labels first: when the slots are full, the farthest labels stay hidden.
      const wanted = recordsAtInstances.map((_, i) => i).filter(i => opacities[i] > 0);
      if (cells && center) wanted.sort((a, b) => cellDistance(cells[a], center) - cellDistance(cells[b], center));
      for (const record of this.slots.assign(wanted.map(i => recordsAtInstances[i]))) this.unpainted.add(record);
      let budget = PAINT_BUDGET;
      for (const record of [...this.unpainted]) { if (budget-- <= 0) break; this.paint(record); }
    }
    let changed = false, visibilityChanged = false;
    for (let i = 0; i < recordsAtInstances.length; i++) {
      const index = recordsAtInstances[i];
      const slot = this.slotFor(index);
      // A reused slot shows its new label only after it has been painted and uploaded.
      const shown = !this.slots || (slot >= 0 && this.uploaded[slot] === index);
      const rounded = shown ? Math.round(opacities[i] * 1000) / 1000 : 0;
      if (Math.abs(this.visibility.array[i] - rounded) > .0001) { this.visibility.array[i] = rounded; visibilityChanged = true; }
      const target = Math.max(0, slot);
      if (this.indexes.array[i] !== target) { this.indexes.array[i] = target; changed = true; }
      if (slot < 0) continue;
      if (coverPreferences.logo) bookmarkIcon(records[index]);
      if (this.dirty && this.painted[slot] === index && this.paintedIcons.get(index) !== bookmarkIcon(records[index], false)) this.paint(index);
    }
    if (changed) this.indexes.needsUpdate = true;
    if (visibilityChanged) { this.visibility.needsUpdate = true; this.invalidate(); }
    // Keep dirty until offscreen icons are painted when they next become visible.
    this.upload();
  }
  /** Atlas size and mode, for diagnostics. */
  get stats() { return { width: this.canvas.width, height: this.canvas.height, tile: this.width, slots: this.slots?.capacity ?? 0 }; }
  dispose() {
    this.unsubscribe(); this.mesh.removeFromParent(); this.mesh.dispose();
    this.mesh.geometry.dispose(); (this.mesh.material as THREE.Material).dispose(); this.texture.dispose();
  }
}
