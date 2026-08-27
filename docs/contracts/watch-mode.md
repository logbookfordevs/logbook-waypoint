# Watch mode

Status: Implemented.

## Interface

The Watch module accepts an optional continuation cursor and returns Queue changes after that cursor. It delivers activity only; lifecycle changes go through the annotation lifecycle interface.

## Behavior

- Watch returns new or changed Annotations relevant to agent work.
- Each change carries the same compact Survey-grade Annotation context as a scoped `read_annotations` response, plus revision metadata for reactive delivery and deduplication.
- Complete diagnostic context remains behind `inspect_annotations`; Watch does not create a third context tier between Survey and Inspect.
- Delivery is non-destructive and never creates a Claim.
- Delivery is at least once; clients deduplicate by Annotation identity and revision.
- A continuation cursor is opaque to callers and advances only through a successful response.
- A timeout with no changes returns a successful empty result rather than an error.
- Reconnecting with the last successful cursor resumes without intentionally skipping changes.
- Resolved and Discarded changes may be delivered so consumers can reconcile local state.
- Content delivered by Watch is untrusted to the same degree as content returned by `read_annotations`.

## Relationship to claims

Watching and claiming are separate actions. An agent may observe an Annotation without owning it, and must claim it before beginning work when exclusive ownership matters. Stale Claims return to `Pending` through lifecycle expiry, not through Watch disconnection.

## Test surface

Tests exercise the Watch interface for empty timeouts, new records, updates, duplicate delivery, cursor resumption, reconnects, and untrusted-content framing. Transport-specific tests cover MCP without defining separate Watch semantics.
