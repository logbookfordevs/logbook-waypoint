import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

async function createHarness() {
  const { window } = parseHTML(`
    <html>
      <head></head>
      <body>
        <div id="waypoint-host"></div>
        <section id="outer"><button id="button"><span id="leaf">Save</span></button></section>
      </body>
    </html>
  `);
  const host = window.document.querySelector('#waypoint-host');
  const root = host.attachShadow({ mode: 'open' });
  const inspectButton = window.document.createElement('button');
  inspectButton.className = 'waypoint-tb-annotate';
  inspectButton.textContent = 'Inspect';
  root.appendChild(inspectButton);
  const handlers = new Map();
  const documentListeners = new Map();
  const emitted = [];
  const addDocumentListener = window.document.addEventListener.bind(window.document);
  window.document.addEventListener = (name, handler, options) => {
    documentListeners.set(name, handler);
    addDocumentListener(name, handler, options);
  };
  const context = vm.createContext({
    window,
    document: window.document,
    Element: window.Element,
    Node: window.Node,
    performance: { now: () => 100 },
    setTimeout: () => 1,
    clearTimeout() {},
    console,
  });
  context.globalThis = context;
  context.WaypointEvents = {
    on(name, handler) { handlers.set(name, handler); },
    emit(name, payload) { emitted.push({ name, payload }); },
  };
  context.WaypointShadowHost = {
    getRoot: () => root,
    getHost: () => host,
  };
  context.WaypointMultiTargetSelection = { shouldHandle: () => false };

  const shadowUtils = await readFile(new URL('../public/content/modules/shadow-dom-utils.js', import.meta.url), 'utf8');
  const inspectionMode = await readFile(new URL('../public/content/modules/inspection-mode.js', import.meta.url), 'utf8');
  vm.runInContext(shadowUtils, context, { filename: 'shadow-dom-utils.js' });
  vm.runInContext(inspectionMode, context, { filename: 'inspection-mode.js' });
  context.WaypointInspectionMode.init();
  handlers.get('inspection:start')();

  const rects = {
    leaf: { top: 30, left: 40, width: 50, height: 20 },
    button: { top: 24, left: 32, width: 90, height: 36 },
    outer: { top: 12, left: 20, width: 180, height: 60 },
  };
  for (const [id, rect] of Object.entries(rects)) {
    window.document.querySelector(`#${id}`).getBoundingClientRect = () => rect;
  }

  return { context, documentListeners, emitted, handlers, inspectButton, root, window };
}

test('selection consumes the completing click even when journal capture immediately stops inspection', async () => {
  const h = await createHarness();
  const emit = h.context.WaypointEvents.emit;
  h.context.WaypointEvents.emit = (name, payload) => {
    emit(name, payload);
    if (name === 'inspection:elementClicked') h.context.WaypointInspectionMode.stop();
  };
  const target = h.window.document.querySelector('#button');
  const event = type => {
    const e = new h.window.Event(type, { cancelable: true });
    Object.defineProperty(e, 'target', { value: target });
    e.composedPath = () => [target, h.window.document];
    return e;
  };
  h.documentListeners.get('pointerdown')(event('pointerdown'));
  assert.equal(h.context.WaypointInspectionMode.isActive(), false);
  const click = event('click');
  h.documentListeners.get('click')(click);
  assert.equal(click.defaultPrevented, true, 'link navigation and page click handlers must be suppressed');
});

function dispatch(window, target, type, properties = {}) {
  const event = new window.Event(type, { bubbles: true, cancelable: true, composed: true });
  for (const [key, value] of Object.entries(properties)) {
    Object.defineProperty(event, key, { configurable: true, value });
  }
  target.dispatchEvent(event);
  return event;
}

