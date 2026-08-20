import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

async function loadScript(context, relativePath) {
  if ((relativePath === 'content/modules/api-bridge.js' || relativePath === 'background/queue-sync.js') && !context.WaypointAnnotationStatus) {
    await loadScript(context, 'annotation-status.js');
    await loadScript(context, 'annotation-collection.js');
  }
  if (relativePath === 'content/modules/api-bridge.js' && !context.WaypointDesignIntent) {
    await loadScript(context, 'design-intent.js');
  }
  if (relativePath === 'background/queue-sync.js' && !context.WaypointDesignIntent) {
    await loadScript(context, 'design-intent.js');
  }
  if (relativePath === 'content/modules/api-bridge.js' && !context.WaypointAnnotationValidation) {
    await loadScript(context, 'annotation-validation.js');
  }
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
  context.WaypointAPI = { getScreenshotEnabled: async () => false };
  await loadScript(context, 'content/modules/shadow-dom-utils.js');
  await loadScript(context, 'content/modules/element-context.js');

  const secondButton = context.document.querySelector('.second button');
  const selector = context.WaypointElementContext.generateSelector(secondButton);
  assert.equal(secondButton.hasAttribute('data-waypoint-id'), false);
  assert.equal(secondButton.hasAttribute('data-text-content'), false);
  assert.equal(context.document.querySelector(selector), secondButton);

  const recovered = context.WaypointElementContext.findElementBySelector({
    selector: 'button',
    element_context: { tag: 'button', text: 'Save', classes: [], position: { x: 0, y: 0 } },
    parent_chain: [{ tag: 'section', classes: ['second', 'shared'], id: null, role: null }],
  });
  assert.equal(recovered, secondButton);

  const missingContext = context.WaypointElementContext.findElementBySelector({
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
  const shadowSelector = context.WaypointElementContext.generateSelector(shadowButton);
  assert.match(shadowSelector, /\s>>\s/);
  assert.equal(context.WaypointElementContext.findElementBySelector({ selector: shadowSelector }), shadowButton);

  shadowButton.remove();
  const lightDomDecoy = context.document.createElement('button');
  lightDomDecoy.textContent = 'Shadow save';
  context.document.body.appendChild(lightDomDecoy);
  const missingShadowTarget = context.WaypointElementContext.findElementBySelector({
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

  assert.equal(context.WaypointKeyboardTarget.isEditableEvent({ composedPath: () => [input] }), true);
  assert.equal(context.WaypointKeyboardTarget.isEditableEvent({ composedPath: () => [editable] }), true);
  assert.equal(context.WaypointKeyboardTarget.isEditableEvent({ composedPath: () => [toolbarButton] }), false);
});

test('content status preserves a local extension incompatibility message', async () => {
  const context = createBrowserContext();
  context.chrome = {
    runtime: {
      sendMessage: async () => ({
        success: true,
        status: {
          connected: true,
          compatibility_message: 'Extension update required. Minimum version: 0.2.0',
          version_compatible: false,
        },
      }),
    },
  };
  await loadScript(context, 'content/modules/api-bridge.js');

  const status = await context.WaypointAPI.checkServerStatus();
  assert.equal(status.connected, true);
  assert.equal(status.compatibility_message, 'Extension update required. Minimum version: 0.2.0');
  assert.equal(status.version_compatible, false);
});

test('direct storage fallback rejects non-Waypoint Annotation IDs', async () => {
  const context = createBrowserContext();
  const writes = [];
  context.chrome = {
    runtime: { sendMessage: async () => { throw new Error('background unavailable'); } },
    storage: {
      local: {
        get: async () => ({ waypointAnnotations: [] }),
        set: async value => { writes.push(value); },
      },
    },
  };
  context.WaypointAnnotationId = {
    isValid: value => /^waypoint_[0-9]{10,16}_[a-z0-9]{6,32}$/.test(value),
  };
  context.WaypointVariantPolicy = { assertSaveAllowed: () => {} };
  await loadScript(context, 'content/modules/api-bridge.js');

  await assert.rejects(
    context.WaypointAPI.saveAnnotation({ id: 'vibe_1750000000000_abc123xyz', status: 'pending' }),
    /Invalid Waypoint annotation ID/,
  );
  assert.deepEqual(writes, []);
});

test('direct storage fallback rejects lifecycle state injection', async () => {
  const context = createBrowserContext();
  const writes = [];
  context.chrome = {
    runtime: { sendMessage: async () => { throw new Error('background unavailable'); } },
    storage: {
      local: {
        get: async () => ({ waypointAnnotations: [] }),
        set: async value => { writes.push(value); },
      },
    },
  };
  context.WaypointVariantPolicy = { assertSaveAllowed: () => {} };
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'content/modules/api-bridge.js');

  await assert.rejects(
    context.WaypointAPI.saveAnnotation({
      id: 'waypoint_1750000000000_abc123xyz',
      status: 'resolved',
      comment: 'Bypass',
    }),
    /must start Pending/i,
  );
  assert.deepEqual(writes, []);
});

test('direct storage fallback keeps Annotation identity immutable', async () => {
  const context = createBrowserContext();
  const writes = [];
  context.chrome = {
    runtime: { sendMessage: async () => { throw new Error('background unavailable'); } },
    storage: {
      local: {
        get: async () => ({
          waypointAnnotations: [{ id: 'waypoint_1750000000000_abc123xyz', comment: 'Original', status: 'pending' }],
        }),
        set: async value => { writes.push(value); },
      },
    },
  };
  context.WaypointAnnotationId = {
    isValid: value => /^waypoint_[0-9]{10,16}_[a-z0-9]{6,32}$/.test(value),
  };
  context.WaypointVariantPolicy = { assertUpdateAllowed: () => {} };
  await loadScript(context, 'content/modules/api-bridge.js');

  await assert.rejects(
    context.WaypointAPI.updateAnnotation(
      'waypoint_1750000000000_abc123xyz',
      { id: 'vibe_1750000000000_abc123xyz' },
    ),
    /Annotation ID cannot be changed/,
  );
  assert.deepEqual(writes, []);
});

test('direct storage fallback records explicit Design Intent removal', async () => {
  const context = createBrowserContext();
  const writes = [];
  const id = 'waypoint_1750000000000_abc123xyz';
  context.chrome = {
    runtime: { sendMessage: async () => { throw new Error('background unavailable'); } },
    storage: {
      local: {
        get: async () => ({
          waypointAnnotations: [{
            id,
            url: 'http://localhost:3000/app',
            comment: 'Remove intent',
            status: 'pending',
            design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
          }],
        }),
        set: async value => { writes.push(value); },
      },
    },
  };
  context.WaypointAnnotationId = {
    isValid: value => value === id,
    filterValid: annotations => annotations.filter(annotation => annotation.id === id),
  };
  context.WaypointVariantPolicy = { assertUpdateAllowed: () => {} };
  await loadScript(context, 'content/modules/api-bridge.js');

  await context.WaypointAPI.updateAnnotation(id, { design_intent: null });

  assert.equal('design_intent' in writes[0].waypointAnnotations[0], false);
  assert.deepEqual(Array.from(writes[0].waypointDesignIntentRemovalIds), [id]);
});

test('direct storage delete fallback rejects non-Waypoint Annotation IDs', async () => {
  const context = createBrowserContext();
  const writes = [];
  context.chrome = {
    runtime: { sendMessage: async () => { throw new Error('background unavailable'); } },
    storage: {
      local: {
        get: async () => ({ waypointAnnotations: [] }),
        set: async value => { writes.push(value); },
      },
    },
  };
  context.WaypointAnnotationId = {
    isValid: value => /^waypoint_[0-9]{10,16}_[a-z0-9]{6,32}$/.test(value),
  };
  context.WaypointVariantPolicy = { assertDeleteAllowed: () => {} };
  await loadScript(context, 'content/modules/api-bridge.js');

  await assert.rejects(
    context.WaypointAPI.deleteAnnotation('vibe_1750000000000_abc123xyz'),
    /Invalid Waypoint annotation ID/,
  );
  assert.deepEqual(writes, []);
});

test('storage reads ignore predecessor Annotation IDs', async () => {
  const context = createBrowserContext();
  context.window.location = {
    href: 'http://localhost/review',
    origin: 'http://localhost',
    protocol: 'http:',
  };
  context.chrome = {
    storage: {
      local: {
        get: async () => ({
          waypointAnnotations: [
            { id: 'vibe_1750000000000_abc123xyz', url: context.window.location.href, comment: 'Legacy', status: 'pending' },
            { id: 'waypoint_1750000000000_abc123xyz', url: context.window.location.href, comment: 'Current', status: 'pending' },
          ],
        }),
      },
    },
  };
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'content/modules/api-bridge.js');

  const annotations = await context.WaypointAPI.loadAnnotations();

  assert.deepEqual(annotations.map(annotation => annotation.id), [
    'waypoint_1750000000000_abc123xyz',
  ]);
});

test('storage reads with malformed Design Intent do not reach content consumers', async () => {
  const context = createBrowserContext();
  context.window.location = { href: 'http://localhost:3000/app' };
  context.chrome = {
    storage: {
      local: {
        get: async () => ({
          waypointAnnotations: [{
            id: 'waypoint_1750000000000_abc123xyz',
            url: 'http://localhost:3000/app',
            comment: 'Malformed',
            status: 'pending',
            design_intent: { schema_version: 2, workflow: 'impeccable', action: null },
          }],
        }),
      },
    },
  };
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'annotation-validation.js');
  context.WaypointVariantPolicy = {};
  await loadScript(context, 'content/modules/api-bridge.js');

  assert.equal((await context.WaypointAPI.loadAnnotations()).length, 0);
});

