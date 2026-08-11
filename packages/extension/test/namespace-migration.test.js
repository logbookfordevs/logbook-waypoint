import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const legacyNamespace = ['vi', 'be'].join('');
const legacyExportEnvelope = `${legacyNamespace}_annotations_export`;

async function readExtensionSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = [];

  for (const entry of entries) {
    const file = new URL(entry.name, directory);
    if (entry.isDirectory()) {
      sources.push(...await readExtensionSources(new URL(`${entry.name}/`, directory)));
    } else if (entry.name !== 'iconify-icon.min.js' && /\.(?:js|css|html)$/.test(entry.name)) {
      sources.push(await readFile(file, 'utf8'));
    }
  }

  return sources;
}

test('extension source exposes only Waypoint namespace, storage, and export contracts', async () => {
  const source = (await readExtensionSources(new URL('../public/', import.meta.url))).join('\n');
  const legacyStorageKeys = [
    'annotations',
    'settings',
    'updateInfo',
    'themePreference',
    'screenshotEnabled',
    'focusedAnnotationId',
    'deletedAnnotationIds',
    '_syncFlagsMigrated',
  ].join('|');

  assert.equal(source.toLowerCase().includes(legacyNamespace), false);
  assert.equal(source.includes(legacyExportEnvelope), false);
  assert.doesNotMatch(source, new RegExp(`storage\\.local\\.(?:get|remove)\\(\\[['"](?:${legacyStorageKeys})['"]`));
  assert.doesNotMatch(source, new RegExp(`storage\\.local\\.set\\(\\{\\s*(?:${legacyStorageKeys}):`));
  assert.match(source, /waypointAnnotations/);
  assert.match(source, /waypoint_annotations_export/);
  assert.match(source, /WaypointAnnotationId\.create/);
  assert.match(source, /annotations\.every\(annotation => WaypointAnnotationId\.isValid\(annotation\?\.id\)\)/);
  assert.doesNotMatch(source, /--v-|['"]v-(?:surface|text|outline|accent|warning|danger|highlight|badge|tooltip)/);
});

test('generated extension artifacts preserve the canonical namespace without vendored Iconify internals', async () => {
  const artifactSources = await readExtensionSources(new URL('../.output/chrome-mv3/', import.meta.url));

  const artifacts = artifactSources.join('\n');
  assert.equal(artifacts.toLowerCase().includes(legacyNamespace), false);
  assert.equal(artifacts.includes(legacyExportEnvelope), false);
  assert.doesNotMatch(artifacts, /--v-|['"]v-(?:surface|text|outline|accent|warning|danger|highlight|badge|tooltip)/);
});

test('background persistence consistently reads canonical Waypoint storage properties', async () => {
  const source = await readFile(new URL('../public/background/background.js', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /stored\.annotations|fresh\.annotations/);
  assert.match(source, /stored\.waypointAnnotations/);
  assert.match(source, /fresh\.waypointAnnotations/);
});

test('generated annotation ID adapter precedes all callers and rejects legacy IDs', async () => {
  const [adapterSource, backgroundSource, manifestSource] = await Promise.all([
    readFile(new URL('../.output/chrome-mv3/annotation-id.js', import.meta.url), 'utf8'),
    readFile(new URL('../.output/chrome-mv3/background/background.js', import.meta.url), 'utf8'),
    readFile(new URL('../.output/chrome-mv3/manifest.json', import.meta.url), 'utf8'),
  ]);
  const context = { globalThis: {} };

  vm.runInNewContext(adapterSource, context);

  assert.equal(context.globalThis.WaypointAnnotationId.isValid('waypoint_1700000000000_abcdefgh'), true);
  assert.equal(context.globalThis.WaypointAnnotationId.isValid(`${legacyNamespace}_1700000000000_abcdefgh`), false);
  assert.equal(JSON.parse(manifestSource).content_scripts[0].js[0], 'annotation-id.js');
  assert.ok(backgroundSource.indexOf("importScripts('../annotation-id.js')") < backgroundSource.indexOf("importScripts('queue-sync.js')"));
});
