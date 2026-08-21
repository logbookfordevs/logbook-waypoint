import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const wxtPackage = await realpath(new URL('../node_modules/wxt/package.json', import.meta.url));
const requireFromWxt = createRequire(wxtPackage);
const { parseHTML } = requireFromWxt('linkedom');

async function loadScript(context, relativePath) {
  if (relativePath === 'content/modules/api-bridge.js' && !context.WaypointAnnotationStatus) {
    await loadScript(context, 'annotation-status.js');
    await loadScript(context, 'annotation-collection.js');
  }
  if (relativePath === 'content/modules/api-bridge.js' && !context.WaypointDesignIntent) {
    await loadScript(context, 'design-intent.js');
  }
  if (relativePath === 'content/modules/api-bridge.js' && !context.WaypointAnnotationValidation) {
    await loadScript(context, 'annotation-validation.js');
  }
  if (relativePath === 'annotation-validation.js' && !context.WaypointDesignIntent) {
    await loadScript(context, 'design-intent.js');
  }
  if (relativePath === 'annotation-validation.js' && !context.WaypointVariantIntent) {
    await loadScript(context, 'variant-intent.js');
  }
  const source = await readFile(new URL(`../.output/chrome-mv3/${relativePath}`, import.meta.url), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
}

function createEditorTestContext(markup, { width = 1280, emit = () => {} } = {}) {
  const { window } = parseHTML(markup);
  const handlers = new Map();
  const computedStyle = new Proxy({ display: 'block' }, { get: (styles, key) => styles[key] ?? '' });
  const context = vm.createContext({
    window,
    document: window.document,
    navigator: { platform: 'MacIntel' },
    Node: window.Node,
    URL,
    console,
    requestAnimationFrame: () => 1,
    cancelAnimationFrame() {},
    getComputedStyle: () => computedStyle,
  });
  context.globalThis = context;
  context.window.innerWidth = width;
  context.window.innerHeight = 800;
  context.window.location = new URL('http://localhost:3000/app');
  context.window.getComputedStyle = () => computedStyle;
  context.window.HTMLTextAreaElement.prototype.select = function select() {};
  context.WaypointEvents = {
    on(name, handler) { handlers.set(name, handler); },
    emit,
  };
  context.WaypointShadowHost = { getRoot: () => context.document.querySelector('#root') };
  context.WaypointInspectionMode = { tempDisable() {}, reEnable() {} };
  context.WaypointVariantPicker = {
    handles: () => false,
    locksPresentation: () => false,
    buildAnnotationUpdates: (_annotation, comment, pendingChanges, css) => ({
      comment,
      pending_changes: pendingChanges,
      css,
    }),
  };
  context.WaypointAnnotationId = { create: () => 'waypoint_1750000000000_abc123xyz' };

  return { context, handlers, computedStyle, window };
}

test('content can request the current site permission through the background boundary', async () => {
  const messages = [];
  const context = vm.createContext({
    window: { location: { protocol: 'https:', origin: 'https://example.test' } },
    URL,
    chrome: {
      runtime: {
        sendMessage: async message => {
          messages.push(message);
          return { success: true, granted: true };
        },
      },
    },
  });
  context.globalThis = context;

  await loadScript(context, 'content/modules/api-bridge.js');

  assert.equal(await context.WaypointAPI.requestOptionalSitePermission(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(messages)), [{
    action: 'requestOptionalSitePermission',
    originPattern: 'https://example.test/*',
  }]);
});

test('Design Actions visibility defaults on and persists through the extension preference boundary', async () => {
  const writes = [];
  let stored = {};
  const context = vm.createContext({
    window: { location: { protocol: 'https:' } },
    chrome: {
      runtime: { sendMessage: async () => ({ success: true }) },
      storage: {
        local: {
          get: async () => stored,
          set: async update => {
            stored = { ...stored, ...update };
            writes.push(update);
          },
        },
      },
    },
  });
  context.globalThis = context;
  await loadScript(context, 'content/modules/api-bridge.js');

  assert.equal(await context.WaypointAPI.getShowDesignActions(), true);
  await context.WaypointAPI.saveShowDesignActions(false);
  assert.equal(await context.WaypointAPI.getShowDesignActions(), false);
  assert.deepEqual(JSON.parse(JSON.stringify(writes)), [{ waypointShowDesignActions: false }]);
});

test('content rejects non-image or oversized attachment payloads before they reach the background', async () => {
  const messages = [];
  const context = vm.createContext({
    window: { location: { protocol: 'https:' } },
    chrome: {
      runtime: { sendMessage: async message => { messages.push(message); return { success: true }; } },
    },
  });
  context.globalThis = context;
  await loadScript(context, 'content/modules/api-bridge.js');

  await assert.rejects(
    context.WaypointAPI.saveAnnotation({
      status: 'pending',
      attachments: [{ mime_type: 'text/plain', size_bytes: 2, data_url: 'data:text/plain;base64,b2s=' }],
    }),
    /Unsupported image attachment type/,
  );
  await assert.rejects(
    context.WaypointAPI.saveAnnotation({
      status: 'pending',
      attachments: [{ mime_type: 'image/png', size_bytes: 1_048_577, data_url: 'data:image/png;base64,AAAA' }],
    }),
    /1 MB limit/,
  );
  assert.equal(messages.length, 0);
});

test('background validates attachment payloads before forwarding an annotation to loopback', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/background/background.js', import.meta.url), 'utf8');

  assert.match(source, /case 'requestOptionalSitePermission'/);
  assert.match(source, /requestOptionalSitePermission\(originPattern/);
  assert.match(source, /chrome\.permissions\.request\(\{ origins: \[originPattern\] \}\)/);
  assert.match(source, /validateAnnotationAttachments\(annotation\)/);
  assert.match(source, /apiServerUrl}\/api\/annotations/);
  assert.ok(
    source.indexOf("'annotation-id.js'") < source.indexOf("'agent-setup-config.js'"),
    'dynamic site registration must load canonical Annotation IDs before callers',
  );
});

