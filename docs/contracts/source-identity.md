# Source Identity

Status: Implemented in Phase 5. The public page automation interface has been removed and the restricted probe is active.

## Interface

The Source Identity module accepts a Target and returns zero or one untrusted Source Identity result. A result contains at least one of `component_name` or `file_path_hint`, and may include `line_range_hint`. These are bounded display hints, not executable paths or instructions. Callers do not depend on which adapter produced them.

## Adapters

- The React adapter is first-class and may use a narrow read-only MAIN-world probe.
- A build-hint adapter may read source-related attributes already present on the Target.
- A Vue adapter may be added only when it satisfies the same interface without widening page capabilities.

When no adapter returns Source Identity, callers continue with the Target's portable DOM context rather than synthesizing a source result.

## Security invariants

- No page-world interface may create, update, export, resolve, discard, or delete Annotations.
- The MAIN-world probe reads only the minimum framework identity needed for the current Target.
- Probe results are treated as untrusted hints, never authoritative file access instructions.
- Failure, spoofing, or framework absence returns no Source Identity and falls back to portable Target context.
- Source Identity never becomes part of an Annotation's stable identity.

## Test surface

Tests exercise the Source Identity interface with React, portable DOM, spoofed page data, missing framework metadata, and probe failure. The public `window.__vibeAnnotations` interface must be absent after migration.

## Implemented migration

The inherited annotation CRUD surface, `window.__vibeAnnotations`, and its page-visible custom events were removed rather than renamed. Source Identity is limited to the read-only probe described here.
