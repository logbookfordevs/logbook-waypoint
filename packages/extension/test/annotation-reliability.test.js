import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

async function loadScript(context, relativePath) {
  const source = await readFile(new URL(`../.output/chrome-mv3/${relativePath}`, import.meta.url), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

function createBrowserContext(html = '<html><head></head><body></body></html>') {
  const { window } = parseHTML(html);
  const context = vm.createContext({
    window,
    document: window.document,
    Node: window.Node,
    Element: window.Element,
    MutationObserver: window.MutationObserver,
    CSS: { escape: value => String(value).replace(/([^a-zA-Z0-9_-])/g, '\\$1') },
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
  });
  context.globalThis = context;
  return context;
}

test('portable Target fallback respects parent context and open shadow roots', async () => {
  const context = createBrowserContext(`
    <html><head></head><body><main>
      <section class="first"><button>Save</button><a class="unique">Unique</a></section>
      <section class="second"><button>Save</button></section>
    </main></body></html>
  `);
  context.VibeAPI = { getScreenshotEnabled: async () => false };
  await loadScript(context, 'content/modules/shadow-dom-utils.js');
  await loadScript(context, 'content/modules/element-context.js');

  const secondButton = context.document.querySelector('.second button');
  const selector = context.VibeElementContext.generateSelector(secondButton);
  assert.equal(secondButton.hasAttribute('data-vibe-id'), false);
  assert.equal(secondButton.hasAttribute('data-text-content'), false);
  assert.equal(context.document.querySelector(selector), secondButton);

  const recovered = context.VibeElementContext.findElementBySelector({
    selector: 'button',
    element_context: { tag: 'button', text: 'Save', classes: [] },
    parent_chain: [{ tag: 'section', classes: ['second'], id: null, role: null }],
  });
  assert.equal(recovered, secondButton);

  const missingContext = context.VibeElementContext.findElementBySelector({
    selector: 'button',
    element_context: { tag: 'button', text: 'Save', classes: [] },
    parent_chain: [{ tag: 'section', classes: ['missing'], id: null, role: null }],
  });
  assert.equal(missingContext, null);

  const uniqueWrongParent = context.VibeElementContext.findElementBySelector({
    selector: '.unique',
    element_context: { tag: 'a', text: 'Unique', classes: ['unique'] },
    parent_chain: [{ tag: 'section', classes: ['missing'], id: null, role: null }],
  });
  assert.equal(uniqueWrongParent, null);

  const host = context.document.createElement('target-card');
  context.document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const shadowButton = context.document.createElement('button');
  shadowButton.textContent = 'Shadow save';
  shadow.appendChild(shadowButton);
  const shadowSelector = context.VibeElementContext.generateSelector(shadowButton);
  assert.match(shadowSelector, /\s>>\s/);
  assert.equal(context.VibeElementContext.findElementBySelector({ selector: shadowSelector }), shadowButton);
});

test('keyboard shortcuts ignore editable controls across composed paths', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'content/modules/keyboard-target.js');

  const input = context.document.createElement('input');
  const toolbarButton = context.document.createElement('button');
  const editable = context.document.createElement('div');
  editable.setAttribute('contenteditable', 'true');

  assert.equal(context.VibeKeyboardTarget.isEditableEvent({ composedPath: () => [input] }), true);
  assert.equal(context.VibeKeyboardTarget.isEditableEvent({ composedPath: () => [editable] }), true);
  assert.equal(context.VibeKeyboardTarget.isEditableEvent({ composedPath: () => [toolbarButton] }), false);
});

test('content status preserves the server compatibility nudge', async () => {
  const context = createBrowserContext();
  context.chrome = {
    runtime: {
      sendMessage: async () => ({
        success: true,
        status: {
          connected: true,
          compatibility_message: 'Server update recommended.',
          version_compatible: true,
        },
      }),
    },
  };
  await loadScript(context, 'content/modules/api-bridge.js');

  const status = await context.VibeAPI.checkServerStatus();
  assert.equal(status.connected, true);
  assert.equal(status.compatibility_message, 'Server update recommended.');
});

test('Queue rerender rolls back removed previews without replacing unchanged CSS rules', async () => {
  const context = createBrowserContext('<html><head></head><body><div id="overlay"></div><button id="target">Old</button></body></html>');
  const target = context.document.querySelector('#target');
  const overlay = context.document.querySelector('#overlay');
  const annotation = {
    id: 'vibe_1_abcdefghi',
    comment: 'Change it',
    created_at: '2026-01-01T00:00:00.000Z',
    pending_changes: {
      color: { original: '', value: 'red' },
      copyChange: { original: 'Old', value: 'New' },
    },
    css: '#target:hover { color: blue; }',
  };
  context.VibeShadowHost = { getRoot: () => overlay };
  context.VibeElementContext = { findElementBySelector: candidate => candidate.id === annotation.id ? target : null };
  await loadScript(context, 'content/modules/event-bus.js');
  await loadScript(context, 'content/modules/badge-manager.js');
  context.VibeBadgeManager.render([annotation]);
  const firstStyle = context.document.querySelector('[data-vibe-style]');
  assert.equal(target.style.color, 'red');
  assert.equal(target.textContent, 'New');

  context.VibeBadgeManager.render([annotation]);
  assert.equal(context.document.querySelector('[data-vibe-style]'), firstStyle);

  context.VibeBadgeManager.render([]);
  assert.equal(target.style.color, '');
  assert.equal(target.textContent, 'Old');
  assert.equal(context.document.querySelector('[data-vibe-style]'), null);
});
