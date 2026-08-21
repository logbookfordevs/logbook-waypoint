import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadController(chrome) {
  const source = await readFile(new URL('../public/background/action-controller.js', import.meta.url), 'utf8');
  const context = vm.createContext({ chrome });
  vm.runInContext(source, context);
  return context.WaypointActionController;
}

test('healthy extension action toggles the overlay without opening intervention UI', async () => {
  const messages = [];
  const popupCalls = [];
  const chrome = {
    tabs: {
      async sendMessage(tabId, message) {
        messages.push({ tabId, message });
        if (message.action === 'getOverlayState') return { success: true, visible: true };
        return { success: true, visible: false };
      },
    },
    action: {
      async setPopup(details) { popupCalls.push(details); },
      async openPopup() { popupCalls.push('open'); },
    },
  };
  const controller = await loadController(chrome);

  const result = await controller.handleClick({ id: 12, windowId: 4 });

  assert.equal(result.direct, true);
  assert.deepEqual(messages.map(entry => entry.message.action), ['getOverlayState', 'toggleOverlay']);
  assert.deepEqual(popupCalls, []);
});

test('missing content script opens intervention UI for permission or reload recovery', async () => {
  const popupCalls = [];
  const chrome = {
    tabs: { async sendMessage() { throw new Error('Receiving end does not exist'); } },
    action: {
      async setPopup(details) { popupCalls.push(details); },
      async openPopup(details) { popupCalls.push({ open: details }); },
    },
  };
  const controller = await loadController(chrome);

  const result = await controller.handleClick({ id: 7, windowId: 3 });

  assert.equal(result.direct, false);
  assert.equal(JSON.stringify(popupCalls), JSON.stringify([
    { tabId: 7, popup: 'intervention.html' },
    { open: { windowId: 3 } },
  ]));
});

test('generated action has no default popup while retaining intervention UI', async () => {
  const manifest = JSON.parse(await readFile(new URL('../.output/chrome-mv3/manifest.json', import.meta.url), 'utf8'));
  const intervention = await readFile(new URL('../.output/chrome-mv3/intervention.html', import.meta.url), 'utf8');

  assert.equal(manifest.action.default_popup, undefined);
  assert.match(intervention, /Logbook Waypoint/);
});

test('generated manifest keeps Annotate in-app and assigns three browser toolbar commands', async () => {
  const manifest = JSON.parse(await readFile(new URL('../.output/chrome-mv3/manifest.json', import.meta.url), 'utf8'));

  assert.deepEqual(manifest.commands, {
    'toggle-toolbar-collapse': {
      suggested_key: { default: 'Ctrl+Shift+1', mac: 'Command+Shift+1' },
      description: 'Collapse or expand the Waypoint toolbar',
    },
    'toggle-toolbar-settings': {
      suggested_key: { default: 'Ctrl+Shift+2', mac: 'Command+Shift+2' },
      description: 'Open or close Waypoint settings',
    },
    'toggle-waypoint-visibility': {
      suggested_key: { default: 'Ctrl+Shift+0', mac: 'Command+Shift+0' },
      description: 'Hide or show Logbook Waypoint',
    },
  });
});

test('extension commands route supported tabs through the content-script command seam', async () => {
  const messages = [];
  const chrome = {
    tabs: {
      async sendMessage(tabId, message) { messages.push({ tabId, message }); },
    },
  };
  const controller = await loadController(chrome);

  for (const [command, action] of [
    ['toggle-toolbar-collapse', 'toggleToolbarCollapse'],
    ['toggle-toolbar-settings', 'toggleToolbarSettings'],
    ['toggle-waypoint-visibility', 'toggleOverlay'],
  ]) {
    await controller.handleCommand(command, { id: 12, url: 'http://localhost:3000/review' }, async () => true);
    assert.deepEqual(JSON.parse(JSON.stringify(messages.at(-1))), { tabId: 12, message: { action } });
  }

  const before = messages.length;
  await controller.handleCommand('toggle-toolbar-collapse', { id: 13, url: 'https://example.com' }, async () => false);
  assert.equal(messages.length, before);
});
