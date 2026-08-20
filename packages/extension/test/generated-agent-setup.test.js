import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const WAYPOINT_MCP_URL = 'http://127.0.0.1:3846/mcp';

test('generated toolbar guides every supported coding agent without OpenClaw', async () => {
  const source = await readFile(
    new URL('../.output/chrome-mv3/content/modules/floating-toolbar.js', import.meta.url),
    'utf8',
  );

  for (const agent of ['Claude Code', 'Cursor', 'Windsurf', 'Codex', 'Pi', 'OpenCode']) {
    assert.match(source, new RegExp(`>${agent}<`));
  }

  assert.doesNotMatch(source, /OpenClaw/i);
  assert.match(source, /WaypointAgentSetup/);
});

test('popup setup wizard guides every supported coding agent without OpenClaw', async () => {
  const source = await readFile(
    new URL('../.output/chrome-mv3/popup/popup.html', import.meta.url),
    'utf8',
  );

  for (const agent of ['Claude Code', 'Cursor', 'Windsurf', 'Codex', 'Pi', 'OpenCode']) {
    assert.match(source, new RegExp(`>${agent}<`));
  }

  assert.doesNotMatch(source, /OpenClaw/i);
  assert.match(source, /agent-setup-config\.js/);

  const popupScript = await readFile(
    new URL('../.output/chrome-mv3/popup/popup.js', import.meta.url),
    'utf8',
  );
  assert.match(popupScript, /setupAgentTabs\(\);[\s\S]{0,120}setupCommandCopying\(\)/);
});

test('generated setup data is the single Waypoint-native source for agent configurations', async () => {
  const source = await readFile(
    new URL('../.output/chrome-mv3/agent-setup-config.js', import.meta.url),
    'utf8',
  );
  const context = { globalThis: {} };
  vm.runInNewContext(source, context);
  const setup = context.globalThis.WaypointAgentSetup;

  assert.equal(setup.codex.path, '~/.codex/config.toml');
  assert.equal(setup.pi.path, '~/.pi/agent/mcp.json');
  assert.equal(setup.opencode.path, '~/.config/opencode/opencode.json');
  assert.match(setup.codex.command, /mcp_servers\.logbook-waypoint/);
  assert.equal(JSON.parse(setup.pi.command).mcpServers['logbook-waypoint'].url, WAYPOINT_MCP_URL);
  assert.deepEqual(
    JSON.parse(setup.opencode.command).mcp['logbook-waypoint'],
    { type: 'remote', url: WAYPOINT_MCP_URL, enabled: true },
  );

  const manifest = JSON.parse(await readFile(
    new URL('../.output/chrome-mv3/manifest.json', import.meta.url),
    'utf8',
  ));
  assert.deepEqual(manifest.content_scripts[0].js.slice(0, 8), [
    'annotation-id.js',
    'annotation-status.js',
    'annotation-collection.js',
    'design-intent.js',
    'variant-intent.js',
    'annotation-validation.js',
    'export-codec.js',
    'agent-setup-config.js',
  ]);
});