test('background only reports site enablement after injection registration and validates imports before storage or sync', async () => {
  const source = await readFile(new URL('../public/background/background.js', import.meta.url), 'utf8');

  assert.match(source, /await chrome\.scripting\.registerContentScripts/);
  assert.match(source, /Failed to register content scripts:', err\);\s*throw err/s);
  assert.match(source, /return JSON\.stringify\(WaypointExportCodec\.createExportEnvelope\(annotations\), null, 2\)/);
  assert.match(source, /case 'mcp':\s*return WaypointExportCodec\.createExportEnvelope\(annotations\)/s);
  assert.ok(
    source.indexOf("'export-codec.js'") < source.indexOf("'content/modules/floating-toolbar.js'"),
    'dynamic site registration must load the export codec before callers',
  );
  assert.ok(
    source.indexOf('await chrome.scripting.registerContentScripts') < source.indexOf('if (tabId)'),
    'reload must occur only after content-script registration succeeds',
  );
  assert.match(source, /for \(const annotation of normalized\) \{\s*this\.validateAnnotationAttachments\(annotation\);\s*\}/s);
  assert.match(source, /WaypointAnnotationValidation\.assertAll\(newAnnotations\)/);
  assert.match(source, /WaypointAnnotationValidation\.assertAll\(normalized\)/);
  assert.ok(
    source.indexOf('this.validateAnnotationAttachments(a);') < source.indexOf('all.push(a);'),
    'imports must validate media before persisting locally',
  );
});

test('shared extension validation rejects URL-less and empty imported Annotations', async () => {
  const context = vm.createContext({ URL });
  context.globalThis = context;
  await loadScript(context, 'annotation-id.js');
  await loadScript(context, 'annotation-validation.js');

  assert.throws(() => context.WaypointAnnotationValidation.assertAnnotation({
    id: 'waypoint_1750000000000_abc123xyz',
    comment: 'Missing URL',
  }), /URL is required/);
  assert.throws(() => context.WaypointAnnotationValidation.assertAnnotation({
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app',
    comment: '   ',
    pending_changes: {},
    attachments: [],
  }), /must include/);
  assert.doesNotThrow(() => context.WaypointAnnotationValidation.assertAnnotation({
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app?tab=open#feedback',
    comment: '',
    pending_changes: { color: { value: '#201a16' } },
  }));
  assert.throws(() => context.WaypointAnnotationValidation.assertAnnotation({
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app',
    comment: 'Malformed intent',
    design_intent: { schema_version: 1, workflow: 'other', action: null },
  }), /Design Intent workflow/);
});

test('annotation popover only permits a commentless save with a visual edit or validated image attachment', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/annotation-popover.js', import.meta.url), 'utf8');

  assert.match(source, /function hasMeaningfulAnnotationContent\(comment, pendingChanges, css, attachments\)/);
  assert.match(source, /Object\.keys\(pendingChanges\)\.length > 0/);
  assert.match(source, /attachments\.length > 0/);
  assert.match(source, /saveBtn\.disabled = !hasMeaningfulAnnotationContent/);
  assert.match(source, /annotation\.attachments = attachments/);
});

