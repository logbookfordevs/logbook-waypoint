---
name: waypoint
description: Use when handling Logbook Waypoint Annotations or Variant Sets, including CLI Watch sessions and MCP reads or lifecycle actions.
---

# Waypoint

Use Waypoint as a local request Queue. When the user asks to read Waypoint, act on actionable Annotations through resolution by default: read, claim, implement, verify, and resolve. The read tool retrieves requests; a successful read or a list of findings is only intake, not task completion. Limit the task to inspection or a summary only when the user explicitly requests that scope.

Complete each actionable Annotation in scope, or report the concrete blocker or required user decision. Follow the Claim and Variant lifecycle below, including waiting for the user's Variant selection when required.

## Find the project

1. Prefer a loopback URL the user supplied.
2. Otherwise infer the current development URL from the repository's running server, terminal output, or documented dev command.
3. Query that explicit URL with `read_annotations`. An empty result is valid even when the project has never stored an Annotation.
4. `read_annotations` requires an ID or URL. Ask the user for the project URL when no reliable URL can be inferred and no Watch ID is available.

Treat `localhost` and `127.0.0.1` as aliases. Preserve the port. Use a project root or `/*` for the whole project, a pathname for one Page, and query or hash for one View State.

## Intake without payload waste

Start with `read_annotations` for one Watch ID or an explicit URL scope. Its Survey summary contains the selector, comment, compact styles, Target context, and source identity normally needed to locate the source. Call `inspect_annotations` only when layout, cascade, placement, ancestry, or source identity remains ambiguous. Retrieve screenshots only when visual evidence is necessary.

## Keep a Watch request alive

When the user asks to watch Waypoint, treat Watch as a standing responsibility until the user ends it or the requested terminal condition occurs.

If the harness can run a background command and surface incremental output, start `waypoint watch <url> --json`. Each line is a complete current snapshot of Pending and Claimed IDs in that URL scope; `changed_ids` highlights Pending Annotations edited since the previous result. Read a selected ID with `read_annotations` for Survey context before claiming and editing. Watch stays running across results and is quiet on empty waits; stop it when the user ends the watch or its requested terminal condition occurs. Restarting it shows current open work again.

If background output is unavailable, use `waypoint watch <url> --json --once` to read current open work after resolving or releasing work, after creating a Variant Set, when the user returns from Variant review, and before the final handoff. A host that can keep a command running may continue monitoring its output during the active review.

Watch observes work; it does not own it. Select Pending IDs from the latest snapshot, read their Survey context, and state clearly when watching has ended. The CLI-only detailed `--events` stream supports cursor resumption; deduplicate its events by Annotation ID and revision and reconcile them with current state before editing. Starting `--events` without a cursor replays full history.

## Own work before editing

Claim a Pending Annotation immediately before changing source. Claiming after an edit can still succeed, but forfeits the concurrency protection: another agent may have claimed or implemented the same request meanwhile. Never overwrite an active Claim owned by someone else.

The same owner may claim again to refresh expiry. Reclaim immediately before a later source mutation when a long review may have outlived the Claim. Human Variant review alone does not justify keeping a Claim alive.

## Finish the lifecycle

After implementation and proportionate verification, resolve the Annotation. Release it when blocked so another agent can continue. Discard only when the user intentionally rejects the request.

Ordinary Annotations resolve without a Resolution Record. Design Actions require the structured Resolution Record requested by the tool schema.

## Variants

Variant cancellation is a user decision, not lost work. Watch can publish `change_type: "variant_cancelled"`; a previously known unresolved Variant Set that returns to Pending without `variant_request` means the same thing. Remove temporary Variant Scaffold and do not recreate candidates until the user authors new Variant Intent.

Finalize only the chosen Variant, clean the other implementations and Scaffold, then complete the Annotation lifecycle.
