import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({ URL, structuredClone });
vm.runInContext(await readFile(new URL('../public/journal-model.js', import.meta.url), 'utf8'), context);
const model = context.WaypointJournalModel;
const url = 'https://example.com/app?page=1';
const target = { selector: '#title', element_context: { tag: 'h1', text: 'Project' } };
const apply = (state, command, id = 'entry') => model.apply(state, command, { id, now: '2026-09-25T12:00:00Z' });
const journal = () => apply(null, { type: 'create', name: 'Personal', url }, 'journal');

test('Journal scope preserves pagination and unknown data while normalizing bounded exceptions', () => {
  assert.equal(model.scope(`${url}&sort=asc&utm_source=email#details`), model.scope(url));
  assert.equal(model.scope('https://example.com/app?b=2&a=1'), model.scope('https://example.com/app?a=1&b=2'));
  for (const next of ['https://example.com/app?page=2', `${url}&banana=asc`, `${url}#/settings`, 'https://another.com/app?page=1']) {
    assert.notEqual(model.scope(url), model.scope(next));
  }
  assert.notEqual(model.scope(`${url}#/one`), model.scope(`${url}#/two`));
  assert.notEqual(model.scope(`${url}&a=1&a=2`), model.scope(`${url}&a=2&a=1`));
  assert.equal(model.scope('javascript:alert(1)'), null);
  assert.equal(model.scope('not a url'), null);
});

test('local journals retain independent shared notes through edits and targeted cleanup', () => {
  let state = journal();
  state = apply(state, { type: 'save', journalId: 'journal', comment: 'First thought', targets: [target, { ...target, selector: '#badge' }], url, seed: 42 });
  assert.equal(state.journals[0].entries.length, 1);
  assert.equal(state.journals[0].entries[0].targets.length, 2);
  assert.equal(state.journals[0].entries[0].status, undefined);
  const before = state;
  state = apply(state, { type: 'save', journalId: 'journal', entryId: 'entry', comment: 'Edited', url });
  assert.equal(before.journals[0].entries[0].comment, 'First thought');
  assert.equal(state.journals[0].entries[0].seed, 42);
  state = apply(state, { type: 'reattach', journalId: 'journal', entryId: 'entry', targetIndex: 1, target: { ...target, selector: '#new-badge' }, url });
  assert.equal(state.journals[0].entries[0].targets[0].selector, '#title');
  assert.equal(state.journals[0].entries[0].targets[1].selector, '#new-badge');
  state = apply(state, { type: 'create', name: 'Demo', url }, 'demo');
  state = apply(state, { type: 'clear', journalId: 'journal' });
  assert.equal(state.journals.length, 2);
  assert.equal(state.journals[0].entries.length, 0);
  state = apply(state, { type: 'delete-journal', journalId: 'journal' });
  assert.equal(state.journals[0].id, 'demo');
});

test('invalid writes and stale updates preserve saved data', () => {
  const state = journal();
  const save = { type: 'save', journalId: 'journal', comment: 'Note', targets: [target], url };
  assert.throws(() => apply(state, { ...save, comment: ' ' }), /Note/);
  assert.throws(() => apply(state, { ...save, url: 'https://example.com/app?page=2' }), /Return/);
  assert.throws(() => apply(state, { ...save, entryId: 'deleted' }), /no longer exists/);
  assert.throws(() => apply(state, { ...save, targets: [] }), /Targets/);
  assert.throws(() => model.read({ version: 2, journals: [] }), /not been changed/);
  assert.equal(state.journals[0].entries.length, 0);
});
