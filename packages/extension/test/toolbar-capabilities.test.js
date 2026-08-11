import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const toolbarUrl = new URL('../public/content/modules/floating-toolbar.js', import.meta.url);
const popupUrl = new URL('../public/popup/popup.js', import.meta.url);
const popupHtmlUrl = new URL('../public/popup/popup.html', import.meta.url);
const stylesUrl = new URL('../public/content/modules/styles.js', import.meta.url);

test('toolbar exports status-filtered Markdown and can invoke native sharing', async () => {
  const toolbar = await readFile(toolbarUrl, 'utf8');

  assert.match(toolbar, /waypoint-export-status/);
  assert.match(toolbar, /filterAnnotationsByStatus/);
  assert.match(toolbar, /formatAnnotationsAsMarkdown/);
  assert.match(toolbar, /navigator\.share\(/);
  assert.match(toolbar, /text\/markdown/);
});

test('toolbar clipboard groups annotations by their full route identity', async () => {
  const toolbar = await readFile(toolbarUrl, 'utf8');

  assert.match(toolbar, /getAnnotationRoute/);
  assert.match(toolbar, /annotation\.url_path/);
  assert.match(toolbar, /pathname.*search.*hash/);
  assert.match(toolbar, /## Route: /);
});

test('toolbar requests optional site access through the background message seam', async () => {
  const toolbar = await readFile(toolbarUrl, 'utf8');

  assert.match(toolbar, /requestOptionalSitePermission/);
  assert.match(toolbar, /\$\{location\.protocol\}\/\/\$\{location\.host\}\/\*/);
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
