# waypoint

Global MCP server for Logbook Waypoint browser extension.

## Installation

Install the latest checksummed release directly:

```bash
curl -fsSL https://waypoint.logbookfordevs.com/install.sh | bash
```

Or install through npm:

```bash
npm install --global @logbookfordevs/waypoint
```

For a one-off run, use `npx @logbookfordevs/waypoint --help`.

## Usage

### Start the server

```bash
waypoint start
```

The server will run in the background on port 3846.

Keep it attached to the current terminal for a temporary session or debugging:

```bash
waypoint start --foreground
```

### Stop the server

```bash
waypoint stop
```

### Check server status

```bash
waypoint status
```

### Restart the server

```bash
waypoint restart
```

### View logs

```bash
waypoint logs
# or follow logs
waypoint logs -f
```

## AI Coding Agent Integration

After starting the server, connect it to your AI coding agent. The server supports multiple agents via MCP (Model Context Protocol) using both HTTP and SSE transports.

### Recommended: Add MCP

The fastest setup for supported coding agents is [Add MCP](https://add-mcp.com/):

```bash
npx add-mcp http://127.0.0.1:3846/mcp --name logbook-waypoint --global
```

Add MCP detects supported agents and guides you through the configurations it will update. The `--global` option makes Waypoint available across projects. It configures the MCP connection but does not install or start Waypoint, so run `waypoint start` first.

### Manual configuration

#### Claude Code

In your project directory, run:

```bash
# Recommended (HTTP transport - more stable)
claude mcp add --transport http logbook-waypoint http://127.0.0.1:3846/mcp

# Alternative (SSE transport - for compatibility)
claude mcp add --transport sse logbook-waypoint http://127.0.0.1:3846/sse
```

#### Cursor

1. Open Cursor → Settings → Cursor Settings
2. Go to the Tools & Integrations tab
3. Click + Add new global MCP server
4. Enter the following configuration and save:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

#### Windsurf

1. Navigate to Windsurf → Settings → Advanced Settings
2. Scroll down to the Cascade section
3. Click "Add new server" or edit the raw JSON config file
4. Add the following configuration:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "serverUrl": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

#### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.logbook-waypoint]
url = "http://127.0.0.1:3846/mcp"
```

#### Pi

Pi uses MCP through an extension. After installing one, add to `~/.pi/agent/mcp.json`:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

#### OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "logbook-waypoint": {
      "type": "remote",
      "url": "http://127.0.0.1:3846/mcp",
      "enabled": true
    }
  }
}
```

#### VS Code

1. Install an AI extension that supports MCP (like GitHub Copilot Chat or Continue)
2. Go to Code → Settings → Settings or use the shortcut ⌘,
3. In the search bar, type "MCP"
4. Look for MCP server configurations in your AI extension settings
5. Add the following HTTP configuration:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "type": "http",
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

**Note:** MCP support varies by AI extension. Check your extension's documentation for specific setup instructions.

#### Other Editors

Other editors and tools can connect when they support MCP over streamable HTTP or legacy SSE. Check the client's documentation for its exact configuration shape. Prefer the HTTP endpoint when both transports are available:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

**Note:** The Logbook Waypoint MCP server supports both HTTP and SSE transports. HTTP transport is recommended for better stability. Use the URL: `http://127.0.0.1:3846/mcp` (HTTP) or `http://127.0.0.1:3846/sse` (SSE).

## Architecture

The server provides:
- **MCP HTTP Endpoint** (`/mcp`): Recommended streamable HTTP connection for coding agents
- **SSE Endpoint** (`/sse`): For AI coding agent MCP connections
- **HTTP API** (`/api/annotations`): For Chrome extension communication
- **Health Check** (`/health`): For status monitoring

The HTTP API and MCP tools share one Annotation lifecycle: Pending Annotations may be claimed, Claims may be refreshed by the same owner or released, and Claimed Annotations may be resolved. Pending or owner-claimed Annotations may be discarded. Resolved and Discarded records are retained; deletion is a separate permanent operation.

### Annotation context workflow

Use `read_annotations` to receive user requests from the Queue. Continue from the scoped read through Claim, implementation, verification, and resolution or safe release unless the user explicitly requests a read-only or observation-only result. Saying “read my annotations” alone still requests the normal implementation workflow. An unfiltered call discovers projects without returning Annotation bodies, even when only one project exists. Select one recommended URL filter and repeat the read. Scoped reads return compact summaries normalized across legacy single-Target and multi-Target records. Compact describes response size, not an incomplete brief: Survey should usually provide enough context to implement the request. The Read call itself is side-effect-free and does not create a Claim.

Use `inspect_annotations` with one or more Annotation IDs when selected work needs complete diagnostic context such as computed styles, exact placement, full ancestry, Source Identity hints, or Target relationships. Batch IDs for Annotations being understood or implemented together. Inspection is optional when the compact summary already makes the work clear.

Survey and Inspect report screenshot and attachment availability without embedding media bytes. Retrieve a screenshot or attachment separately when its evidence is needed. The canonical [Annotation Context contract](../../docs/contracts/annotation-context.md) defines the projection, batching, compatibility, and trust boundaries.

See [Use Waypoint through MCP](../../docs/MCP_GUIDE.md) for the normal workflow, concrete calls, response boundary, and complete 19-tool reference.

### Design Actions workflow

[Impeccable](https://github.com/pbakaus/impeccable) is an external dependency for executing Design Actions. Waypoint does not install it, detect it, or promise compatibility with a particular coding agent or future Impeccable version.

Developers author the request in the browser extension. See [Use Design Actions](../../docs/DESIGN_ACTIONS.md) for the action catalog, authoring flow, Variant behavior, and user-visible recovery states.

Waypoint owns the workflow and lifecycle. Design Intent records Freeform or one named Design Action on an ordinary Annotation. Variant Intent separately asks an agent to generate alternatives; once complete candidates exist, Waypoint owns the resulting Variant Set, Active Variant, cancellation, and Finalization cleanup.

An unavailable workflow or recoverable execution failure returns the Annotation to Pending with the latest safe Work Notice. A successful Design Action retains a provider-neutral Resolution Record with its outcome and verification evidence. When Variant Intent produced a Variant Set, that set must reach Finalization before resolution. Survey returns compact Queue context, Inspect returns complete selected evidence, and Watch reactively delivers that same Survey-grade context with revision metadata.

Data is stored in `~/.logbook-waypoint/annotations.json`.

## Development

```bash
# From the repository root
pnpm install
pnpm --filter @logbookfordevs/waypoint start
```

## License

MIT
