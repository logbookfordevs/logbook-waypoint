---
name: update-changelog
description: Keep a repository changelog accurate, product-facing, and release-ready. Use when adding, reviewing, or cleaning unreleased entries or preparing release notes.
---

# Update Changelog

Maintain the repository's changelog through its existing structure and voice.
Inspect repository instructions, the changelog, recent releases, and the actual
change before writing. The local format is authoritative: preserve its filename,
unreleased heading, categories, links, ordering, and version conventions.

If no changelog or convention exists, ask before introducing one. If the project
explicitly generates release notes from another source, update that source.

## Rules

- Write for users, contributors, and upgrade reviewers, not for the implementer.
- Place unreleased work only in the repository's unreleased area. Released
  sections are immutable unless the task explicitly corrects historical data.
- Use the repository's categories. When it follows Keep a Changelog, place each
  change in exactly one of `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`,
  or `Security`.
- Describe the observable outcome and affected surface. Include migration,
  compatibility, deprecation, or security implications when readers must act.
- Do not add implementation receipts such as test runner migrations, helper extraction, CI plumbing, package-manager metadata, design-tool config, or refactor mechanics unless they affect installation, publishing trust, contributor workflow, or user behavior.
- Keep release or process notes only when they change what users or maintainers can rely on.
- If a feature is new, do not also describe it as a fix unless there was a specific broken behavior users already hit.
- Match the changelog's established tense, punctuation, link style, and entry
  granularity. Prefer one concrete sentence over labels copied from tickets.
- Preserve issue or pull-request references only when the changelog convention
  consistently uses them.

## Quick Check

Before finishing:

1. Verify every entry against the current behavior in code, documentation, or
   other primary project evidence.
2. Search the unreleased section and recent releases for duplicate coverage or
   contradictory wording.
3. Remove implementation-only receipts and claims the evidence does not prove.
4. Confirm each entry is in the correct section and states any reader action.
5. Inspect the final diff for formatting drift and unrelated historical edits.

Completion criterion: each changed entry is evidence-backed, appears once in
the correct unreleased location, follows local conventions, and tells its reader
what changed without requiring implementation context.
