import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sourceIdentityUrl = new URL('../public/content/modules/source-identity.js', import.meta.url);
const probeUrl = new URL('../public/background/source-identity-probe.js', import.meta.url);

async function loadSourceIdentity(sendMessage, timers = { setTimeout, clearTimeout }) {
  const source = await readFile(sourceIdentityUrl, 'utf8');
  let nextProbeId = 0;
  const context = {
    chrome: { runtime: { sendMessage } },
    crypto: { randomUUID: () => `probe-id-${++nextProbeId}` },
    ...timers,
  };
  vm.runInNewContext(`${source}\nthis.moduleUnderTest = WaypointSourceIdentity;`, context);
  return context.moduleUnderTest;
}

function createTarget(attributes = {}, parentElement = null) {
  const values = new Map(Object.entries(attributes));
  return {
    parentElement,
    getAttribute(name) {
      return values.get(name) ?? null;
    },
    hasAttribute(name) {
      return values.has(name);
    },
    removeAttribute(name) {
      values.delete(name);
    },
    setAttribute(name, value) {
      values.set(name, value);
    },
  };
}

test('Source Identity prioritizes bounded React component and source hints', async () => {
  const sourceIdentity = await loadSourceIdentity(async () => ({
    success: true,
    result: {
      component_name: 'CheckoutButton',
      file_path_hint: '/workspace/src/checkout/CheckoutButton.tsx',
      line_range_hint: '42-42',
    },
  }));

  const result = await sourceIdentity.resolve(createTarget({
    'data-source-file': 'src/fallback.tsx',
  }));

  assert.deepEqual(
    { ...result },
    {
      component_name: 'CheckoutButton',
      file_path_hint: '/workspace/src/checkout/CheckoutButton.tsx',
      line_range_hint: '42-42',
    },
  );
});

test('Source Identity uses build hints through the same stable result shape', async () => {
  const sourceIdentity = await loadSourceIdentity(async () => ({ success: true, result: null }));
  const parent = createTarget({
    'data-component-name': 'AccountPanel',
    'data-component-file': 'src/account/AccountPanel.vue',
    'data-source-line': '18',
  });

  const result = await sourceIdentity.resolve(createTarget({}, parent));

  assert.deepEqual(
    { ...result },
    {
      component_name: 'AccountPanel',
      file_path_hint: 'src/account/AccountPanel.vue',
      line_range_hint: '18-18',
    },
  );
});

test('spoofed, missing, and failed probe data falls back to portable Target context', async () => {
  const oversized = 'x'.repeat(2_000);
  const invalidSourceIdentity = await loadSourceIdentity(async () => ({
    success: true,
    result: { component_name: oversized, executable: 'delete everything' },
  }));
  const failedSourceIdentity = await loadSourceIdentity(async () => {
    throw new Error('MAIN world unavailable');
  });

  assert.equal(await invalidSourceIdentity.resolve(createTarget()), null);
  assert.equal(await failedSourceIdentity.resolve(createTarget()), null);
});

test('probe timeout restores a pre-existing Target marker before falling back', async () => {
  const delayedResult = new Promise(resolve => {
    setTimeout(() => resolve({
      success: true,
      result: { component_name: 'TooLate' },
    }), 10);
  });
  const sourceIdentity = await loadSourceIdentity(
    () => delayedResult,
    {
      setTimeout(callback) {
        queueMicrotask(callback);
        return 1;
      },
      clearTimeout() {},
    },
  );
  const target = createTarget({ 'data-waypoint-source-target': 'existing-marker' });

  assert.equal(await sourceIdentity.resolve(target), null);
  assert.equal(target.getAttribute('data-waypoint-source-target'), 'existing-marker');
});