test('ordinary Queue sync does not erase existing Design Intent', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'annotation-status.js');
  await loadScript(context, 'annotation-collection.js');
  await loadScript(context, 'design-intent.js');
  await loadScript(context, 'background/queue-sync.js');
  const designIntent = {
    schema_version: 1,
    workflow: 'impeccable',
    action: null,
  };
  const local = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app',
    comment: 'Intent owner',
    status: 'pending',
    updated_at: '2026-08-18T10:00:00.000Z',
    design_intent: designIntent,
  };
  const ordinaryServer = {
    ...local,
    comment: 'Ordinary client update',
    updated_at: '2026-08-18T11:00:00.000Z',
  };
  delete ordinaryServer.design_intent;

  const merged = context.WaypointQueueSync.merge([local], [ordinaryServer]).annotations[0];
  assert.deepEqual(JSON.parse(JSON.stringify(merged.design_intent)), designIntent);
});

test('explicit Design Intent removal survives Queue reconciliation', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'annotation-status.js');
  await loadScript(context, 'annotation-collection.js');
  await loadScript(context, 'design-intent.js');
  await loadScript(context, 'background/queue-sync.js');
  const id = 'waypoint_1750000000000_abc123xyz';
  const local = { id, url: 'http://localhost:3000/app', comment: 'Intent removed', status: 'pending' };
  const server = {
    ...local,
    design_intent: { schema_version: 1, workflow: 'impeccable', action: null },
  };

  const merged = context.WaypointQueueSync.merge([local], [server], [], [id]).annotations[0];
  assert.equal('design_intent' in merged, false);
  assert.equal(merged._synced, false);
});

