# Variants

Status: Implemented in Phase 4.

## Interface

The Variant module exposes Variant Set creation, activation, individual discard, whole-set cancellation, and Finalization. It owns Scaffold cleanup so extension and agent callers never manipulate temporary variant structure directly.

## Invariants

- A variant request belongs to exactly one Annotation.
- Every Variant has a stable implementation key and a human-readable name unique within that request.
- Creating a variant request activates one candidate before the request becomes visible.
- Exactly one Variant is Active while an unresolved request contains any Variants.
- Activating a Variant changes the presented candidate without resolving the Annotation.
- Discarding a Variant removes its implementation and any Scaffold used only by it without shrinking an unresolved set below two candidates.
- The Active Variant cannot be discarded without first activating another surviving Variant.
- Design Intent and its comment remain read-only while a Variant Set is unresolved.
- Cancelling an unresolved Variant Set removes every candidate, active presentation, and Scaffold while preserving its Annotation as `Pending`.
- Finalization preserves exactly one chosen implementation.
- Finalization removes every discarded implementation and all Scaffold.
- Cancelling a Variant Set and discarding its owning Annotation are distinct operations: cancellation preserves the Annotation as `Pending`, while Discard is terminal.
- An Annotation cannot become `Resolved` while variant Scaffold remains.
- Closing and reopening the editor for an unresolved variant Annotation restores the same Active Variant without introducing a lifecycle transition.

## Failure behavior

Variant operations fail without partial cleanup when their Annotation, implementation key, or expected Scaffold cannot be reconciled. A failed finalization leaves the Annotation unresolved and reports the remaining cleanup work.

## Test surface

Tests exercise the Variant interface through request, activation, reopening, individual discard, cancellation, Finalization, cleanup failure, persistence rollback, and resolution gating. DOM structure and CSS class names are implementation details and are not the contract.
