# Variants

Status: Implemented in Phase 4.

## Interface

The Variant module exposes variant creation, activation, discard, and finalization. It owns Scaffold cleanup so extension and agent callers never manipulate temporary variant structure directly.

## Invariants

- A variant request belongs to exactly one Annotation.
- Every Variant has a stable implementation key and a human-readable name unique within that request.
- Creating a variant request activates one candidate before the request becomes visible.
- Exactly one Variant is Active while an unresolved request contains any Variants.
- Activating a Variant changes the presented candidate without resolving the Annotation.
- Discarding a Variant removes its implementation and any Scaffold used only by it.
- The Active Variant cannot be discarded without first activating another surviving Variant.
- Finalization preserves exactly one chosen implementation.
- Finalization removes every discarded implementation and all Scaffold.
- Discarding the owning Annotation is the explicit request-level discard: it atomically removes the unresolved request, every candidate presentation, and Scaffold metadata while retaining the Annotation as `Discarded`.
- An Annotation cannot become `Resolved` while variant Scaffold remains.
- Closing and reopening the editor for an unresolved variant Annotation restores the same Active Variant without introducing a lifecycle transition.

## Failure behavior

Variant operations fail without partial cleanup when their Annotation, implementation key, or expected Scaffold cannot be reconciled. A failed finalization leaves the Annotation unresolved and reports the remaining cleanup work.

## Test surface

Tests exercise the Variant interface through request, activation, reopening, discard, finalization, cleanup failure, and resolution gating. DOM structure and CSS class names are implementation details and are not the contract.
