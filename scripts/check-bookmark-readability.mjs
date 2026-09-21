import test from 'node:test';
import assert from 'node:assert/strict';
import { cycleLabelOpacity } from '../src/bookmark-readability.ts';
import { bookmarkClearQuality, migrateBookmarkQuality } from '../src/bookmark-clarity.ts';
import { qualityPresets, renderDimensions } from '../src/render-quality.ts';

test('one cycle remains readable across negative positions and wrap boundaries', () => {
  for (const period of [1, 2, 3, 45, 1000]) {
    for (let center = -2 * period; center <= 2 * period; center += period / 100) {
      let total = 0;
      for (let copy = -4; copy <= 4; copy++) total += cycleLabelOpacity(copy * period - center, period);
      assert.ok(Math.abs(total - 1) < 1e-8, `period=${period}, center=${center}`);
    }
    assert.equal(cycleLabelOpacity(0, period), 1);
    assert.equal(cycleLabelOpacity(period, period), 0);
    assert.ok(Math.abs(cycleLabelOpacity(period / 2 - .00001, period) - cycleLabelOpacity(period / 2 + .00001, period)) < .001);
  }
});

test('clarity migration upgrades the old default once, preserving deliberate quality choices', () => {
  assert.deepEqual(migrateBookmarkQuality(qualityPresets.original), bookmarkClearQuality);
  for (const quality of [qualityPresets.performance, qualityPresets.high, {...qualityPresets.original, scale: 90}]) {
    assert.deepEqual(migrateBookmarkQuality(quality), quality);
  }
  assert.deepEqual(migrateBookmarkQuality(qualityPresets.original, 1), qualityPresets.original);
});

test('clear preset matches native display pixels across stage and OS scaling within GPU limits', () => {
  for (const [width, height, dpr] of [[1366,768,1], [1536,864,1.25], [1280,720,1.5], [1920,1080,2]]) {
    const scale = height / 1080;
    const result = renderDimensions(bookmarkClearQuality, width / scale, 1080, scale, dpr, 16384);
    assert.ok(Math.abs(result.width - width * dpr) <= 1);
    assert.ok(Math.abs(result.height - height * dpr) <= 1);
  }
  const limited = renderDimensions(bookmarkClearQuality, 3840, 2160, 1, 2, 8192);
  assert.ok(limited.limited);
  assert.ok(limited.width * limited.height <= 8294400);
});
