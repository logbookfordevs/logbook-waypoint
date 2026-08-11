# Product identifiers

Status: Accepted Phase 0 contract. Some repository identifiers still use transitional names.

## Canonical identifiers

| Surface | Identifier |
| --- | --- |
| Product | `Logbook Waypoint` |
| Repository | `logbook-waypoint` |
| NPM package | `@logbookfordevs/waypoint` |
| CLI command | `waypoint` |
| MCP configuration key | `logbook-waypoint` |
| Local data directory | `~/.logbook-waypoint` |
| Future Annotation ID prefix | `waypoint_` |

## Rules

- Waypoint starts with empty product data and does not import Vibe Annotations storage or settings.
- New public documentation uses only canonical identifiers, except when preserving historical attribution.
- Original MIT copyright and source lineage remain visible where legally and historically relevant.
- Transitional `vibe_*` Annotation IDs may remain only until the pre-release identifier migration.
- Waypoint does not promise compatibility with Vibe extension storage, package names, MCP configuration, browser extension identity, or data directories.
- Identifier validation lives behind one shared interface used by extension generation, server validation, imports, and tests.

## Current gaps

- New Annotations still use the inherited `vibe_` prefix.
- Internal page events, classes, storage keys, and symbols still contain inherited Vibe names.

These are migration work, not alternative accepted identifiers.
