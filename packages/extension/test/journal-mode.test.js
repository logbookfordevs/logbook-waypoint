import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(await realpath(new URL('../node_modules/wxt/package.json', import.meta.url)));
const { parseHTML } = require('linkedom');

async function harness(stored = {}) {
  const { window } = parseHTML('<html><body><h1 id="target">Title</h1><div id="host"></div></body></html>');
  const root = window.document.querySelector('#host').attachShadow({ mode: 'open' });
  const listeners = [], events = new Map(), messages = [];
  const storage = structuredClone(stored);
  const rect = { left: 20, right: 120, top: 60, bottom: 90, width: 100, height: 30 };
  window.HTMLElement.prototype.getBoundingClientRect = () => rect;
  window.HTMLElement.prototype.setPointerCapture = () => {};
  window.HTMLElement.prototype.hasPointerCapture = () => false;
  window.HTMLElement.prototype.setCustomValidity = () => {};
  window.HTMLElement.prototype.reportValidity = () => true;
  window.getComputedStyle = () => ({ overflowX: 'visible', overflowY: 'visible' });
  window.location = new URL('https://example.com/app?page=1');
  window.innerWidth = 1000; window.innerHeight = 800; window.confirm = () => true;
  const ctx = vm.createContext({
    window, document: window.document, URL, structuredClone, console,
    navigator: { clipboard: { writeText: async () => {} } },
    requestAnimationFrame: () => 1, setInterval: () => 1,
    chrome: {
      storage: {
        local: { get: async () => structuredClone(storage), set: async values => Object.assign(storage, values) },
        onChanged: { addListener: callback => listeners.push(callback) },
      },
      runtime: { sendMessage: async request => {
        messages.push(request);
        try {
          storage.waypointJournals = ctx.WaypointJournalModel.apply(storage.waypointJournals, request.command, { id: `id-${messages.length}`, now: '2026-09-25' });
          return { success: true, data: structuredClone(storage.waypointJournals) };
        } catch (error) { return { success: false, error: error.message }; }
      } },
    },
    WaypointEvents: {
      on: (name, handler) => { if (!events.has(name)) events.set(name, []); events.get(name).push(handler); },
      emit: (name, value) => events.get(name)?.forEach(fn => fn(value)),
    },
    WaypointShadowHost: { getRoot: () => root, isVisible: () => true },
    WaypointAnnotationPopover: { dismiss() {} }, WaypointBadgeManager: { clearAll() {} },
    WaypointQueuePanel: { close() {} }, WaypointInspectionMode: { isActive: () => false, tempDisable() {} },
    WaypointMultiTargetSelection: { shouldHandle: () => false },
    WaypointAPI: { loadAnnotations: async () => [], getSkipDeleteConfirm: async () => false },
    WaypointElementContext: {
      generate: async target => ({ selector: `#${target.id}`, tag: 'h1', text: target.textContent, classes: [] }),
      findElementBySelector: target => window.document.querySelector(target.selector),
    },
  });
  ctx.globalThis = ctx;
  for (const path of ['journal-model.js', 'content/modules/journal-geometry.js', 'content/modules/journal-mode.js']) {
    vm.runInContext(await readFile(new URL(`../public/${path}`, import.meta.url), 'utf8'), ctx);
  }
  await ctx.WaypointJournal.init();
  const toolbar = window.document.createElement('div');
  toolbar.innerHTML = '<button class="waypoint-tb-annotate">Pen</button>';
  root.appendChild(toolbar); ctx.WaypointJournal.attachToolbar(toolbar);
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const click = async text => {
    const btn = [...root.querySelectorAll('button')].find(b => b.textContent === text || b.getAttribute('aria-label') === text);
    assert.ok(btn, `Button exists: ${text}`); btn.click(); await flush();
  };
  return { ctx, window, root, storage, messages, click, flush };
}

async function createJournal(h, name = 'Personal') {
  const form = h.root.querySelector('form');
  form.querySelector('input').value = name;
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await h.flush();
}

test('toolbar switches modes directly without opening the journal picker and retains collections', async () => {
  const h = await harness();
  await h.click('Journal');
  assert.equal(h.ctx.WaypointJournal.isActive(), true);
  assert.equal(h.root.querySelector('.waypoint-journal-panel'), null);
  assert.equal(h.root.querySelector('[data-mode="journal"]').getAttribute('aria-pressed'), 'true');
  h.ctx.WaypointJournal.openMenu();
  await createJournal(h);
  await h.click('Agent');
  assert.equal(h.ctx.WaypointJournal.isActive(), false);
  assert.equal(h.root.querySelector('.waypoint-journal-panel'), null);
  await h.click('Journal');
  assert.equal(h.root.querySelector('.waypoint-journal-panel'), null);
  h.ctx.WaypointJournal.openMenu();
  assert.equal(h.root.querySelector('select option').value, h.storage.waypointJournals.journals[0].id);
  assert.equal(h.root.querySelector('.waypoint-journal-panel [data-mode]'), null);
});