test('popover image attachment validation is image-only and caps the encoded payload', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/annotation-popover.js', import.meta.url), 'utf8');

  assert.match(source, /const MAX_IMAGE_ATTACHMENT_BYTES = 1024 \* 1024/);
  assert.match(source, /IMAGE_MIME_TYPES\.has\(file\.type\)/);
  assert.match(source, /file\.size > MAX_IMAGE_ATTACHMENT_BYTES/);
  assert.match(source, /dataUrl\.length > MAX_IMAGE_ATTACHMENT_DATA_URL_LENGTH/);
});

test('annotation popover presents a branded attachment control and restores saved attachment presence', async () => {
  const source = await readFile(new URL('../public/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../public/content/modules/styles.js', import.meta.url), 'utf8');

  assert.match(source, /waypoint-attachment-button-icon/);
  assert.match(source, /Add image/);
  assert.match(source, /attachments\.length \? `\$\{attachments\.length\} image/);
  assert.match(styles, /\.waypoint-image-attachment-input\s*\{[^}]*position:\s*absolute;[^}]*opacity:\s*0/s);
  assert.match(styles, /\.waypoint-attachment-button:focus-within/);
});

test('annotation options group keeps its guided workflow choices compact and accessible', async () => {
  const source = await readFile(new URL('../public/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../public/content/modules/styles.js', import.meta.url), 'utf8');

  assert.match(source, /class="waypoint-annotation-options" role="group" aria-label="Annotation options"/);
  assert.match(source, /class="waypoint-variant-intent-title">Variants</);
  assert.doesNotMatch(source, /waypoint-variant-intent-description/);
  assert.match(source, /3 by default · Ask for 2–6 in your brief\./);
  assert.match(styles, /\.waypoint-annotation-options\s*\{[^}]*display:\s*grid/s);
  assert.match(styles, /\.waypoint-variant-intent-label\s*\{[^}]*min-height:\s*40px/s);
  assert.match(styles, /\.waypoint-variant-intent-title\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /\.waypoint-variant-intent\s*\{[^}]*appearance:\s*none/s);
  assert.match(styles, /\.waypoint-variant-intent:focus-visible/);
  assert.match(styles, /\.waypoint-design-action-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,minmax\(0,1fr\)\)/s);
});

test('rendered Element edits follow the Brief and adapt their drawer to the Target type', async () => {
  const { context, handlers, computedStyle } = createEditorTestContext(
    '<html><body><div id="root"></div><h2 id="text-target">Heading</h2><section id="container-target"></section><button id="mixed-target">Continue</button></body></html>',
  );
  context.WaypointAPI = {
    isFileProtocol: () => false,
    getShowDesignActions: async () => false,
    saveAnnotation: async () => {},
  };
  context.WaypointElementContext = { generate: async element => ({
    selector: `#${element.id}`,
    tag: element.tagName.toLowerCase(),
    classes: [],
    text: element.textContent,
    styles: computedStyle,
    position: { x: 0, y: 0, width: 100, height: 40 },
    viewport: { width: 1280, height: 800 },
  }) };

  const source = await readFile(new URL('../public/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  context.WaypointAnnotationPopover.init();

  const open = async id => {
    const element = context.document.querySelector(`#${id}`);
    element.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40 });
    await handlers.get('inspection:elementClicked')({ element, clientX: 10, clientY: 10 });
    return context.document.querySelector('.waypoint-popover');
  };
  const tabLabels = popover => [...popover.querySelectorAll('.waypoint-tab')].map(tab => tab.textContent.trim());

  const textPopover = await open('text-target');
  const bodyChildren = [...textPopover.querySelector('.waypoint-popover-body').children];
  assert.ok(bodyChildren.indexOf(textPopover.querySelector('.waypoint-input-wrap')) < bodyChildren.indexOf(textPopover.querySelector('.waypoint-element-edits')));
  assert.ok(bodyChildren.indexOf(textPopover.querySelector('.waypoint-element-edits')) < bodyChildren.indexOf(textPopover.querySelector('.waypoint-annotation-options')));
  assert.match(textPopover.querySelector('.waypoint-element-edits-heading').textContent, /Element edits/);
  assert.deepEqual(tabLabels(textPopover), ['Content', 'Typography', 'Dimensions', 'Spacing', 'Advanced CSS']);
  assert.ok([...textPopover.querySelectorAll('.waypoint-tab')].every(tab => tab.querySelector('.waypoint-tab-icon')));
  assert.ok([...textPopover.querySelectorAll('.waypoint-tab')].every(tab => tab.querySelector('.waypoint-tab-label')));
  assert.ok([...textPopover.querySelectorAll('.waypoint-tab')].every(tab => tab.getAttribute('title') === tab.textContent.trim()));
  assert.ok([...textPopover.querySelectorAll('.waypoint-tab')].every(tab => tab.getAttribute('aria-expanded') === 'false'));
  assert.ok([...textPopover.querySelectorAll('.waypoint-tab')].every(tab => {
    const panel = textPopover.querySelector(`#${tab.getAttribute('aria-controls')}`);
    return panel?.getAttribute('aria-labelledby') === tab.id;
  }));

  const typography = textPopover.querySelector('[data-tab="font"]');
  typography.click();
  assert.equal(typography.getAttribute('aria-expanded'), 'true');
  assert.notEqual(textPopover.querySelector('.waypoint-design-toolbar').style.display, 'none');
  typography.click();
  assert.equal(typography.getAttribute('aria-expanded'), 'false');

  const containerPopover = await open('container-target');
  assert.deepEqual(tabLabels(containerPopover), ['Dimensions', 'Spacing', 'Layout', 'Appearance', 'Advanced CSS']);

  const mixedPopover = await open('mixed-target');
  assert.deepEqual(tabLabels(mixedPopover), ['Content', 'Typography', 'Dimensions', 'Spacing', 'Layout', 'Appearance', 'Advanced CSS']);
  assert.equal(mixedPopover.querySelectorAll('.waypoint-tab').length, 7);
  assert.ok(mixedPopover.querySelector('.waypoint-annotation-attachments'));
  assert.ok(mixedPopover.querySelector('.waypoint-variant-intent-label'));
});