test('inspection arrows resize the highlighted target and click confirms the adjusted element', async () => {
  const { emitted, root, window } = await createHarness();
  const leaf = window.document.querySelector('#leaf');
  const button = window.document.querySelector('#button');
  const highlight = root.querySelector('.waypoint-highlight');

  dispatch(window, leaf, 'mouseover');
  assert.equal(highlight.style.width, '50px');

  const wider = dispatch(window, window.document, 'keydown', { key: 'ArrowRight' });
  assert.equal(wider.defaultPrevented, true);
  assert.equal(highlight.style.width, '90px');

  dispatch(window, window.document, 'keydown', { key: 'ArrowLeft' });
  assert.equal(highlight.style.width, '50px');

  dispatch(window, window.document, 'keydown', { key: 'ArrowRight' });
  dispatch(window, leaf, 'pointerdown', { clientX: 50, clientY: 40 });
  const selection = emitted.find(event => event.name === 'inspection:elementClicked');
  assert.equal(selection.payload.element, button);
});

test('Enter selects the hovered scope without activating its page action', async () => {
  const { documentListeners, emitted, window } = await createHarness();
  const leaf = window.document.querySelector('#leaf');
  dispatch(window, leaf, 'mouseover');
  dispatch(window, window.document, 'keydown', { key: 'ArrowRight' });
  const event = new window.Event('keydown', { cancelable: true });
  Object.defineProperty(event, 'key', { value: 'Enter' });
  event.composedPath = () => [leaf, window.document];
  documentListeners.get('keydown')(event);
  assert.equal(event.defaultPrevented, true);
  const selection = emitted.find(item => item.name === 'inspection:elementClicked');
  assert.equal(selection.payload.element, window.document.querySelector('#button'));
  assert.equal(selection.payload.clientX, 77);
  assert.equal(selection.payload.clientY, 42);
});

test('inspection arrows work while the toolbar inspect button retains focus', async () => {
  const { documentListeners, inspectButton, root, window } = await createHarness();
  const leaf = window.document.querySelector('#leaf');
  const highlight = root.querySelector('.waypoint-highlight');

  dispatch(window, leaf, 'mouseover');
  inspectButton.focus();
  documentListeners.get('keydown')({
    key: 'ArrowRight',
    composedPath: () => [inspectButton, root, root.host, window.document],
    preventDefault() {},
    stopPropagation() {},
  });

  assert.equal(highlight.style.width, '90px');
});

test('mouse controls resize the target without exposing DOM hierarchy', async () => {
  const { root, window } = await createHarness();
  const leaf = window.document.querySelector('#leaf');
  const highlight = root.querySelector('.waypoint-highlight');
  const controls = root.querySelector('.waypoint-scope-controls');
  const smaller = controls.querySelector('[data-scope="smaller"]');
  const larger = controls.querySelector('[data-scope="larger"]');

  assert.equal(controls.style.display, 'none');
  dispatch(window, leaf, 'mouseover');
  assert.equal(controls.style.display, 'flex');
  assert.equal(smaller.disabled, true);
  assert.equal(larger.disabled, false);

  larger.click();
  assert.equal(highlight.style.width, '90px');
  assert.equal(smaller.disabled, false);
});

test('the visibility preference hides mouse controls without disabling keyboard targeting', async () => {
  const { handlers, root, window } = await createHarness();
  const leaf = window.document.querySelector('#leaf');
  const highlight = root.querySelector('.waypoint-highlight');

  dispatch(window, leaf, 'mouseover');
  handlers.get('inspection:scopeControlsVisibility')({ visible: false });
  assert.equal(root.querySelector('.waypoint-scope-controls').style.display, 'none');

  dispatch(window, window.document, 'keydown', { key: 'ArrowRight' });
  assert.equal(highlight.style.width, '90px');
});

test('moving to another element resets the target scope to that exact element', async () => {
  const { root, window } = await createHarness();
  const leaf = window.document.querySelector('#leaf');
  const outer = window.document.querySelector('#outer');
  const highlight = root.querySelector('.waypoint-highlight');

  dispatch(window, leaf, 'mouseover');
  dispatch(window, window.document, 'keydown', { key: 'ArrowRight' });
  assert.equal(highlight.style.width, '90px');

  dispatch(window, outer, 'mouseover');
  assert.equal(highlight.style.width, '180px');
  assert.equal(root.querySelector('[data-scope="smaller"]').disabled, true);
});
