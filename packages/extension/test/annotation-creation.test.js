import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function loadScript(context, relativePath) {
  const source = await readFile(new URL(`../.output/chrome-mv3/${relativePath}`, import.meta.url), 'utf8');
  vm.runInContext(source, context, { filename: relativePath });
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
      attachments: [{ mime_type: 'text/plain', size_bytes: 2, data_url: 'data:text/plain;base64,b2s=' }],
    }),
    /Unsupported image attachment type/,
  );
  await assert.rejects(
    context.WaypointAPI.saveAnnotation({
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
  assert.match(source, /for \(const annotation of annotations\) \{\s*this\.validateAnnotationAttachments\(annotation\);\s*\}/s);
  assert.match(source, /WaypointAnnotationValidation\.assertAll\(newAnnotations\)/);
  assert.match(source, /WaypointAnnotationValidation\.assertAll\(annotations\)/);
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

test('ordinary annotation comments do not create a Variant request without structured intent', async () => {
  const source = await readFile(new URL('../.output/chrome-mv3/content/modules/annotation-popover.js', import.meta.url), 'utf8');

  assert.match(source, /function getExplicitVariantIntent\(input\)/);
  assert.match(source, /input\?\.checked === true/);
  assert.match(source, /annotation\.variant_intent = variantIntent/);
  assert.doesNotMatch(source, /comment\.match\([^\n]*(variant|variants)/i);
});