test('reopened Annotations mark Element edit categories that contain saved changes', async () => {
  const { context, handlers, computedStyle } = createEditorTestContext(
    '<html><body><div id="root"></div><button id="target">Continue</button></body></html>',
  );
  context.WaypointAPI = {
    isFileProtocol: () => false,
    getShowDesignActions: async () => false,
    updateAnnotation: async () => {},
  };
  context.WaypointElementContext = { generate: async () => ({
    selector: '#target',
    tag: 'button',
    classes: [],
    text: 'Continue',
    styles: computedStyle,
    position: { x: 0, y: 0, width: 100, height: 40 },
    viewport: { width: 1280, height: 800 },
  }) };

  const source = await readFile(new URL('../public/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  vm.runInContext(source, context);
  context.WaypointAnnotationPopover.init();

  const target = context.document.querySelector('#target');
  target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40 });
  await handlers.get('annotation:edit')({
    annotation: {
      id: 'waypoint_1750000000000_abc123xyz',
      status: 'pending',
      comment: 'Refine this action',
      pending_changes: {
        copyChange: { original: 'Continue', value: 'Get started' },
        fontWeight: { original: '400', value: '600' },
        width: { original: '100px', value: '140px' },
        marginTop: { original: '0px', value: '12px' },
        backgroundColor: { original: 'transparent', value: '#102c2c' },
      },
      css: '#target:hover { transform: translateY(-1px); }',
    },
    element: target,
  });

  const editedCategories = [...context.document.querySelectorAll('.waypoint-tab[data-saved-changes="true"]')]
    .map(tab => tab.dataset.tab);
  assert.deepEqual(editedCategories, ['content', 'font', 'sizing', 'spacing', 'appearance', 'raw-css']);
  assert.ok([...context.document.querySelectorAll('.waypoint-tab[data-saved-changes="true"]')]
    .every(tab => tab.querySelector('.waypoint-tab-saved-dot')));
  assert.match(context.document.querySelector('[data-tab="spacing"]').getAttribute('aria-label'), /saved changes/i);

  await handlers.get('annotation:edit')({
    annotation: {
      id: 'waypoint_1750000000001_def456uvw',
      status: 'pending',
      comment: 'Comment only',
      pending_changes: {},
      css: null,
    },
    element: target,
  });
  assert.equal(context.document.querySelectorAll('.waypoint-tab[data-saved-changes="true"]').length, 0);
});

test('sizing and spacing labels scrub adjacent numeric values through the public input event seam', async () => {
  const source = await readFile(new URL('../public/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../public/content/modules/styles.js', import.meta.url), 'utf8');

  assert.match(source, /data-scrub-target="width"/);
  assert.match(source, /data-scrub-target="paddingVertical"/);
  assert.match(source, /data-scrub-target="paddingTop"/);
  assert.match(source, /data-scrub-target="marginHorizontal"/);
  assert.match(source, /data-scrub-target="marginLeft"/);
  assert.match(source, /wireScrubbableSizingLabels\(popover\)/);
  assert.match(source, /new Event\('input', \{ bubbles: true \}\)/);
  assert.match(styles, /\.waypoint-scrubbable-label\s*\{[^}]*cursor:\s*ew-resize/s);
});

