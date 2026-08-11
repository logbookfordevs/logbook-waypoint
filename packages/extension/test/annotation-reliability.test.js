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
      <section class="first shared"><button>Save</button></section>
      <section class="second shared"><button>Save</button></section>
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
    element_context: { tag: 'button', text: 'Save', classes: [], position: { x: 0, y: 0 } },
    parent_chain: [{ tag: 'section', classes: ['second', 'shared'], id: null, role: null }],
  });
  assert.equal(recovered, secondButton);

  const missingContext = context.VibeElementContext.findElementBySelector({
    selector: 'button',
    element_context: { tag: 'button', text: 'Save', classes: [] },
    parent_chain: [{ tag: 'section', classes: ['missing'], id: null, role: null }],
  });
  assert.equal(missingContext, null);

  const host = context.document.createElement('target-card');
  context.document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const shadowButton = context.document.createElement('button');
  shadowButton.textContent = 'Shadow save';
  shadow.appendChild(shadowButton);
  const shadowSelector = context.VibeElementContext.generateSelector(shadowButton);
  assert.match(shadowSelector, /\s>>\s/);
  assert.equal(context.VibeElementContext.findElementBySelector({ selector: shadowSelector }), shadowButton);

  shadowButton.remove();
  const lightDomDecoy = context.document.createElement('button');
  lightDomDecoy.textContent = 'Shadow save';
  context.document.body.appendChild(lightDomDecoy);
  const missingShadowTarget = context.VibeElementContext.findElementBySelector({
    selector: shadowSelector,
    element_context: { tag: 'button', text: 'Shadow save', classes: [] },
    parent_chain: null,
  });
  assert.equal(missingShadowTarget, null);
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

test('full Queue sync preserves more than 50 annotations in both directions', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'background/queue-sync.js');
  const annotations = Array.from({ length: 75 }, (_, index) => ({
    id: `vibe_${index}_abcdefghi`,
    created_at: '2026-01-01T00:00:00.000Z',
  }));

  const pulled = context.VibeQueueSync.merge([], annotations, []);
  assert.equal(pulled.annotations.length, 75);
  assert.equal(pulled.annotations.every(annotation => annotation._synced), true);

  const local = annotations.map(annotation => ({ ...annotation, _synced: false }));
  const pushed = context.VibeQueueSync.merge(local, [], []);
  assert.equal(pushed.annotations.length, 75);
  assert.equal(pushed.changed, true);
});

test('Queue conflict resolution preserves Variant-owned state from ordinary records', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'background/queue-sync.js');
  const unresolved = {
    id: 'vibe_1_abcdefghi',
    updated_at: '2026-01-01T00:00:00.000Z',
    variant_request: { status: 'unresolved', active_variant_key: 'compact', variants: [] },
    variant_presentation: { css: '.card { gap: 8px; }' },
    _synced: true,
  };
  const newerOrdinary = {
    id: unresolved.id,
    updated_at: '2026-01-02T00:00:00.000Z',
    comment: 'stale ordinary copy',
  };

  const localOwned = context.VibeQueueSync.merge([unresolved], [newerOrdinary], []);
  assert.deepEqual(localOwned.annotations[0].variant_request, unresolved.variant_request);
  assert.equal(localOwned.changed, false);

  const serverOwned = context.VibeQueueSync.merge([newerOrdinary], [unresolved], []);
  assert.deepEqual(serverOwned.annotations[0].variant_request, unresolved.variant_request);
  assert.equal(serverOwned.annotations[0]._synced, false);
  assert.equal(serverOwned.changed, true);

  const localEdited = {
    ...unresolved,
    updated_at: '2026-01-03T00:00:00.000Z',
    comment: 'new local comment',
  };
  const staleServerVariant = {
    ...unresolved,
    updated_at: '2026-01-02T00:00:00.000Z',
    comment: 'old server comment',
    variant_request: {
      ...unresolved.variant_request,
      active_variant_key: 'spacious',
    },
  };
  const fieldGranular = context.VibeQueueSync.merge([localEdited], [staleServerVariant], []);
  assert.equal(fieldGranular.annotations[0].comment, 'new local comment');
  assert.equal(fieldGranular.annotations[0].variant_request.active_variant_key, 'spacious');
  assert.equal(fieldGranular.annotations[0]._synced, false);
});

test('Queue rerender rolls back removed previews without replacing unchanged CSS rules', async () => {
  const context = createBrowserContext('<html><head></head><body><div id="overlay"></div><button id="target">Old</button></body></html>');
  const target = context.document.querySelector('#target');
  target.style.color = 'green';
  target.style.backgroundColor = 'yellow';
  const replacement = context.document.createElement('button');
  replacement.textContent = 'Old';
  replacement.style.color = 'green';
  replacement.style.backgroundColor = 'yellow';
  context.document.body.appendChild(replacement);
  const overlay = context.document.querySelector('#overlay');
  const annotation = {
    id: 'vibe_1_abcdefghi',
    comment: 'Change it',
    created_at: '2026-01-01T00:00:00.000Z',
    pending_changes: {
      color: { original: 'green', value: 'red' },
      copyChange: { original: 'Old', value: 'New' },
    },
    css: '#target:hover { color: blue; }',
  };
  context.VibeShadowHost = { getRoot: () => overlay };
  let resolvedTarget = target;
  context.VibeElementContext = { findElementBySelector: candidate => candidate.id === annotation.id ? resolvedTarget : null };
  await loadScript(context, 'content/modules/event-bus.js');
  await loadScript(context, 'content/modules/badge-manager.js');
  context.VibeBadgeManager.render([annotation]);
  const firstStyle = context.document.querySelector('[data-vibe-style]');
  const firstBadge = overlay.querySelector('.vibe-badge');
  assert.equal(target.style.color, 'red');
  assert.equal(target.textContent, 'New');

  context.VibeBadgeManager.render([annotation]);
  assert.equal(context.document.querySelector('[data-vibe-style]'), firstStyle);
  assert.equal(overlay.querySelector('.vibe-badge'), firstBadge);

  resolvedTarget = replacement;
  context.VibeBadgeManager.render([annotation]);
  assert.equal(target.style.color, 'green');
  assert.equal(target.textContent, 'Old');
  assert.equal(replacement.style.color, 'red');
  assert.equal(replacement.textContent, 'New');
  assert.equal(overlay.querySelector('.vibe-badge'), firstBadge);

  context.VibeBadgeManager.render([]);
  assert.equal(replacement.style.color, 'green');
  assert.equal(replacement.style.backgroundColor, 'yellow');
  assert.equal(replacement.textContent, 'Old');
  assert.equal(context.document.querySelector('[data-vibe-style]'), null);
});
