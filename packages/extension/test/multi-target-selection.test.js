import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

async function setup() {
  const { window } = parseHTML('<div id="root"></div><main></main>');
  const handlers = new Map();
  const emitted = [];
  const context = vm.createContext({
    window,
    document: window.document,
    console,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
  });
  context.globalThis = context;
  context.window.location = new URL('http://localhost:3000/app');
  context.WaypointEvents = {
    on(name, handler) { handlers.set(name, handler); },
    emit(name, payload) { emitted.push({ name, payload }); },
  };
  context.WaypointShadowHost = { getRoot: () => context.document.querySelector('#root') };
  context.WaypointElementContext = {
    generate: async element => ({
      selector: `#${element.id}`,
      tag: element.tagName.toLowerCase(),
      position: { width: 40, height: 20 },
      viewport: { width: 1280, height: 720 },
      screenshot: { data_url: `data:image/png;base64,${element.id}` },
    }),
  };
  let reEnableCount = 0;
  context.WaypointInspectionMode = { reEnable() { reEnableCount += 1; } };

  const source = await readFile(new URL('../public/content/modules/multi-target-selection.js', import.meta.url), 'utf8');
  vm.runInContext(source, context, { filename: 'multi-target-selection.js' });
  context.WaypointMultiTargetSelection.init();
  return { context, emitted, handlers, window, getReEnableCount: () => reEnableCount };
}

test('Shift starts persistent ordered Target selection and ordinary clicks toggle membership', async () => {
  const { context, emitted, handlers, window } = await setup();
  const first = window.document.createElement('button');
  first.id = 'first';
  const second = window.document.createElement('button');
  second.id = 'second';
  window.document.querySelector('main').append(first, second);

  await handlers.get('inspection:elementClicked')({ element: first, clientX: 20, clientY: 30, shiftKey: true });
  await handlers.get('inspection:elementClicked')({ element: second, clientX: 60, clientY: 30, shiftKey: false });

  assert.equal(context.WaypointMultiTargetSelection.isActive(), true);
  assert.equal(window.document.querySelector('.waypoint-target-selection-tray').style.pointerEvents, 'auto');
  assert.equal(window.document.querySelector('.waypoint-target-selection-count').textContent, '2 Targets');
  assert.deepEqual(
    [...window.document.querySelectorAll('.waypoint-target-selection-pin')].map(pin => pin.textContent),
    ['a', 'b'],
  );

  await handlers.get('inspection:elementClicked')({ element: first, clientX: 20, clientY: 30, shiftKey: false });
  assert.equal(window.document.querySelector('.waypoint-target-selection-count').textContent, '1 Target');
  assert.equal(window.document.querySelector('.waypoint-target-selection-annotate').disabled, true);

  await handlers.get('inspection:elementClicked')({ element: first, clientX: 20, clientY: 30, shiftKey: false });
  window.document.querySelector('.waypoint-target-selection-annotate').click();
  const compose = emitted.find(event => event.name === 'multi-target:compose');
  assert.deepEqual(
    JSON.parse(JSON.stringify(compose.payload.selections.map(selection => selection.context.selector))),
    ['#second', '#first'],
  );
});

test('selection keeps eight Targets and explains a ninth click', async () => {
  const { context, handlers, window } = await setup();
  const main = window.document.querySelector('main');
  const elements = Array.from({ length: 9 }, (_, index) => {
    const element = window.document.createElement('div');
    element.id = `target-${index}`;
    main.appendChild(element);
    return element;
  });

  for (const [index, element] of elements.entries()) {
    await handlers.get('inspection:elementClicked')({ element, clientX: index * 10, clientY: 30, shiftKey: index === 0 });
  }

  assert.equal(context.WaypointMultiTargetSelection.getSelections().length, 8);
  assert.match(window.document.querySelector('.waypoint-target-selection-message').textContent, /Up to 8 Targets/);
});

test('closing inspection confirms before discarding a preserved composer draft', async () => {
  const { context, getReEnableCount, handlers, window } = await setup();
  const first = window.document.createElement('button');
  first.id = 'first';
  const second = window.document.createElement('button');
  second.id = 'second';
  window.document.querySelector('main').append(first, second);

  await handlers.get('inspection:elementClicked')({ element: first, shiftKey: true });
  await handlers.get('inspection:elementClicked')({ element: second });
  handlers.get('multi-target:edit-selection')({ comment: 'Keep this draft' });
  window.confirm = () => false;

  handlers.get('inspection:stopped')();

  assert.equal(context.WaypointMultiTargetSelection.isActive(), true);
  assert.equal(getReEnableCount(), 2);

  window.confirm = () => true;
  handlers.get('inspection:stopped')();
  assert.equal(context.WaypointMultiTargetSelection.isActive(), false);
});

test('a route change cannot add a Target from a different page URL', async () => {
  const { context, handlers, window } = await setup();
  const first = window.document.createElement('button');
  first.id = 'first';
  const second = window.document.createElement('button');
  second.id = 'second';
  window.document.querySelector('main').append(first, second);

  await handlers.get('inspection:elementClicked')({ element: first, shiftKey: true });
  context.WaypointMultiTargetSelection.handleRouteChange('http://localhost:3000/other');
  await handlers.get('inspection:elementClicked')({ element: second });

  assert.equal(context.WaypointMultiTargetSelection.getSelections().length, 0);
  assert.equal(context.WaypointMultiTargetSelection.isActive(), false);
});