test('automatic screenshot capture renders the browser viewport before cropping the Target', async () => {
  const capture = await readFile(new URL('../public/content/modules/screenshot-capture.js', import.meta.url), 'utf8');
  const context = await readFile(new URL('../public/content/modules/element-context.js', import.meta.url), 'utf8');
  const background = await readFile(new URL('../public/background/background.js', import.meta.url), 'utf8');

  assert.match(capture, /captureVisibleTabScreenshot/);
  assert.match(capture, /drawImage\(\s*image/s);
  assert.match(capture, /await image\.decode\(\)/);
  assert.match(context, /await WaypointScreenshotCapture\.capture\(element\)/);
  assert.doesNotMatch(context, /function captureElementScreenshot/);
  assert.match(background, /chrome\.tabs\.captureVisibleTab/);

  const drawCalls = [];
  class FakeImage {
    naturalWidth = 200;
    naturalHeight = 100;
    async decode() {}
  }
  const runtime = vm.createContext({
    window: { innerWidth: 100, innerHeight: 50 },
    Image: FakeImage,
    chrome: { runtime: { sendMessage: async () => ({ success: true, dataUrl: 'data:image/png;base64,viewport' }) } },
    document: {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: () => ({
          drawImage: (...args) => drawCalls.push(args),
          strokeRect() {},
        }),
        toDataURL: () => 'data:image/webp;base64,crop',
      }),
    },
    Date,
  });
  vm.runInContext(capture, runtime);
  const result = await runtime.WaypointScreenshotCapture.capture({
    getBoundingClientRect: () => ({ left: 10, top: 5, width: 20, height: 10 }),
  });
  assert.equal(drawCalls.length, 1);
  assert.equal(drawCalls[0][0] instanceof FakeImage, true);
  assert.equal(result.data_url, 'data:image/webp;base64,crop');
});

test('ordinary annotation comments do not create a Variant request without structured intent', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/annotation-popover.js', import.meta.url), 'utf8');

  assert.match(source, /function getExplicitVariantIntent\(input\)/);
  assert.match(source, /input\?\.checked === true/);
  assert.match(source, /annotation\.variant_intent = variantIntent/);
  assert.doesNotMatch(source, /comment\.match\([^\n]*(variant|variants)/i);
});

