# Watch mode

Status: Implemented.

## Interface

`waypoint watch <url>` is the Watch interface. The CLI calls a local server route backed by the durable Watch journal, then reads canonical current state to emit lightweight open-work snapshots. It does not introduce another event authority. Watch delivers activity only, while lifecycle changes go through the annotation lifecycle interface. MCP exposes Read and lifecycle tools, but no Watch tool.

## Behavior

- Watch returns new or changed user requests within the selected URL scope, using the same matcher as scoped reads.
- `localhost` and `127.0.0.1` are equivalent for scope matching; protocol, port, and Page/View State boundaries remain distinct.
- Cursors are signed with a private key retained in the local journal and retain their scope across restarts. A conflicting URL, modified cursor, or older unscoped cursor is rejected; start a new Watch with `url` to select a scope.
- Unrelated changes advance the scan position without being delivered or ending a wait early.
- The optional `--events` stream carries compact Survey-grade Annotation context plus revision metadata for reactive delivery and deduplication. The default snapshot contains IDs and state; use `read_annotations` to get Survey context for a selected ID.
- Cancelling an unresolved Variant Set publishes `change_type: "variant_cancelled"` so consumers can distinguish a user decision from missing Variant state.
- Complete diagnostic context remains behind `inspect_annotations`; Watch does not create a third context tier between Survey and Inspect.
- Delivery is non-destructive and never creates a Claim.
- Delivery is at least once; clients deduplicate by Annotation identity and revision.
- A continuation cursor is opaque to callers and advances only through a successful response.
- A timeout with no changes returns a successful empty result rather than an error.
- Reconnecting with the last successful cursor resumes without intentionally skipping changes.
- Resolved and Discarded changes may be delivered so consumers can reconcile local state.
- Deletion publishes a change carrying the former scope and ID so consumers can refresh current state.
- Content delivered by Watch is untrusted to the same degree as content returned by `read_annotations`.
- The default CLI emits the current Pending and Claimed IDs on startup and after a relevant change, with one complete JSON snapshot per line in `--json` mode. `changed_ids` identifies Pending Annotations changed since the last output even when the ID/status index looks the same. The server reads the complete current Queue for each snapshot; the CLI stays quiet on empty waits.
- The CLI establishes a Watch position before reading the startup snapshot. Events that overlap that read can cause a harmless duplicate refresh; they cannot leave new open work unseen.
- `--once` returns after the first snapshot. `--events` retains the detailed change stream, including one-result `--once` behavior and explicit `--cursor` continuation; `--cursor` is available only with `--events`.
- CLI reconnect uses bounded backoff and preserves the in-memory cursor. Output backpressure pauses further polling rather than advancing unseen work.

## Relationship to claims

Watching and claiming are separate actions. An agent may observe an Annotation without owning it, and must claim it before beginning work when exclusive ownership matters. Stale Claims return to `Pending` through lifecycle expiry, not through Watch disconnection. Human Variant review alone does not renew a Claim; an agent reclaims immediately before a later source mutation.

During an active CLI Watch workflow, delivery of a new Pending Annotation normally leads the agent to claim and handle that request. Watch remains observation-only only when the user explicitly requests no implementation.

## Test surface

Tests exercise the Watch interface for empty timeouts, new records, updates, duplicate delivery, cursor resumption, reconnects, and untrusted-content framing. CLI tests cover complete envelopes, bounded results, reconnects, cursor preservation, new work arriving during an active consumer, and explicit Variant cancellation.
