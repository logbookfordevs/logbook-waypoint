import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const INSTALL_COMMAND = 'curl -fsSL https://waypoint.logbookfordevs.com/install.sh | bash';
const SKILL_COMMAND = 'npx --yes skills@latest add logbookfordevs/logbook-waypoint --global --agent universal --skill waypoint --yes';

test('generated toolbar guides agent setup through the CLI and Skill only', async () => {
  const source = await readFile(
    new URL('../.output/chrome-mv3/content/modules/floating-toolbar.js', import.meta.url),
    'utf8',
  );

  assert.ok(source.includes(INSTALL_COMMAND));
  assert.ok(source.includes(SKILL_COMMAND));
  assert.ok(source.includes('data-cmd="waypoint start"'));
  assert.doesNotMatch(source, /add-mcp|claude mcp|127\.0\.0\.1:3846\/mcp|mcpServers/);
  assert.doesNotMatch(source, /waypoint watch|Watch continuously/);
  assert.doesNotMatch(source, /WaypointAgentSetup/);
});

test('content scripts no longer ship agent MCP setup data', async () => {
  const manifest = JSON.parse(await readFile(
    new URL('../.output/chrome-mv3/manifest.json', import.meta.url),
    'utf8',
  ));
  assert.deepEqual(manifest.content_scripts[0].js.slice(0, 11), [
    'annotation-id.js',
    'annotation-status.js',
    'annotation-targets.js',
    'annotation-collection.js',
    'annotation-page.js',
    'journal-model.js',
    'design-intent.js',
    'variant-intent.js',
    'annotation-validation.js',
    'data-management.js',
    'export-codec.js',
  ]);
  assert.ok(!manifest.content_scripts[0].js.includes('agent-setup-config.js'));
});
