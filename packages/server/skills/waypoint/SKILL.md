---
name: waypoint
description: Use when handling Logbook Waypoint Annotations or Variant Sets through MCP, including requests to read or watch Waypoint.
---

# Waypoint

Use Waypoint as a local request Queue, not as passive commentary.

## Find the project

1. Prefer a loopback URL the user supplied.
2. Otherwise infer the current development URL from the repository's running server, terminal output, or documented dev command.
3. Query that explicit URL with `read_annotations`. An empty result is valid even when the project has never stored an Annotation.
4. Use unscoped discovery only when no current URL can be inferred. Ask the user only when several plausible projects remain.

Treat `localhost` and `127.0.0.1` as aliases. Preserve the port. Use a project root or `/*` for the whole project, a pathname for one Page, and query or hash for one View State.

## Intake without payload waste

Start with `read_annotations` or the compact result from `watch_annotations`. The selector, comment, compact styles, Target context, and source identity are normally enough to locate the source. Call `inspect_annotations` only when layout, cascade, placement, ancestry, or source identity remains ambiguous. Retrieve screenshots only when visual evidence is necessary.

## Own work before editing

Claim a Pending Annotation immediately before changing source. Claiming after an edit can still succeed, but forfeits the concurrency protection: another agent may have claimed or implemented the same request meanwhile. Never overwrite an active Claim owned by someone else.

The same owner may claim again to refresh expiry. Refresh before a later mutation when a long review or Variant comparison may have outlived the Claim.

## Finish the lifecycle

After implementation and proportionate verification, resolve the Annotation. Release it when blocked so another agent can continue. Discard only when the user intentionally rejects the request.

Ordinary Annotations resolve without a Resolution Record. Design Actions require the structured Resolution Record requested by the tool schema.

## Variants

Variant cancellation is a user decision, not lost work. Watch can publish `change_type: "variant_cancelled"`; a previously known unresolved Variant Set that returns to Pending without `variant_request` means the same thing. Remove temporary Variant Scaffold and do not recreate candidates until the user authors new Variant Intent.

Finalize only the chosen Variant, clean the other implementations and Scaffold, then complete the Annotation lifecycle.
