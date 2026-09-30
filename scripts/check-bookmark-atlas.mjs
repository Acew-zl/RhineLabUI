import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AtlasSlots } from '../src/bookmark-atlas-slots.ts';

test('visible labels keep their atlas slots while they stay wanted', () => {
  const slots = new AtlasSlots(4);
  assert.deepEqual(slots.assign([10, 11, 12]), [10, 11, 12]);
  const first = [10, 11, 12].map(record => slots.slotFor(record));
  assert.equal(new Set(first).size, 3);
  assert.deepEqual(slots.assign([12, 11, 10]), [], 'Nothing is repainted when the same labels stay visible');
  assert.deepEqual([10, 11, 12].map(record => slots.slotFor(record)), first);
});

test('new labels reuse the least recently used slot and the farthest overflow stays hidden', () => {
  const slots = new AtlasSlots(3);
  slots.assign([1, 2, 3]);
  slots.assign([2, 3]);
  const placed = slots.assign([2, 3, 4]);
  assert.deepEqual(placed, [4]);
  assert.equal(slots.slotFor(1), -1, 'The least recently used record gives up its slot');
  assert.equal(slots.recordIn(slots.slotFor(4)), 4);
  // Wanted records are ordered nearest first; beyond the capacity no slot is taken
  // from a label still visible in this frame.
  slots.assign([5, 6, 7, 8]);
  assert.deepEqual([5, 6, 7].map(record => slots.slotFor(record) >= 0), [true, true, true]);
  assert.equal(slots.slotFor(8), -1);
  assert.deepEqual(slots.assign([5, 6, 7, 8]), [], 'A full frame does not evict its own visible labels');
});
