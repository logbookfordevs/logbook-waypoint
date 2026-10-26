# Annotation lifecycle

Status: Implemented.

## Interface

The lifecycle module exposes creation, claiming, release, resolution, discard, and deletion through one consistent interface shared by HTTP, the agent CLI, and extension callers. Callers do not implement state transitions themselves.

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

- Reading an Annotation never changes its state.
- At most one active Claim exists for an Annotation.
- A Claim identifies its owner and expires after a server-defined inactivity period.
- Expiry or explicit release returns a claimed Annotation to `Pending`.
- Resolution is explicit and retains the Annotation as history.
- Discard is explicit and retains the Annotation as history.
- Discarding an Annotation with an unresolved Variant request atomically removes that request and its presentation before retaining the Annotation as `Discarded`; a persistence failure leaves both unchanged.
- Deletion is explicit permanent removal and is not a completion state.
- `waypoint resolve` is the agent completion operation.
- `waypoint delete` remains a separate destructive operation and requires `--yes`.
- Every state change is reflected in the next read of the Annotation.
- Resolving a Pending Annotation requires an explicit Claim first; there is no implicit claim-and-resolve shortcut.
- The same owner may refresh its Claim. A competing owner is rejected until release or server-defined inactivity expiry.

The server may persist an already-expired Claim as `Pending` immediately before serving a read request. That is lifecycle expiry maintenance based only on the injected server clock; the read adapter neither claims nor refreshes the Annotation.

## Test surface

Tests exercise the lifecycle interface, including rejected transitions, competing Claims, expiry, retained resolution, retained discard, and permanent deletion. HTTP, CLI, and extension adapters must demonstrate the same observable transitions without duplicating lifecycle rules.

## Implemented adapters

The lifecycle module is the only owner of state transitions and Claim expiry. HTTP exposes `claim`, `release`, `resolve`, and `discard` routes for an Annotation. The agent CLI exposes `waypoint claim`, `release`, `resolve`, and `discard`; `waypoint delete` remains separately described as irreversible removal. Extension storage and sync use the same four canonical states and migrate only legacy Waypoint records created before this contract.