test('rendered editor serializes and restores Design Intent and Variant Intent independently', async () => {
  const emitted = [];
  const saved = [];
  const updated = [];
  const dismissed = [];
  let showDesignActions = true;
  const { context, handlers, computedStyle, window } = createEditorTestContext(
    '<html><body><div id="root"></div><button id="target">Target</button></body></html>',
    { emit: (name, payload) => emitted.push({ name, payload }) },
  );
  context.WaypointAPI = {
    isFileProtocol: () => false,
    getShowDesignActions: async () => showDesignActions,
    saveAnnotation: async annotation => { saved.push(annotation); },
    updateAnnotation: async (annotationId, updates) => { updated.push({ annotationId, updates }); },
    dismissWorkNotice: async annotationId => { dismissed.push(annotationId); },
  };

  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  const designIntentSource = await readFile(new URL('../.output/chrome-mv3/design-intent.js', import.meta.url), 'utf8');
  vm.runInContext(designIntentSource, context);
  vm.runInContext(source, context);
  context.WaypointAnnotationPopover.init();

  const target = context.document.querySelector('#target');
  target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40 });
  const targetContext = {
    selector: '#target',
    tag: 'button',
    classes: [],
    text: 'Target',
    styles: computedStyle,
    position: { x: 0, y: 0, width: 100, height: 40 },
    viewport: { width: 1280, height: 800 },
  };
  context.WaypointElementContext = { generate: async () => targetContext };

  await handlers.get('inspection:elementClicked')({ element: target, clientX: 10, clientY: 10 });
  const agentDirection = context.document.querySelector('.waypoint-agent-direction');
  const agentDirectionChoices = agentDirection.querySelector('.waypoint-agent-direction-choices');
  assert.match(agentDirection.querySelector('.waypoint-agent-direction-heading').textContent, /Agent direction/);
  assert.equal(agentDirectionChoices.children.length, 2);
  assert.ok(agentDirectionChoices.querySelector('.waypoint-variant-intent-label'));
  assert.ok(agentDirectionChoices.querySelector('.waypoint-design-intent-label'));
  assert.deepEqual(
    [...agentDirectionChoices.querySelectorAll('.waypoint-variant-intent-title')].map(element => element.textContent.trim()),
    ['Variants', 'Design Actions'],
  );
  assert.equal(agentDirectionChoices.querySelector('.waypoint-variant-intent-description'), null);
  assert.equal(agentDirection.querySelector('.waypoint-variant-intent-note').hidden, true);
  assert.equal(agentDirection.querySelector('.waypoint-design-action-catalog').hidden, true);
  const createToggle = context.document.querySelector('.waypoint-design-intent');
  const createVariantToggle = context.document.querySelector('.waypoint-variant-intent:not(.waypoint-design-intent)');
  assert.equal(createToggle.hasAttribute('checked'), false);
  assert.equal(createVariantToggle.hasAttribute('checked'), false);
  createToggle.checked = false;
  context.document.querySelector('.waypoint-textarea').value = 'Make the hierarchy feel intentional';
  context.document.querySelector('.waypoint-textarea').dispatchEvent(new window.Event('input'));
  createToggle.checked = true;
  createToggle.dispatchEvent(new window.Event('change'));
  createVariantToggle.checked = true;
  createVariantToggle.dispatchEvent(new window.Event('change'));
  assert.equal(agentDirection.querySelector('.waypoint-design-action-catalog').hidden, false);
  assert.equal(agentDirection.querySelector('.waypoint-variant-intent-note').hidden, false);
  context.document.querySelector('.waypoint-save-btn').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(JSON.parse(JSON.stringify(saved[0].design_intent)), {
    schema_version: 1,
    workflow: 'impeccable',
    action: null,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(saved[0].variant_intent)), {
    requested: true,
    default_count: 3,
  });
  assert.equal(saved[0].comment, 'Make the hierarchy feel intentional');

  await handlers.get('annotation:edit')({
    annotation: {
      ...saved[0],
      work_notice: {
        code: 'workflow_unavailable',
        summary: 'Install Impeccable, then claim this Annotation again.',
        created_at: '2026-08-19T12:00:00.000Z',
      },
    },
    element: target,
  });
  const notice = context.document.querySelector('.waypoint-work-notice');
  assert.match(notice.textContent, /Design workflow unavailable/);
  assert.match(notice.textContent, /Install Impeccable, then claim this Annotation again/);
  notice.querySelector('.waypoint-work-notice-dismiss').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(dismissed, ['waypoint_1750000000000_abc123xyz']);
  assert.equal(context.document.querySelector('.waypoint-work-notice'), null);

  await handlers.get('annotation:edit')({
    annotation: {
      ...saved[0],
      status: 'claimed',
      claim: {
        owner: 'agent-one',
        refreshed_at: '2026-08-19T12:00:00.000Z',
        expires_at: '2026-08-19T12:05:00.000Z',
      },
    },
    element: target,
  });
  assert.equal(context.document.querySelector('.waypoint-textarea').disabled, true);
  assert.equal(context.document.querySelector('.waypoint-design-intent').disabled, true);
  assert.ok([...context.document.querySelectorAll('.waypoint-design-action')].every(button => button.disabled));
  assert.equal(context.document.querySelector('.waypoint-save-btn').disabled, true);

  showDesignActions = false;
  await handlers.get('inspection:elementClicked')({ element: target, clientX: 10, clientY: 10 });
  assert.equal(Boolean(context.document.querySelector('.waypoint-design-intent-label')), false);
  context.document.querySelector('.waypoint-cancel-btn').click();

  const ordinaryExistingAnnotation = { ...saved[0] };
  delete ordinaryExistingAnnotation.design_intent;
  await handlers.get('annotation:edit')({ annotation: ordinaryExistingAnnotation, element: target });
  assert.equal(Boolean(context.document.querySelector('.waypoint-design-intent-label')), false);
  assert.equal(context.document.querySelector('.waypoint-save-btn').disabled, true);
  const ordinaryVariantToggle = context.document.querySelector('.waypoint-variant-intent');
  ordinaryVariantToggle.checked = false;
  ordinaryVariantToggle.dispatchEvent(new window.Event('change'));
  assert.equal(context.document.querySelector('.waypoint-save-btn').disabled, false);
  context.document.querySelector('.waypoint-cancel-btn').click();

  await handlers.get('annotation:edit')({ annotation: saved[0], element: target });
  const editToggle = context.document.querySelector('.waypoint-design-intent');
  assert.match(context.document.querySelector('.waypoint-design-intent-row').textContent, /Requires Impeccable/);
  const editVariantToggle = context.document.querySelector('.waypoint-variant-intent:not(.waypoint-design-intent)');
  assert.equal(editToggle.hasAttribute('checked'), true);
  assert.equal(editVariantToggle.hasAttribute('checked'), true);
  editToggle.checked = true;
  editVariantToggle.checked = true;
  context.document.querySelector('.waypoint-textarea').value = 'Keep the hierarchy quiet and intentional';
  context.document.querySelector('.waypoint-textarea').dispatchEvent(new window.Event('input'));
  context.document.querySelector('.waypoint-save-btn').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(JSON.parse(JSON.stringify(updated[0].updates.design_intent)), {
    schema_version: 1,
    workflow: 'impeccable',
    action: null,
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(emitted.find(event => event.name === 'annotation:updated').payload.design_intent)),
    JSON.parse(JSON.stringify(updated[0].updates.design_intent)),
  );
  assert.deepEqual(JSON.parse(JSON.stringify(updated[0].updates.variant_intent)), {
    requested: true,
    default_count: 3,
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(emitted.find(event => event.name === 'annotation:updated').payload.variant_intent)),
    JSON.parse(JSON.stringify(updated[0].updates.variant_intent)),
  );

  await handlers.get('annotation:edit')({ annotation: saved[0], element: target });
  const removeToggle = context.document.querySelector('.waypoint-design-intent');
  const removeVariantToggle = context.document.querySelector('.waypoint-variant-intent:not(.waypoint-design-intent)');
  removeToggle.checked = false;
  removeToggle.dispatchEvent(new window.Event('change'));
  removeVariantToggle.checked = false;
  removeVariantToggle.dispatchEvent(new window.Event('change'));
  context.document.querySelector('.waypoint-save-btn').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updated[1].updates.design_intent, null);
  assert.equal(updated[1].updates.variant_intent, null);

  await handlers.get('annotation:edit')({
    annotation: {
      ...saved[0],
      pending_changes: {
        marginTop: { original: '12px', value: '144px' },
      },
    },
    element: target,
  });
  const marginTopInput = context.document.querySelector('[data-prop="marginTop"]');
  assert.equal(marginTopInput.value, '144');
  context.document.querySelector('.waypoint-design-reset').click();
  assert.equal(target.style.marginTop, '');
  assert.equal(marginTopInput.value, '12');
  context.document.querySelector('.waypoint-cancel-btn').click();

  await handlers.get('annotation:edit')({
    annotation: {
      ...saved[0],
      status: 'resolved',
      resolution_record: {
        summary: 'Clarified the heading hierarchy and supporting copy.',
        verification: ['Focused lifecycle tests pass', 'Reviewed at 390px'],
      },
    },
    element: target,
  });
  const resolvedPopover = context.document.querySelector('.waypoint-popover');
  assert.match(resolvedPopover.querySelector('.waypoint-resolution-summary').textContent, /Clarified the heading hierarchy/);
  assert.deepEqual(
    [...resolvedPopover.querySelectorAll('.waypoint-resolution-verification li')].map(item => item.textContent),
    ['Focused lifecycle tests pass', 'Reviewed at 390px'],
  );
  assert.match(resolvedPopover.querySelector('.waypoint-popover-title').textContent, /Viewing resolved annotation/);
  assert.match(resolvedPopover.querySelector('.waypoint-readonly-notice').textContent, /Read-only history/);
  assert.match(resolvedPopover.querySelector('.waypoint-readonly-notice').textContent, /resolved and can no longer be edited/);
  assert.equal(resolvedPopover.querySelector('.waypoint-textarea').disabled, false);
  assert.equal(resolvedPopover.querySelector('.waypoint-textarea').hasAttribute('readonly'), true);
  assert.equal(resolvedPopover.querySelector('.waypoint-design-intent').disabled, true);
  assert.equal(resolvedPopover.querySelector('.waypoint-tab').disabled, false);
  assert.equal(resolvedPopover.querySelector('.waypoint-save-btn'), null);
  assert.equal(resolvedPopover.querySelector('.waypoint-cancel-btn').textContent, 'Close');

  await handlers.get('annotation:edit')({
    annotation: { ...saved[0], status: 'discarded' },
    element: target,
  });
  const discardedPopover = context.document.querySelector('.waypoint-popover');
  assert.match(discardedPopover.querySelector('.waypoint-popover-title').textContent, /Viewing discarded annotation/);
  assert.match(discardedPopover.querySelector('.waypoint-readonly-notice').textContent, /discarded and can no longer be edited/);
  discardedPopover.querySelector('.waypoint-tab').click();
  assert.notEqual(discardedPopover.querySelector('.waypoint-design-toolbar').style.display, 'none');
  assert.equal(discardedPopover.querySelector('.waypoint-textarea').hasAttribute('readonly'), true);
  assert.equal(discardedPopover.querySelector('.waypoint-save-btn'), null);
});

