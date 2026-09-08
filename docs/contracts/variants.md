# Variants

Status: Implemented in Phase 4.

## Interface

The Variant module exposes Variant Set creation, atomic replacement, activation, individual discard, whole-set cancellation, and Finalization. It owns the stored candidate presentations and Scaffold references. Coding agents create and reconcile temporary source Scaffold in response to Waypoint's Keep or Cancel decision.

## Invariants

- A variant request belongs to exactly one Annotation.
- Every Variant has a stable implementation key and a human-readable name unique within that request.
- Every Variant has a browser-presentable implementation containing non-empty `pending_changes` and/or scoped `css`; arbitrary metadata cannot stand in for presentation.
- Structural alternatives may use temporary source Scaffold as long as each candidate is visibly selected through its Waypoint presentation.
- Creating a variant request activates one candidate before the request becomes visible.
- Replacing a Variant Set validates every new candidate before atomically swapping the complete set, preserves the original presentation, and keeps the previous set on failure.
- Exactly one Variant is Active while an unresolved request contains any Variants.
- Activating a Variant changes the presented candidate without resolving the Annotation.
- Discarding a Variant removes its stored presentation and exclusive Scaffold references without shrinking an unresolved set below two candidates.
- The Active Variant cannot be discarded without first activating another surviving Variant.
- Design Intent and its comment remain read-only while a Variant Set is unresolved.
- Cancelling an unresolved Variant Set removes every stored candidate, active presentation, and Scaffold reference while preserving its Annotation as `Pending`.
- Cancellation ends the current comparison; candidate revisions use replacement instead of cancellation.
- Finalization preserves exactly one chosen implementation.
- Finalization removes every discarded presentation and all Scaffold references.
- Coding agents remove temporary source Scaffold after Finalization or cancellation before completing the work.
- Cancelling a Variant Set and discarding its owning Annotation are distinct operations: cancellation preserves the Annotation as `Pending`, while Discard is terminal.
- An Annotation cannot become `Resolved` while variant Scaffold remains.
- Closing and reopening the editor for an unresolved variant Annotation restores the same Active Variant without introducing a lifecycle transition.
- An unresolved Variant Set remains openable from the Queue when its captured Target cannot be resolved.

## Failure behavior

Variant operations fail without partial record changes when their Annotation, implementation key, presentation, or expected Scaffold references cannot be reconciled. A failed finalization leaves the Annotation unresolved and reports the remaining record cleanup work.

## Test surface

Tests exercise the Variant interface through presentable request validation, activation, reopening with and without a resolved Target, individual discard, cancellation, Finalization, cleanup failure, persistence rollback, and resolution gating. DOM structure and CSS class names are implementation details and are not the contract.