test('journal notes stay open across click-away and reload, and hide together without changing saved data', async () => {
  const h = await harness();
  await h.click('Journal'); h.ctx.WaypointJournal.openMenu(); await createJournal(h);
  h.ctx.WaypointEvents.emit('inspection:elementClicked', { element: h.window.document.querySelector('#target') });
  await h.flush();
  assert.ok(h.root.querySelector('.waypoint-journal-saved textarea'), 'new pins use the compact taped-note editor');
  h.root.querySelector('textarea').value = 'A personal observation';
  await h.click('Save note');
  assert.equal(h.messages.at(-1).action, 'journalCommand');
  assert.equal(h.storage.waypointAnnotations, undefined);
  assert.equal(h.storage.waypointJournals.journals[0].entries[0].comment, 'A personal observation');
  assert.ok(h.root.querySelector('.waypoint-journal-copy'));
  assert.equal(h.root.querySelector('[aria-label="Edit note"]'), null, 'no separate pencil control');
  h.window.document.dispatchEvent(new h.window.Event('pointerdown'));
  assert.equal(h.root.querySelectorAll('.waypoint-journal-saved').length, 1);
  await h.click('Hide journal');
  assert.equal(h.root.querySelector('.waypoint-journal-note'), null);
  assert.equal(h.root.querySelectorAll('.waypoint-journal-pin').length, 0);
  await h.click('Show journal');
  assert.equal(h.root.querySelectorAll('.waypoint-journal-saved').length, 1);
  const reloaded = await harness(h.storage);
  assert.equal(reloaded.ctx.WaypointJournal.isActive(), true);
  assert.equal(reloaded.root.querySelectorAll('.waypoint-journal-pin').length, 1);
  assert.equal(reloaded.root.querySelectorAll('.waypoint-journal-saved').length, 1);
  await reloaded.click('Agent');
  assert.equal(reloaded.root.querySelectorAll('.waypoint-journal-pin').length, 0);
  assert.equal(reloaded.storage.waypointJournals.journals[0].entries.length, 1);
});

test('missing Targets remain manageable and reattach without deleting their note', async () => {
  const state = { waypointAnnotationMode: 'journal', waypointJournals: { version: 1, journals: [{ id: 'j', name: 'Personal', scope: 'https://example.com/app?page=1', entries: [{ id: 'e', comment: 'Keep me', seed: 1, targets: [{ selector: '#gone' }] }] }] } };
  const h = await harness(state);
  h.ctx.WaypointJournal.openMenu();
  assert.match(h.root.querySelector('.waypoint-journal-panel').textContent, /Target 1 is missing/);
  await h.click('Reattach');
  h.ctx.WaypointEvents.emit('inspection:elementClicked', { element: h.window.document.querySelector('#target') });
  await h.flush(); await h.flush();
  assert.equal(h.storage.waypointJournals.journals[0].entries[0].targets[0].selector, '#target');
  assert.equal(h.storage.waypointJournals.journals[0].entries[0].comment, 'Keep me');
});

test('a rejected save leaves the draft open with an actionable error', async () => {
  const h = await harness();
  await h.click('Journal'); h.ctx.WaypointJournal.openMenu(); await createJournal(h);
  h.ctx.WaypointEvents.emit('inspection:elementClicked', { element: h.window.document.querySelector('#target') });
  await h.flush();
  h.root.querySelector('textarea').value = 'Do not lose this';
  h.ctx.chrome.runtime.sendMessage = async () => ({ success: false, error: 'Storage is full. Free some space and try again.' });
  await h.click('Save note');
  assert.equal(h.root.querySelector('textarea').value, 'Do not lose this');
  assert.match(h.root.querySelector('[role="alert"]').textContent, /Storage is full/);
});

test('all entries render together and global visibility, editing, and deletion preserve the other notes', async () => {
  const state = { waypointAnnotationMode: 'journal', waypointJournals: { version: 1, journals: [{ id: 'j', name: 'Personal', scope: 'https://example.com/app?page=1', entries: ['First note', 'Second note'].map((comment, index) => ({ id: `e${index}`, comment, seed: index, targets: [{ selector: '#target' }] })) }] } };
  const h = await harness(state);
  assert.equal(h.root.querySelectorAll('.waypoint-journal-saved').length, 2);
  await h.click('Hide journal');
  assert.equal(h.root.querySelectorAll('.waypoint-journal-saved').length, 0);
  assert.equal(h.storage.waypointJournals.journals[0].entries.length, 2);
  await h.click('Show journal');
  const originalCard = h.root.querySelector('.waypoint-journal-saved');
  originalCard.querySelector('.waypoint-journal-copy').dispatchEvent(new h.window.Event('dblclick'));
  await h.flush();
  assert.equal(h.root.querySelector('.waypoint-journal-editing'), originalCard, 'double click edits the same taped note');
  h.root.querySelector('textarea').value = 'Updated first note';
  await h.click('Save note');
  assert.equal(h.root.querySelectorAll('.waypoint-journal-saved').length, 2);
  assert.equal(h.storage.waypointJournals.journals[0].entries[0].comment, 'Updated first note');
  assert.equal(h.storage.waypointJournals.journals[0].entries[1].comment, 'Second note');
  await h.click('Delete note');
  assert.equal(h.root.querySelectorAll('.waypoint-journal-saved').length, 1);
  assert.equal(h.storage.waypointJournals.journals[0].entries[0].comment, 'Second note');
});


