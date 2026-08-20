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
- Tools for watching, claiming, releasing, resolving, discarding, deleting, grouping, and inspecting annotations
- A Chrome-compatible unpacked extension

Waypoint now adds a Logbook-native experience, a clearer work queue, Watch, Variants, Source Identity, and coding-agent setup on top of that foundation.

Annotations move from Pending to Claimed before agent work. Release or inactivity expiry returns them to Pending; resolve and discard retain terminal history. Permanent deletion remains a separate explicit operation.

## Architecture

Logbook Waypoint currently has two parts:

1. **Browser extension** (`packages/extension/`) — captures and manages visual annotations and builds with WXT.
2. **Local MCP server** (`packages/server/`) — persists annotations and exposes them to coding agents on `127.0.0.1:3846`.

The extension, server, package, CLI, MCP configuration, storage keys, and Annotation IDs use the canonical identifiers defined in [the product identifier contract](docs/contracts/product-identifiers.md). Waypoint starts with its own empty storage and does not import settings or Annotations from predecessor products.

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

### Browser shortcuts

Waypoint registers browser-managed extension commands so shortcuts do not compete with the inspected page's own keyboard handling.

| Action | macOS default | Other platforms |
| --- | --- | --- |
| Toggle annotation mode | `Command+Shift+Comma` | `Ctrl+Shift+Comma` |
| Collapse or expand the toolbar | `Command+Shift+Period` | `Ctrl+Shift+Period` |
| Open or close Settings | `Command+Shift+L` | `Ctrl+Shift+L` |
| Hide or show Waypoint | Unassigned | Unassigned |

Open `chrome://extensions/shortcuts` to change any assignment or add a shortcut for hide/show. The Settings command restores Waypoint and expands the toolbar before opening Settings when necessary.

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

### Design Actions setup

Design Actions let you pair the normal Annotation comment with one Impeccable design discipline—such as Polish, Layout, Typeset, or Animate—or leave the action in Freeform. Turn on **Design Actions** in the Annotation editor, choose an action if one fits, and save the request to the normal Waypoint Queue.

See [Use Design Actions](docs/DESIGN_ACTIONS.md) for the complete authoring flow, action catalog, Variant behavior, Queue outcomes, and troubleshooting expectations.

Design Actions require [Impeccable](https://github.com/pbakaus/impeccable). Install it through Impeccable's current agent-specific instructions; Waypoint neither installs it nor detects whether it is available.

- **Tested:** no agent-specific Impeccable installation path is certified by Waypoint in this initial integration.
- **Expected:** paths documented by Impeccable should work when the coding agent can load the installed skill and access Waypoint through MCP.
- **Unknown:** unlisted agents, custom skill locations, and future Impeccable versions remain unverified.

The `Show Design Actions` preference only controls authoring UI for new Annotations. Reopening an Annotation with saved Design Intent always reveals its Design Actions state.

Waypoint owns the Design Actions workflow and Annotation lifecycle; Impeccable supplies the external design discipline, not a second work-state system. An authored Design Intent may include separate Variant Intent. After an agent generates candidates and submits the complete set, Waypoint stores and governs the Variant Set, its Active Variant, and Finalization cleanup.

If the requested workflow is unavailable or execution fails recoverably, the agent releases the Annotation to Pending with a safe Work Notice. Successful Design Actions retain a provider-neutral Resolution Record with a short outcome and verification evidence. Read exposes the complete record, while Watch keeps delivery concise.

## Security boundary

The server binds only to IPv4 loopback, validates local Host and Origin headers, enables MCP DNS-rebinding protection, validates Annotation IDs, and labels page-derived MCP output as untrusted. The extension exposes no public page-world automation bridge. See [SECURITY.md](SECURITY.md) for the active boundary.

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
