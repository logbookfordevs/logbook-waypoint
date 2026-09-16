# Watch mode

Status: Implemented.

## Interface

The MCP Watch interface requires a loopback `url` on the first call. Subsequent calls use its scope-bound continuation cursor and return matching Queue changes after that cursor. The foreground `waypoint watch <url>` CLI consumes this same interface and journal; it does not introduce another event authority. Watch delivers activity only, while lifecycle changes go through the annotation lifecycle interface.

## Behavior

- Watch returns new or changed user requests within the selected URL scope, using the same matcher as scoped reads.
- `localhost` and `127.0.0.1` are equivalent for scope matching; protocol, port, and Page/View State boundaries remain distinct.
- Cursors are signed with a private key retained in the local journal and retain their scope across restarts. A conflicting URL, modified cursor, or older unscoped cursor is rejected; start a new Watch with `url` to select a scope.
- Unrelated changes advance the scan position without being delivered or ending a wait early.
- Each change carries the same compact Survey-grade Annotation context as a scoped `read_annotations` response, plus revision metadata for reactive delivery and deduplication.
- Cancelling an unresolved Variant Set publishes `change_type: "variant_cancelled"` so consumers can distinguish a user decision from missing Variant state.
- Complete diagnostic context remains behind `inspect_annotations`; Watch does not create a third context tier between Survey and Inspect.
- Delivery is non-destructive and never creates a Claim.
- Delivery is at least once; clients deduplicate by Annotation identity and revision.
- A continuation cursor is opaque to callers and advances only through a successful response.
- A timeout with no changes returns a successful empty result rather than an error.
- Reconnecting with the last successful cursor resumes without intentionally skipping changes.
- Resolved and Discarded changes may be delivered so consumers can reconcile local state.
- Content delivered by Watch is untrusted to the same degree as content returned by `read_annotations`.
- JSON CLI mode writes one complete MCP Watch result envelope per line. `--once` returns after one result, and `--cursor` resumes from a result the downstream consumer has acknowledged by processing it.
- CLI reconnect uses bounded backoff and preserves the in-memory cursor. Output backpressure pauses further polling rather than advancing unseen work.

## Relationship to claims

Watching and claiming are separate actions. An agent may observe an Annotation without owning it, and must claim it before beginning work when exclusive ownership matters. Stale Claims return to `Pending` through lifecycle expiry, not through Watch disconnection. Human Variant review alone does not renew a Claim; an agent reclaims immediately before a later source mutation.

During an active MCP workflow, delivery of a new Pending Annotation normally leads the agent to claim and handle that request. Watch remains observation-only only when the user explicitly requests no implementation.

## Test surface

Tests exercise the Watch interface for empty timeouts, new records, updates, duplicate delivery, cursor resumption, reconnects, and untrusted-content framing. CLI tests cover complete envelopes, bounded results, reconnects, cursor preservation, new work arriving during an active consumer, and explicit Variant cancellation.