test('full Queue sync preserves more than 50 annotations in both directions', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'background/queue-sync.js');
  const annotations = Array.from({ length: 75 }, (_, index) => ({
    id: `waypoint_${1750000000000 + index}_abcdefghi`,
    created_at: '2026-01-01T00:00:00.000Z',
    status: 'pending',
  }));

  const pulled = context.WaypointQueueSync.merge([], annotations, []);
  assert.equal(pulled.annotations.length, 75);
  assert.equal(pulled.annotations.every(annotation => annotation._synced), true);

  const withPredecessorData = context.WaypointQueueSync.merge(
    [],
    [...annotations, { id: 'vibe_1750000000000_abc123xyz', status: 'pending' }],
    ['vibe_1750000000000_deleted'],
  );
  assert.equal(withPredecessorData.annotations.length, 75);
  assert.equal(withPredecessorData.annotations.some(annotation => annotation.id.startsWith('vibe_')), false);

  const local = annotations.map(annotation => ({ ...annotation, _synced: false }));
  const pushed = context.WaypointQueueSync.merge(local, [], []);
  assert.equal(pushed.annotations.length, 75);
  assert.equal(pushed.changed, true);
});

test('Queue sync retains migrated terminal history missing from the server', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'background/queue-sync.js');
  const migrated = {
    id: 'waypoint_1750000000001_abcdefghi',
    status: 'resolved',
    updated_at: '2026-01-01T00:00:00.000Z',
    _synced: false,
  };

  const result = context.WaypointQueueSync.merge([migrated], [], []);
  assert.deepEqual(JSON.parse(JSON.stringify(result.annotations)), [migrated]);

  const background = await readFile(new URL('../public/background/background.js', import.meta.url), 'utf8');
  assert.match(background, /serverIds\.has\(annotation\.id\) \|\| annotation\.status === 'pending'/);
});