test('dragging a note header retains its new position without changing its text', async () => {
  const h = await harness({ waypointAnnotationMode: 'journal', waypointJournals: { version: 1, journals: [{ id: 'j', name: 'Personal', scope: 'https://example.com/app?page=1', entries: [{ id: 'e', comment: 'Move me', seed: 1, targets: [{ selector: '#target' }] }] }] } });
  const card = h.root.querySelector('.waypoint-journal-saved');
  const dispatch = (target, type, x, y) => {
    const event = new h.window.Event(type, { bubbles: true });
    Object.assign(event, { button: 0, pointerId: 1, clientX: x, clientY: y });
    target.dispatchEvent(event);
  };
  Object.defineProperty(card, 'offsetWidth', { value: 200 });
  Object.defineProperty(card, 'offsetHeight', { value: 100 });
  dispatch(card.querySelector('.waypoint-journal-heading'), 'pointerdown', 30, 70);
  dispatch(card, 'pointermove', 130, 170);
  assert.equal(card.style.left, '120px');
  assert.equal(card.style.top, '160px');
  dispatch(card, 'pointerup', 130, 170);
  assert.equal(card.classList.contains('waypoint-journal-dragging'), false);
  assert.equal(card.style.left, '120px');
  assert.equal(h.storage.waypointJournals.journals[0].entries[0].comment, 'Move me');
});

test('journal menu prioritizes selection and reveals creation only when requested', async () => {
  const h = await harness();
  await h.click('Journal'); h.ctx.WaypointJournal.openMenu();
  assert.equal(h.root.querySelector('form').hidden, false, 'first journal is immediately creatable');
  await createJournal(h);
  assert.equal(h.root.querySelector('form').hidden, true);
  assert.equal(h.root.querySelector('.waypoint-journal-count').textContent, '0 notes');
  assert.ok(h.root.querySelector('.waypoint-journal-picker [aria-label="Hide journal"]'));
  await h.click('New journal');
  assert.equal(h.root.querySelector('form').hidden, false);
  await createJournal(h, 'Second journal');
  assert.equal(h.storage.waypointJournals.journals.length, 2);
  assert.equal(h.root.querySelector('form').hidden, true);
  let storageTab;
  h.ctx.WaypointToolbar = { openDataStorage: tab => { storageTab = tab; } };
  await h.click('Journal storage');
  assert.equal(storageTab, 'journal');
  assert.equal(h.root.querySelector('.waypoint-journal-panel'), null);
});

test('first journal pen click creates a collection and resumes selection without a stuck toolbar', async () => {
  const h = await harness({ waypointAnnotationMode: 'journal' });
  let active = false;
  h.ctx.WaypointInspectionMode.isActive = () => active;
  h.ctx.WaypointEvents.on('inspection:start', () => { active = true; h.ctx.WaypointEvents.emit('inspection:started'); });
  h.ctx.WaypointEvents.on('inspection:stop', () => { if (!active) return; active = false; h.ctx.WaypointEvents.emit('inspection:stopped'); });
  h.ctx.WaypointAPI = new Proxy(h.ctx.WaypointAPI, { get(target, key) { return target[key] || (async () => key === 'checkServerStatus' ? { connected: false } : null); } });
  h.ctx.navigator.platform = 'MacIntel';
  h.ctx.chrome.runtime.getURL = path => path;
  h.ctx.WaypointTheme = { get: () => 'light' };
  vm.runInContext(await readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8'), h.ctx);
  await h.ctx.WaypointToolbar.init();
  const pen = h.root.querySelector('.waypoint-toolbar .waypoint-tb-annotate');
  assert.ok(pen);
  pen.click();
  assert.equal(active, false, 'journal with no collection refuses selection');
  assert.equal(pen.classList.contains('active'), false, 'toolbar must not stay selected after a nested stop');
  await h.flush();
  assert.equal(h.storage.waypointJournals.journals.length, 1);
  assert.equal(active, true, 'selection resumes after automatic journal creation');
  assert.equal(pen.classList.contains('active'), true);
  pen.click();
  assert.equal(active, false, 'pen still stops normally');
  pen.click();
  assert.equal(active, true, 'pen can restart normally');
});

test('journal releases selection before asynchronous target capture finishes', async () => {
  const h = await harness();
  await h.click('Journal'); h.ctx.WaypointJournal.openMenu(); await createJournal(h);
  let stopped = false, resolveCapture;
  h.ctx.WaypointEvents.on('inspection:stop', () => { stopped = true; });
  h.ctx.WaypointElementContext.generate = () => new Promise(resolve => { resolveCapture = resolve; });
  h.ctx.WaypointEvents.emit('inspection:elementClicked', { element: h.window.document.querySelector('#target') });
  assert.equal(stopped, true, 'a pending capture must not leave the inspector selected with disabled listeners');
  resolveCapture({ selector: '#target', tag: 'h1', text: 'Title', classes: [] });
  await h.flush();
  assert.ok(h.root.querySelector('textarea'));
});
