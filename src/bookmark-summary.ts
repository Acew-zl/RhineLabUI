import { records, type ArchiveRecord } from './data';
import { bookmarkIcon, onBookmarkIcon } from './bookmark-covers';

let enabled = true;
try { enabled = localStorage.getItem('rhine-bookmark-summary-logo') !== 'false'; } catch { /* Default. */ }
export const getBookmarkSummaryLogo = () => enabled;
let selected: ArchiveRecord | undefined;
let canvas: HTMLCanvasElement | undefined;

function paint() {
  if (!canvas) return;
  canvas.hidden = !enabled || !selected?.bookmarkUrl;
  if (canvas.hidden || !selected) return;
  paintBookmarkIcon(canvas, selected);
}

export function paintBookmarkIcon(canvas: HTMLCanvasElement, record: ArchiveRecord) {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, 128, 128);
  const icon = bookmarkIcon(record);
  if (icon) {
    const scale = Math.min(128 / icon.width, 128 / icon.height);
    context.imageSmoothingQuality = 'high';
    context.drawImage(icon, (128 - icon.width * scale) / 2, (128 - icon.height * scale) / 2, icon.width * scale, icon.height * scale);
    canvas.title = '网站 Logo';
  } else {
    // A neutral globe denotes an unavailable icon, never an invented site logo.
    context.strokeStyle = '#88877d'; context.lineWidth = 5;
    context.beginPath(); context.arc(64, 64, 49, 0, Math.PI * 2);
    context.moveTo(15, 64); context.lineTo(113, 64);
    context.moveTo(83, 64); context.ellipse(64, 64, 19, 49, 0, 0, Math.PI * 2);
    context.stroke();
    canvas.title = '网站图标暂不可用';
  }
}
export function mountBookmarkSummaryLogo() {
  canvas = document.createElement('canvas');
  canvas.className = 'bookmark-summary-logo';
  canvas.width = canvas.height = 128;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  document.querySelector('.file-summary')?.prepend(canvas);
  onBookmarkIcon(() => { paint(); refreshBookmarkResultIcons(); });
  let scrollFrame = 0;
  document.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; refreshBookmarkResultIcons(); }); }, true);
}
export function updateBookmarkSummary(record: ArchiveRecord) { selected = record; paint(); }
export function setBookmarkSummaryLogo(value: boolean) {
  enabled = value;
  try { localStorage.setItem('rhine-bookmark-summary-logo', String(value)); } catch { /* Session only. */ }
  paint();
}

/** Visible search/index rows share the local icon cache; detached rows are never retained. */
export function bookmarkResultIcon(index: number) {
  return `<canvas class="bookmark-result-logo" width="128" height="128" data-bookmark-icon="${index}" aria-hidden="true"></canvas>`;
}
export function refreshBookmarkResultIcons() {
  document.querySelectorAll<HTMLCanvasElement>('[data-bookmark-icon]').forEach(icon => {
    const record = records[Number(icon.dataset.bookmarkIcon)];
    const rect = icon.getBoundingClientRect();
    const clip = icon.closest('#search-results, #bookmark-suggestions')?.getBoundingClientRect();
    if (record?.bookmarkUrl && rect.height > 0 && rect.bottom >= Math.max(0, clip?.top ?? 0) && rect.top <= Math.min(innerHeight, clip?.bottom ?? innerHeight)) paintBookmarkIcon(icon, record);
  });
}
