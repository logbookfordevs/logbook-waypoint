# Annotation lifecycle

Status: Accepted Phase 0 contract. The current implementation does not yet satisfy every rule below.

## Interface

The lifecycle module exposes creation, claiming, release, resolution, discard, and deletion through one consistent interface shared by HTTP, MCP, and extension callers. Callers do not implement state transitions themselves.

## States

An Annotation begins as `Pending`.

```text
Pending ──claim──▶ Claimed ──resolve──▶ Resolved
   │                  │
   │                  ├──release/expiry──▶ Pending
   │                  │
   └──discard──▶ Discarded ◀──discard────┘
```

- `Pending` is available for work.
- `Claimed` has one active Claim.
- `Resolved` records explicit successful completion.
- `Discarded` records explicit closure without implementation.
- `Resolved` and `Discarded` are terminal lifecycle states.

## Invariants

- Reading or watching an Annotation never changes its state.
- At most one active Claim exists for an Annotation.
- A Claim identifies its owner and expires after a server-defined inactivity period.
- Expiry or explicit release returns a claimed Annotation to `Pending`.
- Resolution is explicit and retains the Annotation as history.
- Discard is explicit and retains the Annotation as history.
- Deletion is explicit permanent removal and is not a completion state.
- `resolve_annotation` is the agent completion operation.
- `delete_annotation` remains a separate destructive operation.
- Every state change updates the Annotation so Watch can distinguish it from an older observation.

## Test surface

Tests exercise the lifecycle interface, including rejected transitions, competing Claims, expiry, retained resolution, retained discard, and permanent deletion. HTTP, MCP, and extension adapters must demonstrate the same observable transitions without duplicating lifecycle rules.

## Current gap

The MIT foundation primarily uses `pending` records and permanent deletion. Claiming, retained resolution, retained discard, and a dedicated resolution tool remain to be implemented.