test('Queue conflict resolution preserves Variant-owned state from ordinary records', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'background/queue-sync.js');
  const unresolved = {
    id: 'waypoint_1750000000001_abcdefghi',
    status: 'pending',
    updated_at: '2026-01-01T00:00:00.000Z',
    variant_request: { status: 'unresolved', active_variant_key: 'compact', variants: [] },
    variant_presentation: { css: '.card { gap: 8px; }' },
    _synced: true,
  };
  const newerOrdinary = {
    id: unresolved.id,
    status: 'pending',
    updated_at: '2026-01-02T00:00:00.000Z',
    comment: 'stale ordinary copy',
  };

  const localOwned = context.WaypointQueueSync.merge([unresolved], [newerOrdinary], []);
  assert.deepEqual(localOwned.annotations[0].variant_request, unresolved.variant_request);
  assert.equal(localOwned.changed, false);

  const serverOwned = context.WaypointQueueSync.merge([newerOrdinary], [unresolved], []);
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
  const fieldGranular = context.WaypointQueueSync.merge([localEdited], [staleServerVariant], []);
  assert.equal(fieldGranular.annotations[0].comment, 'new local comment');
  assert.equal(fieldGranular.annotations[0].variant_request.active_variant_key, 'spacious');
  assert.equal(fieldGranular.annotations[0]._synced, false);
});

test('Queue conflict resolution preserves server-owned lifecycle state and Claim', async () => {
  const context = createBrowserContext();
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'background/queue-sync.js');
  const local = {
    id: 'waypoint_1750000000001_abcdefghi',
    status: 'pending',
    comment: 'new local comment',
    updated_at: '2026-01-03T00:00:00.000Z',
  };

  for (const server of [
    {
      ...local,
      comment: 'old server comment',
      updated_at: '2026-01-02T00:00:00.000Z',
      work_notice: {
        code: 'workflow_unavailable',
        summary: 'Install Impeccable, then claim to retry.',
        created_at: '2026-01-02T00:00:00.000Z',
      },
    },
    {
      ...local,
      status: 'claimed',
      comment: 'old server comment',
      updated_at: '2026-01-02T00:00:00.000Z',
      claim: { owner: 'agent-one', refreshed_at: '2026-01-02T00:00:00.000Z', expires_at: '2026-01-02T00:05:00.000Z' },
    },
    { ...local, status: 'resolved', comment: 'old server comment', updated_at: '2026-01-02T00:00:00.000Z' },
    { ...local, status: 'discarded', comment: 'old server comment', updated_at: '2026-01-02T00:00:00.000Z' },
  ]) {
    const merged = context.WaypointQueueSync.merge([local], [server], []).annotations[0];
    assert.equal(merged.comment, 'new local comment');
    assert.equal(merged.status, server.status);
    assert.deepEqual(merged.claim, server.claim);
    assert.deepEqual(merged.work_notice, server.work_notice);
    assert.equal(merged._synced, false);
  }
});

