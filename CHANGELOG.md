# Changelog

All notable changes to Logbook Waypoint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Next Release

## [0.1.1] - 2026-08-28

### Added
- Waypoint-branded extension, local server, CLI, storage, annotation IDs, and MCP configuration
- Dual CLI distribution through npm and checksummed GitHub release archives from one tagged release
- Annotation lifecycle with pending, claimed, resolved, and discarded states
- Durable Watch delivery for agents, including restart recovery and revision-safe cursors
- Named annotation variants with active selection, cancellation, finalization, and scaffold cleanup
- React source identity for annotated elements through a bounded read-only probe
- Design Actions for freeform or guided Impeccable workflows, with resolution records and optional Variant Intent
- Element screenshots, image attachments, and refined floating-toolbar controls
- Optional JSON import/export, project context, bulk cleanup, keyboard inspection, and annotation appearance settings
- A responsive Waypoint marketing and documentation website with interactive workflow examples, complete product guides, Day Chart and Night Watch appearances, and honest pre-release status
- Batched MCP inspection for selected Annotations and complete diagnostic Target context
- Multi-Target Annotations for one shared feedback request across two to eight ordered Targets on the same page
- Queue sync status with manual retry for local changes awaiting the server
- A global Data & Storage manager with project summaries, maintenance guidance, and confirmed project-wide or all-data deletion
- Workflow-first MCP documentation with concrete calls, compact Survey guidance, diagnostic Inspect guidance, and a complete 19-tool reference
- A basic-to-advanced user guide for annotation, Queue, copy/export, MCP, Design Actions, settings, and local-data behavior
- Precise Target correction during inspection with arrow keys and optional compact Smaller and Larger pointer controls

### Changed
- Made `waypoint start` run in the background by default, with `--foreground` for terminal-attached sessions
- Rebuilt the product from the final MIT-licensed foundation under the Logbook Waypoint identity
- Reworked the extension around the Atlantic Chartroom Driftwood palette, with Day Chart and Night Watch appearances and product-role colors for actions, navigation, signals, and pins
- Reorganized Element edits below the annotation brief with an adaptive expanding rail, saved-change markers, and compact optional Variant and Design Action controls
- Hardened the local server to loopback-only access with strict host, origin, request-size, and identifier validation
- Made annotation routes preserve full paths, queries, and hashes
- Improved selector portability, target re-anchoring, keyboard navigation, design rollback, and queues larger than 50 annotations
- Made unscoped MCP Queue reads discovery-only so agents must select a project before annotation bodies are returned
- Made Watch deliver the same compact Survey context as scoped Queue reads while preserving revision-safe reactive delivery
- Made Queue follow-ups survive server outages by retaining unsynced saves, deletions, and Design or Variant Intent removals until synchronization recovers
- Replaced remote update promotion with local extension/server compatibility guidance
- Added HTTP and JSON MCP connection guidance for coding agents
- Replaced the inherited contribution template with Waypoint-specific setup, validation, contract, pull request, and release guidance
- Grouped annotation-experience preferences in an expanded-by-default disclosure, widened the settings surface, and let users hide pointer Target controls without disabling keyboard correction

### Fixed
- Prevented deleted annotations from returning during synchronization
- Made the connected extension automatically pull server lifecycle changes, while manual recovery reconciles them before reporting the Queue as up to date
- Removed resolved and discarded pins from the active page canvas while retaining their Queue history
- Refreshed the open Queue immediately after successful manual synchronization, without requiring it to be reopened
- Updated canvas pins and toolbar counts immediately after permanently deleting an annotation from the Queue
- Stopped annotation targeting when opening the Queue so background hover and Escape behavior no longer overlap Queue management
- Matched annotations by Page across query and hash changes while showing pins only when their captured Targets resolve in the current View State
- Preserved annotation lifecycle, Variant, screenshot, and attachment data across sync and restart boundaries
- Kept unresolved Variant Sets protected from ordinary mutation or deletion
- Restored target selection and badge placement across shadow DOM, repeated elements, and rerendered pages
- Made hiding Design Actions affect authoring UI without invalidating existing requests
- Kept manual Queue synchronization retryable while the server is unavailable and limited offline counts to locally proven unsynced changes
- Made commentless text edits retain their pin, use a meaningful Queue label, and restore their original text when deleted
- Made Site access settings show whether the current page is already enabled instead of always offering an unnecessary permission action

### Removed
- Public page-world annotation automation and mutation APIs
- Promotional update badges, banners, embedded release notes, and remote server update checks
- LAN and WSL server binding

## [1.0.0] - 2025-08-04

### Added
- Initial release of Vibe Annotations Chrome extension (MIT foundation)
- Visual annotation system for localhost development
- MCP integration for AI coding agents
- Light/dark theme support with system preference detection
- Persistent inspection mode for multiple annotations
- Pin-based annotation system with numbered badges
- Route-scoped annotation management
- Chrome Storage API integration
- Real-time synchronization with external server
- File protocol support for local HTML files
- Iconify integration with 200k+ icons
- Zero layout shift editing experience

### Fixed
- Server race conditions causing ENOENT errors
- Badge numbering inconsistencies
- Variable scope issues in error handling
- Redundant sync operations

### Security
- Localhost-only operation for development focus
- Minimal permissions model
- No external network requests from extension
