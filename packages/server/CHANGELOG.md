# Changelog - Logbook Waypoint Server

All notable changes to the `@logbookfordevs/waypoint` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Next Release

### Added
- Waypoint annotation lifecycle, Watch, Variant, Design Action, Work Notice, and Resolution Record contracts
- MCP tools for durable annotation watching, screenshot retrieval, lifecycle updates, Variant delivery, and finalization
- HTTP, JSON, and legacy SSE connection guidance for MCP clients
- Version information in the health endpoint and package-derived CLI version output

### Changed
- Renamed the package and commands for Logbook Waypoint while retaining loopback port compatibility
- Hardened host, origin, payload, attachment, annotation ID, and persistence validation
- Made Watch recovery durable across server restarts and annotation recreation
- Replaced remote update checks with local extension compatibility guidance

### Fixed
- Preserved lifecycle, Variant, screenshot, attachment, and Design Action state during full synchronization
- Prevented unresolved Variant Sets from being mutated or deleted through ordinary annotation operations
- Prevented deleted annotations from being resurrected by stale extension state

### Removed
- Automatic remote release checks and promotional console notices
- LAN and WSL binding support

## [0.1.3] - 2025-08-05

### Added
- File locking mechanism to prevent save race conditions
- Data comparison in sync endpoint to skip redundant saves
- Enhanced logging for file operations

### Fixed
- ENOENT errors during concurrent annotation saves
- Variable scope bug in fallback write mechanism
- CLI version now reads from package.json instead of hardcoded value

### Changed
- Improved error handling with proper fallback mechanisms
- Better concurrent operation handling

## [0.1.2] - 2025-08-04

### Added
- SSE transport implementation for Claude Code integration
- Bidirectional synchronization with smart conflict resolution
- Session management for transport connections
- Enhanced startup logging with annotation counts

### Fixed
- SSE transport timeout issues with Claude Code
- Annotation persistence across server restarts

## [0.1.0] - 2025-08-03

### Added
- Initial release of vibe-annotations-server (MIT foundation)
- HTTP API for Chrome extension communication
- MCP tool implementations (read_annotations, delete_annotation, get_project_context)
- SSE endpoint for AI coding agent integration
- CLI with start/stop/restart/status commands
- Atomic file operations for data persistence
- Multi-project detection and warnings
- Graceful shutdown handling

### Security
- Local-only operation (127.0.0.1)
- No external dependencies for core functionality
