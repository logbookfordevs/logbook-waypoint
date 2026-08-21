# Changelog

All notable changes to Logbook Waypoint will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Next Release

### Added
- Waypoint-branded extension, local server, CLI, storage, annotation IDs, and MCP configuration
- Annotation lifecycle with pending, claimed, resolved, and discarded states
- Durable Watch delivery for agents, including restart recovery and revision-safe cursors
- Named annotation variants with active selection, cancellation, finalization, and scaffold cleanup
- React source identity for annotated elements through a bounded read-only probe
- Design Actions for freeform or guided Impeccable workflows, with resolution records and optional Variant Intent
- Element screenshots, image attachments, and refined floating-toolbar controls
- Optional JSON import/export, project context, bulk cleanup, keyboard inspection, and annotation appearance settings

### Changed
- Rebuilt the product from the final MIT-licensed foundation under the Logbook Waypoint identity
- Reworked the extension around the Atlantic Chartroom Driftwood palette, with Day Chart and Night Watch appearances and product-role colors for actions, navigation, signals, and pins
- Reorganized Element edits below the annotation brief with an adaptive expanding rail, saved-change markers, and compact optional Variant and Design Action controls
- Hardened the local server to loopback-only access with strict host, origin, request-size, and identifier validation
- Made annotation routes preserve full paths, queries, and hashes
- Improved selector portability, target re-anchoring, keyboard navigation, design rollback, and queues larger than 50 annotations
- Replaced remote update promotion with local extension/server compatibility guidance
- Added HTTP and JSON MCP connection guidance for coding agents

### Fixed
- Prevented deleted annotations from returning during synchronization
- Preserved annotation lifecycle, Variant, screenshot, and attachment data across sync and restart boundaries
- Kept unresolved Variant Sets protected from ordinary mutation or deletion
- Restored target selection and badge placement across shadow DOM, repeated elements, and rerendered pages
- Made hiding Design Actions affect authoring UI without invalidating existing requests

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
