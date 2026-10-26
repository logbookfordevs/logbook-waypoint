# Logbook Waypoint documentation

Choose the shortest route for what you need to understand or change.

## Start visually

- [Waypoint Signal Chart](https://tot.page/I3pC-z9cCejNITMc7Mk96Q/index.html@b5f1d9e0955ce3411ccf9709e3d05bd89415a8bd) — trace the extension, Queue, server, coding-agent journeys, and lifecycle interactively. Its agent-integration map may predate the current CLI and skill workflow.

## Use and develop Waypoint

- [User guide](USER_GUIDE.md) — annotate a page, manage the Queue, copy or export work, connect an agent, and configure everyday behavior.
- [Journal guide](JOURNAL_MODE.md) — personal taped notes, screenshot copying, page matching, and local storage.
- [Use Design Actions](DESIGN_ACTIONS.md) — author guided or Freeform design work, request Variants, and understand Queue outcomes.
- [Agent CLI guide](CLI_GUIDE.md) — follow the normal agent workflow, understand compact Survey and diagnostic Inspect, and find every `waypoint` command.
- [Development guide](DEVELOPMENT.md) — work on the extension and local server.
- [Update system](UPDATE_SYSTEM.md) — understand the retained local update behavior and maintenance boundary.
- [Server package guide](../packages/server/README.md) — install, run, and use the local server and agent CLI.

## Behavioral contracts

- [Annotation Context](contracts/annotation-context.md) — Survey versus Inspect, ID and URL selection, Target compatibility, media, and trust boundaries.
- [Annotation Lifecycle](contracts/annotation-lifecycle.md) — Pending, Claim, release, resolution, discard, expiry, and deletion ownership.
- [Product Identifiers](contracts/product-identifiers.md) — canonical repository, package, storage, and Annotation identifiers.
- [Chrome Web Store submission](CHROME_WEB_STORE.md) — extension packaging, listing copy, privacy disclosures, reviewer instructions, assets, and delivery gates.
- [Source Identity](contracts/source-identity.md) — bounded framework and source hints captured for a Target.
- [Variants](contracts/variants.md) — candidate presentation, activation, discard, cancellation, Finalization, and Scaffold reconciliation.

## Specifications

- [Journal mode specification](specs/journal-mode.md) — local journals, note interaction, visual behavior, and future boundaries.
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
- [ADR 0008](adr/0008-install-a-waypoint-workflow-skill.md) — install a Waypoint workflow skill.
- [ADR 0009](adr/0009-foreground-watch-consumer.md) — add a foreground Watch consumer (superseded).
- [ADR 0010](adr/0010-watch-current-open-work.md) — watch current open work (superseded).
- [ADR 0011](adr/0011-retire-mcp-and-watch.md) — retire MCP and Watch in favor of the CLI and skill.

## Release notes

- [Product changelog](../CHANGELOG.md) — extension, workflow, UX, and whole-product changes.
- [Server changelog](../packages/server/CHANGELOG.md) — server, CLI, and package-specific changes.

## Creative experiments

- [Waypoint experiment archive](references/waypoint-labs/README.md) — preserved website experiment branches, snapshot commits, source and evidence locations, and the deferred Logbook Labs publishing decision.
