import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const toolbarUrl = new URL('../public/content/modules/floating-toolbar.js', import.meta.url);
const codecUrl = new URL('../public/export-codec.js', import.meta.url);
const statusUrl = new URL('../public/annotation-status.js', import.meta.url);
const popupUrl = new URL('../public/popup/popup.js', import.meta.url);
const popupHtmlUrl = new URL('../public/popup/popup.html', import.meta.url);
const stylesUrl = new URL('../public/content/modules/styles.js', import.meta.url);

test('toolbar exports status-filtered Markdown without a native sharing branch', async () => {
  const toolbar = await readFile(toolbarUrl, 'utf8');

  assert.match(toolbar, /waypoint-export-status/);
  assert.match(toolbar, /WaypointExportCodec\.filterAnnotationsByStatus/);
  assert.match(toolbar, /WaypointExportCodec\.formatAnnotationsAsMarkdown/);
  assert.doesNotMatch(toolbar, /navigator\.share\(/);
  assert.doesNotMatch(toolbar, /Share Markdown/);
  assert.match(toolbar, /text\/markdown/);
});

test('toolbar uses the portable Waypoint envelope for export and accepts server route groups for import', async () => {
  const [codec, status, toolbar] = await Promise.all([
    readFile(codecUrl, 'utf8'),
    readFile(statusUrl, 'utf8'),
    readFile(toolbarUrl, 'utf8'),
  ]);
  const context = vm.createContext({
    window: { location: new URL('http://localhost:3000/app?tab=open#feedback') },
    navigator: { platform: 'MacIntel' },
    URL,
  });
  context.globalThis = context;
  vm.runInContext(status, context, { filename: 'annotation-status.js' });
  vm.runInContext(codec, context, { filename: 'export-codec.js' });
  vm.runInContext(toolbar, context, { filename: 'floating-toolbar.js' });

  const annotation = {
    id: 'waypoint_1750000000000_abc123xyz',
    url: 'http://localhost:3000/app?tab=open#feedback',
    status: 'pending',
    comment: 'Align heading',
    screenshot: { data_url: 'data:image/png;base64,secret' },
    attachments: [{ id: 'attachment_123', data_url: 'data:image/png;base64,secret' }],
    source_file_path: '/Users/leo/project/src/Button.tsx',
    source_mapping: { file_path_hint: '/Users/leo/project/src/Button.tsx' },
  };
  const exported = context.WaypointToolbar.createExportEnvelope([annotation], {
    scope: 'project',
    status: 'pending',
    exportedAt: '2026-08-11T00:00:00.000Z',
  });

  assert.equal(exported.waypoint_annotations_export, true);
  assert.equal(exported.annotations[0].id, annotation.id);
  assert.equal(exported.annotations[0].status, 'pending');
  assert.equal(exported.annotations[0].url_path, '/app?tab=open#feedback');
  assert.equal(exported.routes[0].route, '/app?tab=open#feedback');
  assert.equal(exported.annotations[0].has_screenshot, true);
  assert.equal(exported.annotations[0].has_attachments, true);
  assert.equal('screenshot' in exported.annotations[0], false);
  assert.equal('attachments' in exported.annotations[0], false);
  assert.equal('source_file_path' in exported.annotations[0], false);
  assert.equal('source_mapping' in exported.annotations[0], false);
  assert.doesNotMatch(JSON.stringify(exported), /data:image|\/Users\/leo/);

  const markdown = context.WaypointToolbar.formatAnnotationsAsMarkdown([{
    id: annotation.id,
    url: annotation.url,
    status: 'pending',
    pending_changes: { color: { original: '#000', value: '#fff' } },
  }], { scope: 'page', status: 'pending' });
  assert.match(markdown, /Comment: /);
  assert.doesNotMatch(markdown, /Comment: undefined/);

  const normalized = context.WaypointToolbar.normalizeImportEnvelope({
    waypoint_annotations_export: true,
    version: '1.0',
    routes: exported.routes,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(normalized.annotations)), JSON.parse(JSON.stringify(exported.annotations)));
});

test('toolbar clipboard groups annotations by their full route identity', async () => {
  const toolbar = await readFile(toolbarUrl, 'utf8');

  assert.match(toolbar, /WaypointExportCodec\.getAnnotationRoute/);
  assert.match(toolbar, /## Route: /);
});

test('toolbar requests optional site access through the background message seam', async () => {
  const toolbar = await readFile(toolbarUrl, 'utf8');

  assert.match(toolbar, /WaypointAPI\.requestOptionalSitePermission\(\)/);
  assert.doesNotMatch(toolbar, /sendMessage\(\{ action: 'requestOptionalSitePermission', origin \}\)/);
  assert.match(toolbar, /waypoint-site-permission/);
});

test('popup exposes synchronized theme, pin color, and clear-on-copy settings', async () => {
  const [popup, html] = await Promise.all([
    readFile(popupUrl, 'utf8'),
    readFile(popupHtmlUrl, 'utf8'),
  ]);

  assert.match(html, /id="clear-on-copy-toggle"/);
  assert.match(html, /name="badge-color"/);
  assert.match(popup, /waypointClearOnCopy/);
  assert.match(popup, /waypointBadgeColor/);
});

test('screenshot settings distinguish automatic MCP context from manual attachments', async () => {
  const toolbar = await readFile(new URL('../public/content/modules/floating-toolbar.js', import.meta.url), 'utf8');
  const popup = await readFile(new URL('../public/popup/popup.html', import.meta.url), 'utf8');

  assert.match(toolbar, /Automatically capture the selected Target for MCP context/);
  assert.match(toolbar, /Manual reference images stay available/);
  assert.match(popup, /Automatically capture the selected Target for MCP context/);
  assert.match(popup, /Manual reference images remain available/);
});

test('toolbar and popup expose the global Design Actions preference with Impeccable guidance', async () => {
  const [toolbar, popup, popupHtml, readme] = await Promise.all([
    readFile(toolbarUrl, 'utf8'),
    readFile(popupUrl, 'utf8'),
    readFile(popupHtmlUrl, 'utf8'),
    readFile(new URL('../../../README.md', import.meta.url), 'utf8'),
  ]);

  assert.match(toolbar, /Show Design Actions/);
  assert.match(toolbar, /Requires Impeccable/);
  assert.match(toolbar, /saveShowDesignActions/);
  assert.match(popupHtml, /id="show-design-actions-toggle"/);
  assert.match(popupHtml, /Requires Impeccable/);
  assert.match(popup, /waypointShowDesignActions/);
  assert.match(readme, /Design Actions require \[Impeccable\]\(https:\/\/github\.com\/pbakaus\/impeccable\)/);
  assert.match(readme, /Tested[^]*Expected[^]*Unknown/);
});

test('popup presents retained Queue states and Claim ownership explicitly', async () => {
  const popup = await readFile(popupUrl, 'utf8');

  assert.match(popup, /Annotation queue/);
  assert.match(popup, /status-\$\{annotation\.status\}/);
  assert.match(popup, /annotation\.claim\?\.owner/);
  assert.doesNotMatch(popup, /Pending annotations/);
});

test('toolbar and popup retain keyboard-visible auto-resize styling hooks', async () => {
  const [styles, popup] = await Promise.all([
    readFile(stylesUrl, 'utf8'),
    readFile(popupUrl, 'utf8'),
  ]);

  assert.match(styles, /waypoint-toolbar.*touch-action: none/s);
  assert.match(styles, /@media \(max-width: 480px\)/);
  assert.match(popup, /textarea\.style\.height = 'auto'/);
  assert.match(popup, /scrollHeight/);
});

test('extension has no release promotion banner, NEW badge, or changelog behavior', async () => {
  const [background, popup, html, entrypoint] = await Promise.all([
    readFile(new URL('../public/background/background.js', import.meta.url), 'utf8'),
    readFile(popupUrl, 'utf8'),
    readFile(popupHtmlUrl, 'utf8'),
    readFile(new URL('../entrypoints/intervention.html', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(background, /setBadgeText\(\{ text: 'NEW' \}\)/);
  assert.doesNotMatch(background, /getChangelogForVersion/);
  assert.doesNotMatch(popup, /checkForUpdateNotification|showChangelog|dismissUpdateBanner/);
  assert.doesNotMatch(html, /update-banner|What's new|Extension updated/);
  assert.doesNotMatch(entrypoint, /update-banner|updateLink|updateDismiss/);
  assert.match(background, /compatibility_message/);
});
