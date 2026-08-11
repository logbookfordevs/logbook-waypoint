# Logbook Waypoint

[![License: MIT](https://img.shields.io/badge/License-MIT-b9502f.svg)](LICENSE)
[![Status: Early Development](https://img.shields.io/badge/status-early_development-18221f.svg)](https://github.com/logbookfordevs/logbook-waypoint)

**Pin the point. Chart the change.**

Logbook Waypoint is a local-first visual feedback tool for developers and coding agents. Place annotations directly on a development interface, preserve the surrounding element context, and let an MCP-compatible agent read and resolve the resulting queue.

> [!IMPORTANT]
> Logbook Waypoint is at the beginning of its independent development. The npm package and browser extension are not published yet. Use the development setup below.

## Current foundation

The initial MIT foundation already provides:

- Visual annotations on localhost and local development domains
- Multi-page annotation capture
- Local browser and server persistence
- Optional screenshots and element context
- An MCP server over HTTP and SSE
- Tools for reading, deleting, grouping, and inspecting annotations
- A Chrome-compatible unpacked extension

The next route adds a Logbook-native experience, a clearer work queue, watch mode, variants, and Impeccable workflows without importing post-MIT Vibe Annotations code.

## Architecture

Logbook Waypoint currently has two parts:

1. **Browser extension** (`packages/extension/`) — captures and manages visual annotations and builds with WXT.
2. **Local MCP server** (`packages/server/`) — persists annotations and exposes them to coding agents on `127.0.0.1:3846`.

Some internal `vibe_*` identifiers remain intentionally unchanged in this first checkpoint. They are implementation details inherited from the MIT foundation and will be migrated only with tests around the browser/server protocol.

## Design foundations

- [Domain language](CONTEXT.md)
- [Architectural decisions](docs/adr/)
- [Behavioral contracts](docs/contracts/)

## Development setup

Install the pnpm workspace once from the repository root:

```bash
pnpm install
```

Build and verify both packages:

```bash
pnpm check
pnpm test
pnpm build
```

### Local server

```bash
pnpm --filter @logbookfordevs/waypoint start
```

### Browser extension

1. Open `chrome://extensions` in a Chromium browser.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this repository's `packages/extension/.output/chrome-mv3/` directory.

### MCP connection

Use the HTTP endpoint when your coding agent supports streamable HTTP:

```text
http://127.0.0.1:3846/mcp
```

For Codex:

```toml
[mcp_servers.logbook-waypoint]
url = "http://127.0.0.1:3846/mcp"
```

For JSON-based MCP clients:

```json
{
  "mcpServers": {
    "logbook-waypoint": {
      "url": "http://127.0.0.1:3846/mcp"
    }
  }
}
```

The legacy SSE endpoint remains available at `http://127.0.0.1:3846/sse`.

## Security boundary

The server binds only to IPv4 loopback, validates local Host and Origin headers, enables MCP DNS-rebinding protection, validates annotation IDs, and labels page-derived MCP output as untrusted. See [SECURITY.md](SECURITY.md) for the active boundary and the deferred browser-bridge risk.

## Project lineage

Logbook Waypoint begins from Vibe Annotations commit [`8864e12`](https://github.com/RaphaelRegnier/vibe-annotations/commit/8864e12cfb28c6825ef6ccf996d291fc2b0ebcd4), the final repository commit distributed under the MIT License before its upstream license change.

The original MIT copyright and permission notice are preserved in [LICENSE](LICENSE). Additional lineage details are recorded in [NOTICE.md](NOTICE.md).

Logbook Waypoint is an independent project and is not affiliated with or endorsed by Raphael Regnier or Spellbind Creative Studio. “Vibe Annotations” and its original visual identity belong to their respective owner.

## Contributing

The project is intentionally early. Before proposing a large change, open an issue describing the problem, rationale, and smallest useful solution. See [CONTRIBUTING.md](CONTRIBUTING.md) for the inherited development notes that are being revised alongside the codebase.

## Support the voyage

If Logbook Waypoint helps your workflow, you can support Logbook for Devs:

- [Buy me a coffee — 5](https://ko-fi.com/logbookfordevs?amount=5)
- [Buy me lunch — 15](https://ko-fi.com/logbookfordevs?amount=15)
- [Buy me dinner — 30](https://ko-fi.com/logbookfordevs?amount=30)
- [Choose an amount on Ko-fi](https://ko-fi.com/logbookfordevs)
- [Support on Buy Me a Coffee](https://buymeacoffee.com/logbookfordevs)

## License and attribution

MIT — see [LICENSE](LICENSE).

A tool from the [Logbook for Devs](https://logbookfordevs.com/)

Charting the technical seas, one commit at a time.
