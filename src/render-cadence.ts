export type RenderPace = 'balanced' | 'efficient' | 'display';
export const normalizeRenderPace = (value: unknown): RenderPace =>
  value === 'efficient' || value === 'display' ? value : 'balanced';

export function renderFrameLimit(pace: RenderPace, active: boolean) {
  return pace === 'display' ? 0 : pace === 'efficient' ? (active ? 30 : 15) : (active ? 60 : 30);
}

/** Gate expensive updates by elapsed time, without changing animation time or catching up missed frames. */
export class RenderCadence {
  private next = 0;
  private limit = -1;
  reset() { this.next = 0; this.limit = -1; }
  shouldRun(time: number, limit: number) {
    if (!limit) { this.reset(); return true; }
    const interval = 1000 / limit;
    if (limit !== this.limit) { this.limit = limit; this.next = time; }
    if (time + .01 < this.next) return false;
    const late = Math.max(0, time - this.next);
    this.next = time + interval - (late % interval);
    return true;
  }
}

export function renderCadenceMarkup(pace: RenderPace) {
  return `<label><div><strong>动画帧率 / FRAME RATE</strong><span>只调整重绘频率，文字清晰度和三维画质不变</span></div><select id="render-pace" aria-label="动画帧率">${([
    ['balanced', '均衡 · 操作 60 / 空闲 30 FPS'],
    ['efficient', '节能 · 操作 30 / 空闲 15 FPS'],
    ['display', '跟随屏幕刷新率'],
  ] as const).map(([value, label]) => `<option value="${value}" ${value === pace ? 'selected' : ''}>${label}</option>`).join('')}</select></label>`;
}
