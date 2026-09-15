import assert from 'node:assert/strict';
import { test } from 'node:test';
import { preparedBootTime, PREPARATION_BOUNDARY } from '../src/presentation-preparation.ts';
test('2D opening runs while the model is still loading', () => {
  for (const time of [-.6, 1.76, 10, 21]) assert.equal(preparedBootTime(time, false), time);
});
test('slow preparation holds before any 3D becomes visible', () => {
  assert.ok(PREPARATION_BOUNDARY < 21.9);
  for (const time of [21.9, 35, 120]) assert.equal(preparedBootTime(time, false), PREPARATION_BOUNDARY);
});
test('ready playback retains the authored timeline, including replay', () => {
  for (const time of [1.76, 21.9, 22, 26, 35]) assert.equal(preparedBootTime(time, true), time);
});
