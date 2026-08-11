globalThis.WaypointAgentSetup = Object.freeze({
  codex: Object.freeze({
    path: '~/.codex/config.toml',
    introduction: 'Add to',
    display: '[mcp_servers.logbook-waypoint]\nurl = "http://127.0.0.1:3846/mcp"',
    command: '[mcp_servers.logbook-waypoint]\nurl = "http://127.0.0.1:3846/mcp"',
  }),
  pi: Object.freeze({
    path: '~/.pi/agent/mcp.json',
    introduction: 'Pi uses MCP through an extension. After installing one, add to',
    display: '{"mcpServers":{"logbook-waypoint":{"url":"http://127.0.0.1:3846/mcp"}}}',
    command: '{"mcpServers":{"logbook-waypoint":{"url":"http://127.0.0.1:3846/mcp"}}}',
  }),
  opencode: Object.freeze({
    path: '~/.config/opencode/opencode.json',
    introduction: 'Add to',
    display: '{"mcp":{"logbook-waypoint":{"type":"remote","url":"http://127.0.0.1:3846/mcp","enabled":true}}}',
    command: '{"mcp":{"logbook-waypoint":{"type":"remote","url":"http://127.0.0.1:3846/mcp","enabled":true}}}',
  }),
});