test('rendered editor selects one named Design Action, explains it, and returns to Freeform', async () => {
  const saved = [];
  const { context, handlers, computedStyle, window } = createEditorTestContext(
    '<html><body><div id="root"></div><button id="target">Target</button></body></html>',
    { width: 390 },
  );
  context.WaypointAPI = {
    isFileProtocol: () => false,
    getShowDesignActions: async () => true,
    saveAnnotation: async annotation => { saved.push(annotation); },
  };

  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/annotation-popover.js', import.meta.url), 'utf8');
  const designIntentSource = await readFile(new URL('../.output/chrome-mv3/design-intent.js', import.meta.url), 'utf8');
  vm.runInContext(designIntentSource, context);
  vm.runInContext(source, context);
  context.WaypointAnnotationPopover.init();

  const target = context.document.querySelector('#target');
  target.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 40, right: 100, bottom: 40 });
  context.WaypointElementContext = { generate: async () => ({
    selector: '#target',
    tag: 'button',
    classes: [],
    text: 'Target',
    styles: computedStyle,
    position: { x: 0, y: 0, width: 100, height: 40 },
    viewport: { width: 390, height: 800 },
  }) };

  await handlers.get('inspection:elementClicked')({ element: target, clientX: 10, clientY: 10 });
  const toggle = context.document.querySelector('.waypoint-design-intent');
  toggle.checked = true;
  toggle.dispatchEvent(new window.Event('change'));

  const explanations = new Map([
    ['bolder', 'Increase visual impact and confidence.'],
    ['quieter', 'Reduce visual intensity and distraction.'],
    ['distill', 'Remove complexity and keep only what matters.'],
    ['polish', 'Refine hierarchy, spacing, and visual details.'],
    ['typeset', 'Improve typography, scale, and rhythm.'],
    ['colorize', 'Add purposeful color and clearer emphasis.'],
    ['layout', 'Improve structure, spacing, and alignment.'],
    ['animate', 'Add purposeful motion and transitions.'],
    ['delight', 'Add personality through thoughtful details.'],
    ['overdrive', 'Push the design beyond conventional limits.'],
  ]);
  const expectedActions = [...explanations.keys()];
  const buttons = [...context.document.querySelectorAll('.waypoint-design-action')];
  assert.deepEqual(buttons.map(button => button.dataset.action), expectedActions);
  assert.ok(buttons.every(button => button.getAttribute('aria-pressed') === 'false'));
  assert.equal(context.document.querySelector('.waypoint-design-action-state').textContent, 'Design Actions · Freeform');
  assert.equal(context.document.querySelector('.waypoint-design-action-state').getAttribute('aria-live'), 'polite');

  for (const button of buttons) {
    button.click();
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(context.document.querySelector('.waypoint-design-action-description').textContent, explanations.get(button.dataset.action));
    assert.equal(buttons.filter(candidate => candidate.getAttribute('aria-pressed') === 'true').length, 1);
  }

  const polish = context.document.querySelector('[data-action="polish"]');
  if (polish.getAttribute('aria-pressed') !== 'true') polish.click();
  assert.equal(polish.getAttribute('aria-pressed'), 'true');
  assert.equal(context.document.querySelector('.waypoint-design-action-state').textContent, 'Design Action · Polish');
  assert.equal(context.document.querySelector('.waypoint-design-action-description').textContent, 'Refine hierarchy, spacing, and visual details.');
  assert.equal(context.document.querySelector('.waypoint-design-action-description').getAttribute('aria-live'), 'polite');
  assert.ok(buttons.filter(button => button.getAttribute('aria-pressed') === 'true').length === 1);

  context.document.querySelector('.waypoint-textarea').value = 'Keep the existing comment as the brief';
  context.document.querySelector('.waypoint-textarea').dispatchEvent(new window.Event('input'));
  context.document.querySelector('.waypoint-save-btn').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(JSON.parse(JSON.stringify(saved[0].design_intent)), {
    schema_version: 1,
    workflow: 'impeccable',
    action: 'polish',
  });

  await handlers.get('annotation:edit')({ annotation: saved[0], element: target });
  const restoredPolish = context.document.querySelector('[data-action="polish"]');
  assert.equal(restoredPolish.getAttribute('aria-pressed'), 'true');
  restoredPolish.click();
  assert.equal(restoredPolish.getAttribute('aria-pressed'), 'false');
  assert.equal(context.document.querySelector('.waypoint-design-action-state').textContent, 'Design Actions · Freeform');
  assert.equal(context.document.querySelector('.waypoint-design-action-description').textContent, '');
});

test('live Annotation consumers retain Design Intent and Variant Intent after editor updates', async () => {
  const content = await readFile(new URL('../.output/chrome-mv3/content/content.js', import.meta.url), 'utf8');
  const badges = await readFile(new URL('../.output/chrome-mv3/content/modules/badge-manager.js', import.meta.url), 'utf8');

  assert.match(content, /annotation:updated[^]*design_intent[^]*WaypointDesignIntent\.applyUpdate/);
  assert.match(content, /annotation:updated[^]*variant_intent[^]*WaypointDesignIntent\.applyUpdate/);
  assert.match(badges, /function onUpdated\(\{ id, comment, pending_changes, css, design_intent, variant_intent \}\)/);
  assert.match(badges, /entry\.annotation = WaypointDesignIntent\.applyUpdate/);
});
