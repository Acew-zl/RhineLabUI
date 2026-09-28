import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_USER_NAME, USER_NAME_KEY, normalizeUserName, readUserName, writeUserName } from '../src/user-name.ts';
const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
test('first use, blank confirmation and a custom name survive reopening', () => {
  const storage = memory();
  assert.deepEqual(readUserName(storage), { name: DEFAULT_USER_NAME, confirmed: false });
  assert.equal(writeUserName(storage, ''), true);
  assert.deepEqual(readUserName(storage), { name: DEFAULT_USER_NAME, confirmed: true });
  writeUserName(storage, '  莱茵研究员 Ace  ');
  assert.deepEqual(readUserName(storage), { name: '莱茵研究员 Ace', confirmed: true });
});
test('names preserve case and complete Unicode characters with a safe display length', () => {
  assert.equal(normalizeUserName('  Ace e\u0301  '), 'Ace é');
  assert.equal(normalizeUserName('\u202eAce\n\t\u2069'), 'Ace');
  const emoji = '👩🏽‍🔬';
  assert.equal(normalizeUserName(emoji.repeat(30)), emoji.repeat(24));
  assert.equal(normalizeUserName('中'.repeat(25)), '中'.repeat(24));
});
test('damaged and unavailable storage cannot break opening or imply a completed setup', () => {
  const storage = memory();
  for (const value of ['{', 'null', '{}', '{"name":false,"confirmed":true}', '{"name":"Ace","confirmed":false}']) {
    storage.setItem(USER_NAME_KEY, value);
    assert.deepEqual(readUserName(storage), { name: DEFAULT_USER_NAME, confirmed: false });
  }
  const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(readUserName(denied).confirmed, false);
  assert.equal(writeUserName(denied, 'Ace'), false);
});
