import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const WAYPOINT_MCP_URL = 'http://127.0.0.1:3846/mcp';

test('generated toolbar guides supported coding agents with Waypoint-native MCP settings', async () => {
  const source = await readFile(
    new URL('../.output/chrome-mv3/content/modules/floating-toolbar.js', import.meta.url),
    'utf8',
  );

  for (const agent of ['Claude Code', 'Cursor', 'Windsurf', 'Codex', 'Pi', 'OpenCode']) {
    assert.match(source, new RegExp(`>${agent}<`));
  }

  assert.doesNotMatch(source, /OpenClaw/i);
  assert.match(source, /~\/\.pi\/agent\/mcp\.json/);
  assert.match(source, /~\/\.config\/opencode\/opencode\.json/);
  assert.match(source, new RegExp(`"logbook-waypoint"[\\s\\S]{0,240}${WAYPOINT_MCP_URL}`));
  assert.match(source, /"type":"remote"/);
});
