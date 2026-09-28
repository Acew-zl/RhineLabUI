import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RenderCadence, normalizeRenderPace, renderFrameLimit } from '../src/render-cadence.ts';

test('high-refresh displays obey the cap without changing elapsed animation time', () => {
  for (const refresh of [60, 120, 144, 165, 240]) {
    for (const limit of [15, 30, 60]) {
      const cadence = new RenderCadence(), frames = [];
      for (let index = 0; index < refresh * 10; index++) {
        const time = index * 1000 / refresh;
        if (cadence.shouldRun(time, limit)) frames.push(time);
      }
      assert.ok(Math.abs(frames.length - limit * 10) <= 1, `${refresh}Hz / ${limit}FPS: ${frames.length}`);
      assert.ok(frames.at(-1) > 9900);
    }
  }
});

test('input, setting changes and resume draw immediately without a catch-up burst', () => {
  const cadence = new RenderCadence();
  assert.equal(cadence.shouldRun(0, 30), true);
  assert.equal(cadence.shouldRun(6, 30), false);
  cadence.reset();
  assert.equal(cadence.shouldRun(12, 60), true);
  assert.equal(cadence.shouldRun(18, 60), false);
  assert.equal(cadence.shouldRun(5000, 60), true);
  assert.equal(cadence.shouldRun(5000, 60), false);
  assert.equal(cadence.shouldRun(5006, 15), true);
  for (let i = 0; i < 5; i++) assert.equal(cadence.shouldRun(5012 + i, 0), true);
});

test('pace migration preserves explicit choices and separates active and idle limits', () => {
  assert.equal(normalizeRenderPace(undefined), 'balanced');
  assert.equal(normalizeRenderPace('invalid'), 'balanced');
  for (const [pace, active, idle] of [['balanced', 60, 30], ['efficient', 30, 15], ['display', 0, 0]]) {
    assert.equal(normalizeRenderPace(pace), pace);
    assert.equal(renderFrameLimit(pace, true), active);
    assert.equal(renderFrameLimit(pace, false), idle);
  }
});