test('rendered Queue shows recovery guidance and dismisses Work Notices through lifecycle', async () => {
  const context = createBrowserContext();
  const messages = [];
  context.chrome = {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: async message => {
        messages.push(message);
        return { success: true, annotation: { id: message.id, status: 'pending' } };
      },
    },
    storage: { onChanged: { addListener() {} } },
  };
  const popupSource = await readFile(new URL('../.output/chrome-mv3/popup/popup.js', import.meta.url), 'utf8');
  vm.runInContext(`${popupSource}\nglobalThis.WaypointAnnotationsPopup = AnnotationsPopup;`, context, {
    filename: 'popup/popup.js',
  });
  const popup = Object.create(context.WaypointAnnotationsPopup.prototype);
  popup.annotations = [{
    id: 'waypoint_1750000000001_abcdefghi',
    status: 'pending',
    comment: 'Make this easier to scan',
    created_at: '2026-08-19T12:00:00.000Z',
    work_notice: {
      code: 'execution_failed',
      summary: 'The design workflow stopped before producing a result. Claim to retry.',
      created_at: '2026-08-19T12:05:00.000Z',
    },
  }];
  popup.getTimeAgo = () => 'now';
  popup.render = () => {};

  const container = context.document.createElement('div');
  container.innerHTML = popup.renderAnnotationItem(popup.annotations[0]);
  const notice = container.querySelector('.work-notice');
  assert.match(notice.textContent, /Design workflow needs attention/);
  assert.match(notice.textContent, /The design workflow stopped before producing a result/);

  await popup.dismissWorkNotice('waypoint_1750000000001_abcdefghi');
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{
    action: 'dismissWorkNotice',
    id: 'waypoint_1750000000001_abcdefghi',
  }]);
  assert.equal('work_notice' in popup.annotations[0], false);
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
    id: 'waypoint_1750000000001_abcdefghi',
    comment: 'Change it',
    status: 'pending',
    created_at: '2026-01-01T00:00:00.000Z',
    pending_changes: {
      color: { original: 'green', value: 'red' },
      copyChange: { original: 'Old', value: 'New' },
    },
    css: '#target:hover { color: blue; }',
  };
  context.WaypointShadowHost = { getRoot: () => overlay };
  let resolvedTarget = target;
  context.WaypointElementContext = { findElementBySelector: candidate => candidate.id === annotation.id ? resolvedTarget : null };
  await loadScript(context, 'annotation-status.js');
  await loadScript(context, 'content/modules/event-bus.js');
  await loadScript(context, 'content/modules/badge-manager.js');
  context.WaypointBadgeManager.render([annotation]);
  const firstStyle = context.document.querySelector('[data-waypoint-style]');
  const firstBadge = overlay.querySelector('.waypoint-badge');
  assert.equal(target.style.color, 'red');
  assert.equal(target.textContent, 'New');

  context.WaypointBadgeManager.render([annotation]);
  assert.equal(context.document.querySelector('[data-waypoint-style]'), firstStyle);
  assert.equal(overlay.querySelector('.waypoint-badge'), firstBadge);

  resolvedTarget = replacement;
  context.WaypointBadgeManager.render([annotation]);
  assert.equal(target.style.color, 'green');
  assert.equal(target.textContent, 'Old');
  assert.equal(replacement.style.color, 'red');
  assert.equal(replacement.textContent, 'New');
  assert.equal(overlay.querySelector('.waypoint-badge'), firstBadge);

  context.WaypointBadgeManager.render([]);
  assert.equal(replacement.style.color, 'green');
  assert.equal(replacement.style.backgroundColor, 'yellow');
  assert.equal(replacement.textContent, 'Old');
  assert.equal(context.document.querySelector('[data-waypoint-style]'), null);
});
