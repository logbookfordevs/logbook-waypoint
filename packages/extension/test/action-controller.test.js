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
