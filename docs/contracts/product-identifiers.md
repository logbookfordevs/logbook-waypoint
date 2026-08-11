# Product identifiers

Status: Implemented in Phase 6.

## Canonical identifiers

| Surface | Identifier |
| --- | --- |
| Product | `Logbook Waypoint` |
| Repository | `logbook-waypoint` |
| NPM package | `@logbookfordevs/waypoint` |
| CLI command | `waypoint` |
| MCP configuration key | `logbook-waypoint` |
| Local data directory | `~/.logbook-waypoint` |
| Annotation ID prefix | `waypoint_` |

## Rules

- Waypoint starts with empty product data and does not import Vibe Annotations storage or settings.
- New public documentation uses only canonical identifiers, except when preserving historical attribution.
- Original MIT copyright and source lineage remain visible where legally and historically relevant.
- Waypoint does not promise compatibility with Vibe extension storage, package names, MCP configuration, browser extension identity, or data directories.
- Identifier validation lives behind one shared interface used by extension generation, server validation, imports, and tests.
- New and accepted Annotation IDs use `waypoint_<timestamp>_<random>`; predecessor prefixes are rejected.
- Active extension storage keys, page-owned DOM names, internal events, module protocols, logs, and export envelopes use Waypoint-native names.
- The identifier migration is a source and schema migration for an unpublished product, not a data compatibility layer.
