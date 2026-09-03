# Logbook Waypoint documentation

Choose the shortest route for what you need to understand or change.

## Start visually

- [Waypoint Signal Chart](https://tot.page/I3pC-z9cCejNITMc7Mk96Q/index.html@b5f1d9e0955ce3411ccf9709e3d05bd89415a8bd) — trace the extension, Queue, MCP server, coding-agent journeys, lifecycle, and complete MCP tool surface interactively.

## Use and develop Waypoint

- [User guide](USER_GUIDE.md) — annotate a page, manage the Queue, copy or export work, connect MCP, and configure everyday behavior.
- [Use Design Actions](DESIGN_ACTIONS.md) — author guided or Freeform design work, request Variants, and understand Queue outcomes.
- [Use Waypoint through MCP](MCP_GUIDE.md) — follow the normal agent workflow, understand compact Survey and diagnostic Inspect, and reference all 19 tools.
- [Development guide](DEVELOPMENT.md) — work on the extension and local server.
- [Update system](UPDATE_SYSTEM.md) — understand the retained local update behavior and maintenance boundary.
- [Server package guide](../packages/server/README.md) — install, run, connect, and use the local MCP server.

## Behavioral contracts

- [Annotation Context](contracts/annotation-context.md) — Survey versus Inspect, project discovery, Target compatibility, media, and trust boundaries.
- [Annotation Lifecycle](contracts/annotation-lifecycle.md) — Pending, Claim, release, resolution, discard, expiry, and deletion ownership.
- [Product Identifiers](contracts/product-identifiers.md) — canonical repository, package, MCP, storage, and Annotation identifiers.
- [Chrome Web Store submission](CHROME_WEB_STORE.md) — extension packaging, listing copy, privacy disclosures, reviewer instructions, assets, and delivery gates.
- [Source Identity](contracts/source-identity.md) — bounded framework and source hints captured for a Target.
- [Variants](contracts/variants.md) — candidate creation, activation, discard, cancellation, Finalization, and Scaffold cleanup.
- [Watch Mode](contracts/watch-mode.md) — side-effect-free at-least-once request delivery, cursors, reconnection, and Claim separation.

## Specifications

- [Design Actions specification](specs/design-actions.md) — accepted product behavior, decisions, edge cases, and test seams behind the user guide.
- [Multi-Target Annotations specification](specs/multi-target-annotations.md) — ordered Target Sets, shared feedback, selection behavior, and portable contract boundaries.

## Architectural decisions

- [ADR 0001](adr/0001-build-from-the-last-mit-foundation.md) — build from the last MIT foundation.
- [ADR 0002](adr/0002-keep-the-server-loopback-only.md) — keep the server loopback-only.
- [ADR 0003](adr/0003-remove-public-page-automation.md) — remove public page automation.
- [ADR 0004](adr/0004-start-without-vibe-data-migration.md) — start without predecessor data migration.
- [ADR 0005](adr/0005-keep-waypoint-as-design-workflow-authority.md) — keep Waypoint as design-workflow authority.
- [ADR 0006](adr/0006-separate-variant-intent-from-generated-sets.md) — separate authored Variant Intent from generated Variant Sets.
- [ADR 0007](adr/0007-one-annotation-owns-a-target-set.md) — keep shared feedback and lifecycle in one Annotation owning its Target Set.

## Release notes

- [Product changelog](../CHANGELOG.md) — extension, workflow, UX, and whole-product changes.
- [Server changelog](../packages/server/CHANGELOG.md) — MCP server and package-specific changes.
