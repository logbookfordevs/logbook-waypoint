# Pixi lab — The living field note

Status: alternate-universe playable cut; autonomous hero → Annotation → Queue transition explicitly authorized on 2026-09-19. No canonical production approval is changed. No push, merge, or publication.

## Direction

A field atlas is written by an observation. Ink wakes a painted coastline, a precise note lands on a living page, and that same note crosses the chart into an orderly queue. The visitor performs the product truth: Annotation → retained Queue → coding agent. The cut ends at the handoff threshold, with no simulated agent execution.

Poppins is the instrument, Literata the storyteller, IBM Plex Mono the coordinates. Driftwood Paper, Signal Rust, Verdigris, and Deep Ocean preserve Logbook identity. Immediate setup/documentation access stays available.

## Shot and medium

- Opening: large editorial promise on quiet paper, faint atlas at the edge.
- Depart: user triggers a six-second authored ink leg. Organic overlapping paint masks expose the authored plate; stippled dashes and density texture carry the traveling mark. Skip is always available.
- Annotation: hold indefinitely. A real editable local demo note, anchored to a sample button, makes the action concrete.
- Queue: fresh explicit input carries the same note into a ruled field ledger. End with coding-agent handoff explained, not executed.

PixiJS v8 owns the GPU scene and a single timeline. Live DOM owns all content, focus, input, and product state. Existing generated-and-finished chart and ink assets are reused from `public/ink-route`; provenance stays in the canonical asset ledger. The master uses live masks, camera travel, stippled ink and ambient chart bearings; the static cut retains the full interaction. Existing narration is optional and user-initiated.

This deliberately departs from canonical blank-paper clearance and remembered CTA impact: an already faint coastline serves as an invitation; the visitor then actively authors the note rather than only watching it. No scroll hijacking. Buttons give fresh-input gates, replay, skip and keyboard/touch parity.

## Engineering budget and lifecycle

One local route `/labs/pixi`; only website code and website dependencies. DPR capped at 1.5; one selected chart composition plus density plate, approximately 12 MiB decoded textures. Target 33 ms frames with no multipass postprocessing. Late/inaccessible GPU initialization falls back to authored static art. Pause rendering/audio while hidden; tear down the private Pixi application on unmount. Reduced motion uses discrete states and no GPU animation. Performance/device claims await screening.

## References and evidence

- Canonical [director notebook](../../waypoint-ink-route/production/director-notebook.md), treatment and asset ledger were read.
- `docs/references/waypoint-storybook-chart/README.md` and desktop representative art inspected.
- [The Boat](https://www.sbs.com.au/theboat/) is the ambition bar; page text was accessible but its motion has not been inspected in this task.
- Local MP4 was not accessible.
- [Pixi Application documentation](https://pixijs.com/8.x/guides/components/application) checked for async startup and lifecycle.
- Shared QA protocol read. Acquire atomic `/private/tmp/waypoint-lab-heavy-qa.lock` before any preview or browser operation. Never take another lab's slot.

Next creative decision: screen this alternate cut; no production integration implied.

## Completed lab screening — 2026-09-19

Playable cut implemented at `/labs/pixi` and screened on desktop and 375 px Chromium. See [screening record](./screenings.md) for exact captures, recording, checks, two browser-discovered fixes, performance limits, restart command and completed shared-slot cleanup. Five focused tests and website typecheck pass. This is a completed experimental batch; creative acceptance and canonical integration remain unapproved. No push, merge or publication.
