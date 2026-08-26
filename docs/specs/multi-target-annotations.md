# Multi-Target Annotations

Status: Approved design checkpoint.

## Problem Statement

A single piece of feedback can apply to several places on the same page. Today, the user must create a separate Annotation for every Target, duplicating the comment and fragmenting the Queue, claim, lifecycle, and resolution. The product needs a fast way to identify several related Targets while preserving enough context for an agent to understand and act on each location.

## Solution

The first Shift-click starts a persistent Multi-Target selection mode on the current exact page URL. The user can release Shift; regular clicks then toggle between two and eight unique Targets. A compact tray shows the selected count and offers **Annotate** and **Cancel**. Temporary pins display the final selection-order ordinals immediately.

Annotating opens the shared composer near the selection tray and creates one Annotation that owns a Target Set. The Annotation has one shared comment, Design Intent, attachment collection, Queue entry, claim, lifecycle, and resolution. Every Target retains its own portable identity, element context, Source Identity, badge offset, and cropped screenshot.

Multi-Target Annotations are feedback-only in v1. Element edits such as shared copy, visual, or CSS changes are not available across a Target Set.

If a saved Target cannot currently be resolved, it remains part of the Annotation and is shown as unavailable. The product must not silently remove it or block access to the rest of the Target Set.

## User Stories

1. As an annotator, I can Shift-click once to enter Multi-Target selection mode so I can describe one issue that appears in several places.
2. As an annotator, I can release Shift and use regular clicks to add or remove Targets while that mode remains active.
3. As an annotator, I can see how many Targets are selected before creating the Annotation.
4. As an annotator, I can cancel the selection without creating or changing an Annotation.
5. As an annotator, I can start a shared Annotation once at least two Targets are selected.
6. As an annotator, I cannot add more than eight Targets to one shared Annotation.
7. As an annotator, I cannot combine Targets from different page URLs.
8. As an annotator, I can add one shared comment for the whole Target Set.
9. As an annotator, I can add one shared Design Intent for the whole Target Set.
10. As an annotator, I can attach supporting material once for the whole Target Set.
11. As a Queue user, I see one item for the shared Annotation rather than one item per Target.
12. As a collaborator, I claim the shared Annotation once.
13. As a collaborator, I change the lifecycle state of the shared Annotation once.
14. As a collaborator, I resolve the shared Annotation once.
15. As an agent, I receive the full context and screenshot for every Target in the set.
16. As a collaborator, I can still use the available Targets when one saved Target no longer resolves.
17. As a collaborator, I can see that an unresolved Target remains part of the original feedback.
18. As an existing user, my single-Target Annotations continue to work without migration work from me.
19. As an integration user, I can export, import, synchronize, read, and watch a Multi-Target Annotation without splitting it into separate records.
20. As an annotator, I continue to create a normal single-Target Annotation with the existing non-Shift interaction.
21. As an annotator, I can return from the composer to edit the Target selection without losing my draft.
22. As a collaborator, I see one shared composer for the complete Target Set without per-Target message navigation.

## Implementation Decisions

- The canonical model is one Annotation owning an ordered `targets` array. One item represents an ordinary Annotation; two or more form a Target Set.
- All newly written Annotations use the array model. A compatibility reader normalizes legacy scalar Target data into a one-item array; the legacy shape does not remain a second internal model.
- A Target Set contains two to eight unique Targets from the exact same page URL.
- The first Shift-click enters persistent Multi-Target selection mode. Shift can then be released and regular clicks toggle Targets until **Annotate** or **Cancel**.
- Target ordinals follow selection order and are persisted. Temporary selection pins preview `a`, `b`, `c`, and so on before save.
- Selection is represented independently from the Annotation composer. The compact tray exposes the count, **Annotate**, and **Cancel**.
- The composer opens near the selection tray. **Edit selection** returns to selection mode without losing comment, attachments, or other draft state.
- Escape from the composer returns to selection. Escape from selection exits the flow, asking for confirmation only when draft content would be lost. Closing inspection or changing URL follows the same confirmation rule.
- A ninth click leaves the existing eight Targets intact and briefly explains the limit.
- Annotation-level data is shared: comment, Design Intent, attachments, Queue identity, claim, lifecycle, and resolution.
- Target-level data is preserved independently: portable selector identity, element context, Source Identity, badge offset, and cropped screenshot.
- Multi-Target Annotations do not expose Element edits in v1.
- A Target that cannot be resolved is retained as unavailable. Resolution failure never mutates the persisted Target Set.
- Saved Target Set membership is immutable in v1.
- All pins share one Annotation number with Target ordinals, such as `12a` through `12c`; the next Annotation is `13`.
- Opening from a clicked pin or Queue opens the same shared Annotation composer. All resolvable Targets are outlined with equal emphasis.
- The composer does not expose previous/next navigation or per-Target message steps; one message always applies to the complete Target Set.
- Unavailable Targets retain their ordinal in persisted data and do not block opening the shared Annotation through an available Target.
- Queue rows lead with the shared comment and a compact Target count.
- Clipboard and Markdown export write shared feedback once, followed by ordered Target sections.
- Import, sync, and agent read/watch surfaces treat the Target Set as part of one Annotation rather than duplicating it into several records.

## Testing Decisions

The primary test seam is the rendered extension interaction: simulate Shift-clicking Targets, inspect the selection tray, save the Annotation, and reopen it through the public DOM, event, and storage behavior. This protects the user workflow without coupling the test to component internals.

A second contract seam covers the portable Annotation boundary: create, validate, export, import, synchronize, read, and watch one Annotation containing a Target Set. This protects compatibility across the extension and server boundary.

The acceptance suite must cover:

- Existing non-Shift single-Target creation remains unchanged.
- Two through eight unique Targets can be selected and persisted.
- After the initial Shift-click, regular clicks toggle Targets without duplicating them.
- A ninth Target and a Target from another page URL are rejected without corrupting the current selection.
- Cancel leaves no persisted Annotation or partial selection state.
- Every saved Target retains its own context, Source Identity, offset, and screenshot.
- Ordinals follow selection order, persist across round-trips, and consume one Annotation number.
- **Edit selection** preserves the composer draft, and layered Escape confirms only when content would be discarded.
- Opening from a pin and Queue chooses the correct contextual initial focus.
- All resolvable Targets are highlighted equally while one shared composer remains visible.
- Claim, lifecycle changes, Queue delivery, watch delivery, and resolution occur once per Annotation.
- Queue summary and ordered Target-section export represent the shared Annotation once.
- Export/import and synchronization round-trip the complete ordered Target Set.
- Legacy single-Target Annotations continue to round-trip.
- Newly created single-Target Annotations use a one-item `targets` array.
- An unavailable Target remains persisted and does not prevent access to available Targets.

## Out of Scope

- Applying visual, copy, CSS, or other Element edits across multiple Targets.
- Target Sets spanning different page URLs.
- More than eight Targets in one Annotation.
- Modeling the feature as linked per-Target Annotations.
- Separate claims, lifecycle states, or resolutions per Target.
- Automatically removing unavailable Targets.
- Editing saved Target Set membership.
- Recovering an unfinished Multi-Target draft after a full page reload.

## Further Notes

The design tree was reviewed to completion on 2026-08-26. No product decisions remain open for the v1 implementation boundary.

The current implementation estimate is four to six focused workdays for v1. This is a medium feature touching annotation creation, badges, Queue presentation, portable contracts, and synchronization; it is not a rewrite.
