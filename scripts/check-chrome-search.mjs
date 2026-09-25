import assert from 'node:assert/strict';
import { test } from 'node:test';
import { submitChromeSearch } from '../src/chrome-search.ts';

test('Chrome web queries use the browser default provider and honor the tab preference', async () => {
  const calls = [];
  const api = { query: async details => { calls.push(details); } };
  const open = url => { calls.push({ url }); };
  await submitChromeSearch('  莱茵 生命  ', 'new-tab', api, open);
  await submitChromeSearch('privacy', 'current-tab', api, open);
  assert.deepEqual(calls, [
    { text: '莱茵 生命', disposition: 'NEW_TAB' },
    { text: 'privacy', disposition: 'CURRENT_TAB' },
  ]);
});

test('Chrome URL input navigates directly; unsafe schemes remain search text', async () => {
  const calls = [];
  const api = { query: async details => { calls.push({ query: details }); } };
  const open = url => { calls.push({ url }); };
  await submitChromeSearch('example.com/path', 'new-tab', api, open);
  await submitChromeSearch('https://example.com/', 'current-tab', api, open);
  await submitChromeSearch('javascript:alert(1)', 'new-tab', api, open);
  await submitChromeSearch('  ', 'new-tab', api, open);
  assert.deepEqual(calls, [
    { url: 'https://example.com/path' },
    { url: 'https://example.com/' },
    { query: { text: 'javascript:alert(1)', disposition: 'NEW_TAB' } },
  ]);
});

test('Chrome build never falls back to a hard-coded web provider', async () => {
  await assert.rejects(submitChromeSearch('query', 'new-tab', undefined, () => {}), /默认搜索功能不可用/);
});
