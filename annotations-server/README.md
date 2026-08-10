# logbook-waypoint-server

Global MCP server for Logbook Waypoint browser extension.

## Installation

```bash
npm install -g logbook-waypoint-server
```

## Usage

### Start the server

```bash
logbook-waypoint-server start
```

The server will run in the background on port 3846.

### Stop the server

```bash
logbook-waypoint-server stop
```

### Check server status

```bash
logbook-waypoint-server status
```

### Restart the server

```bash
logbook-waypoint-server restart
```

### View logs

```bash
logbook-waypoint-server logs
# or follow logs
logbook-waypoint-server logs -f
```

## AI Coding Agent Integration

After starting the server, connect it to your AI coding agent. The server supports multiple agents via MCP (Model Context Protocol) using both HTTP and SSE transports.

### Claude Code

In your project directory, run:

```bash
# Recommended (HTTP transport - more stable)
claude mcp add --transport http logbook-waypoint http://127.0.0.1:3846/mcp

# Alternative (SSE transport - for compatibility)
claude mcp add --transport sse logbook-waypoint http://127.0.0.1:3846/sse
```

### Cursor

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

### Windsurf

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

### VS Code

1. Install an AI extension that supports MCP (like GitHub Copilot Chat or Continue)
2. Go to Code → Settings → Settings or use the shortcut ⌘,
3. In the search bar, type "MCP"
4. Look for MCP server configurations in your AI extension settings
5. Add the following SSE configuration:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "type": "sse",
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

**Note:** MCP support varies by AI extension. Check your extension's documentation for specific setup instructions.

### Other Editors

Other code editors and tools that support SSE (Server-Sent Events) can also connect to the Logbook Waypoint MCP server. If you're using a different editor or tool, check its documentation to confirm it supports SSE-based communication. If it does, you can manually add the server using this configuration:

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
- **SSE Endpoint** (`/sse`): For AI coding agent MCP connections
- **HTTP API** (`/api/annotations`): For Chrome extension communication
- **Health Check** (`/health`): For status monitoring

Data is stored in `~/.logbook-waypoint/annotations.json`.

## Development

```bash
# Clone the repository
git clone <repo-url>
cd logbook-waypoint-server

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## License

MIT