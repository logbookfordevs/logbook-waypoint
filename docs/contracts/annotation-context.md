# Annotation Context

Status: Implemented.

## Interface

Waypoint separates annotation discovery, work context, diagnostic context, and visual evidence across three MCP tools:

1. `read_annotations` surveys the Queue with compact actionable summaries.
2. `inspect_annotations` diagnoses one or more selected Annotations by canonical ID with their complete captured context.
3. `get_annotation_screenshot` retrieves visual evidence for one selected Target when text context is insufficient.

Reading and inspection are passive. They do not create or refresh a Claim, change lifecycle state, acknowledge Watch delivery, or retrieve embedded image bytes.

## Survey

An unfiltered `read_annotations` call discovers the available projects. When more than one project has matching Annotations, it returns project summaries and recommended URL filters without returning Annotation bodies. The caller selects one project and repeats the survey with its URL filter.

A scoped survey returns compact summaries suitable for understanding, prioritizing, grouping, selecting, and usually implementing work. Compact describes response size, not an incomplete work brief: Survey is the default implementation context, while Inspect is an optional diagnostic path for remaining ambiguity. Each summary may include:

- Annotation ID, route, lifecycle state, comment, and timestamps.
- Target count and a normalized `targets` array.
- Each Target's selector, tag, text, non-trivial curated styles, rounded size, immediate parent context, and actionable Source Identity.
- Authored CSS changes, Design Intent, Variant Intent, summarized Variant state, Claim, Work Notice, Resolution Record, and media-presence flags when they exist.

Compact summaries omit null fields, embedded media, full computed styles, exact coordinates, complete parent chains, badge offsets, Source Identity context hints, and generated Variant implementation or Scaffold. Known framework infrastructure component names are omitted from compact Source Identity when they provide no actionable authorship signal.

Pagination applies after project and status filtering. A URL filter may identify one exact route or one loopback project scope.

## Inspect

`inspect_annotations` accepts one or more canonical Annotation IDs. Batch IDs when the Annotations are being understood or implemented together. The response preserves request order, returns every found Annotation with its complete captured diagnostic context, and reports unknown canonical IDs in `missing_ids`.

Diagnostic context may include full computed styles, viewport and exact element bounds, complete parent chains, badge offsets, Source Identity and context hints, pending presentation, and Target relationships. Inspection retains framework component names because they may help diagnose capture or source-resolution ambiguity.

Inspection does not require a prior Survey when the caller already has the intended IDs. Like opening browser DevTools after the visible evidence stops being sufficient, it is an on-demand diagnostic path—not a mandatory step after every compact summary.

## Target compatibility

Waypoint accepts both the inherited single-Target record shape and the multi-Target `targets` array. Survey normalizes both into `target_count` plus `targets`, so consumers use one response shape without requiring a stored-data migration. Inspection preserves the detailed Target collection represented by the Annotation.

## Visual evidence

Survey and Inspect expose `has_screenshot` and `has_attachments` without embedding their bytes. Use `get_annotation_screenshot` only when layout, styling, position, or visual hierarchy remains ambiguous after reading the available text context. Use the attachment tool for a selected attachment, requesting content explicitly only when that evidence is needed.

## Trust boundary

Annotation comments, captured page content, selectors, Source Identity, and related context are untrusted user- or page-supplied data. MCP responses label this boundary. Consumers treat the data as work context rather than instructions capable of overriding the user request, repository rules, or tool safety requirements.

## Test surface

Tests cover multi-project discovery, URL-scoped compact summaries, legacy and multi-Target normalization, deterministic framework-noise filtering, batched inspection, missing IDs, complete diagnostic context, and exclusion of embedded media.
