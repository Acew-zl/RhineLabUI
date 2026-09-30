/**
 * Spine-label atlas slots for large bookmark collections. Records that need a label
 * are passed nearest first; each keeps its slot while it stays wanted, and a new
 * record takes a free slot or the least recently used one. Records beyond the
 * capacity receive no slot (their label is hidden) instead of growing the atlas.
 */
export class AtlasSlots {
  private slotOf = new Map<number, number>();
  private recordOf: Int32Array;
  private used: Float64Array;
  private free: number[];
  private frame = 0;
  readonly capacity: number;
  constructor(capacity: number) {
    this.capacity = capacity;
    this.recordOf = new Int32Array(capacity).fill(-1);
    this.used = new Float64Array(capacity).fill(-1);
    this.free = Array.from({ length: capacity }, (_, slot) => capacity - 1 - slot);
  }
  slotFor(record: number) { return this.slotOf.get(record) ?? -1; }
  recordIn(slot: number) { return this.recordOf[slot]; }
  /** Returns the records that moved into a slot and therefore need painting. */
  assign(wanted: Iterable<number>) {
    const frame = ++this.frame;
    const waiting: number[] = [];
    for (const record of wanted) {
      const slot = this.slotOf.get(record);
      if (slot === undefined) waiting.push(record);
      else this.used[slot] = frame;
    }
    const placed: number[] = [];
    for (const record of waiting) {
      if (this.slotOf.has(record)) continue;
      let slot = this.free.pop() ?? -1;
      if (slot < 0) {
        for (let s = 0; s < this.capacity; s++)
          if (this.used[s] < frame && (slot < 0 || this.used[s] < this.used[slot])) slot = s;
        if (slot < 0) continue;
        this.slotOf.delete(this.recordOf[slot]);
      }
      this.recordOf[slot] = record;
      this.slotOf.set(record, slot);
      this.used[slot] = frame;
      placed.push(record);
    }
    return placed;
  }
}