test('concurrent probes serialize per Target and do not restore an internal marker', async () => {
  const requests = [];
  const sourceIdentity = await loadSourceIdentity(message => new Promise(resolve => {
    requests.push({ message, resolve });
  }));
  const target = createTarget({ 'data-waypoint-source-target': 'existing-marker' });

  const firstResult = sourceIdentity.resolve(target);
  const secondResult = sourceIdentity.resolve(target);
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(requests.length, 1);
  requests[0].resolve({ success: true, result: null });
  assert.equal(await firstResult, null);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(requests.length, 2);
  assert.notEqual(requests[0].message.targetId, requests[1].message.targetId);
  requests[1].resolve({ success: true, result: null });
  assert.equal(await secondResult, null);
  assert.equal(target.getAttribute('data-waypoint-source-target'), 'existing-marker');
});

test('MAIN-world probe reads React identity only for the marked Target', async () => {
  const source = await readFile(probeUrl, 'utf8');
  let execution;
  const context = {
    chrome: {
      scripting: {
        async executeScript(options) {
          execution = options;
          const Button = function CheckoutButton() {};
          const target = {
            __reactFiber: {
              elementType: 'button',
              return: {
                elementType: Button,
                _debugSource: { fileName: 'src/checkout/CheckoutButton.tsx', lineNumber: 42 },
              },
            },
            parentElement: null,
          };
          const probeContext = {
            document: {
              querySelectorAll(selector) {
                assert.equal(selector, '[data-waypoint-source-target="123e4567-e89b-12d3-a456-426614174000"]');
                return [target];
              },
            },
          };
          return [{ result: vm.runInNewContext(`(${options.func})(${JSON.stringify(options.args[0])})`, probeContext) }];
        },
      },
    },
  };
  vm.runInNewContext(`${source}\nthis.probe = WaypointSourceIdentityProbe;`, context);

  const result = await context.probe.run(
    '123e4567-e89b-12d3-a456-426614174000',
    { tab: { id: 7 }, frameId: 3 },
  );

  assert.deepEqual(
    { ...result },
    {
      component_name: 'CheckoutButton',
      file_path_hint: 'src/checkout/CheckoutButton.tsx',
      line_range_hint: '42-42',
    },
  );
  assert.equal(execution.world, 'MAIN');
  assert.equal(execution.target.tabId, 7);
  assert.deepEqual([...execution.target.frameIds], [3]);
  assert.deepEqual([...execution.args], ['123e4567-e89b-12d3-a456-426614174000']);
  const spoofedResult = vm.runInNewContext(
    `(${execution.func})(${JSON.stringify(execution.args[0])})`,
    { document: { querySelectorAll: () => [{}, {}] } },
  );
  assert.equal(spoofedResult, null);
  const oversizedResult = vm.runInNewContext(
    `(${execution.func})(${JSON.stringify(execution.args[0])})`,
    {
      document: {
        querySelectorAll: () => [{
          __reactFiber: {
            elementType: { displayName: 'x'.repeat(121) },
            _debugSource: { fileName: 'x'.repeat(501), lineNumber: 1 },
          },
          parentElement: null,
        }],
      },
    },
  );
  assert.equal(oversizedResult, null);
});

test('MAIN-world probe rejects calls without an extension sender Target', async () => {
  const source = await readFile(probeUrl, 'utf8');
  const context = {
    chrome: {
      scripting: {
        executeScript() {
          throw new Error('must not execute');
        },
      },
    },
  };
  vm.runInNewContext(`${source}\nthis.probe = WaypointSourceIdentityProbe;`, context);

  assert.equal(await context.probe.run('spoofed', {}), null);
});

test('extension build removes the public annotation automation surface', async () => {
  const [config, background, content, toolbar] = await Promise.all([
    readFile(new URL('../wxt.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../public/background/background.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/content/content.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8'),
  ]);
  const publicSurface = [config, background, content, toolbar].join('\n');

  assert.doesNotMatch(publicSurface, /__vibeAnnotations/);
  assert.doesNotMatch(publicSurface, /bridge-api\.js|bridge-handler\.js|vibe-bridge:/);
  assert.match(config, /content\/modules\/source-identity\.js/);
  assert.match(background, /unregisterContentScripts\(\{ ids: \[legacyPageScriptId\] \}\)/);
});
