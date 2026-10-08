---
version: 1
slug: "packages-website-app-page-tsx"
primary_target: "packages/website/app/page.tsx"
related_targets: ["packages/website/components/waypoint-home.tsx","packages/website/components/editorial-demo.tsx","packages/website/app/styles/homepage.css"]
---

# Homepage composition

Mode: Experience opening, continuing into Persuade.
Scope: Extend the official homepage using the approved main hero, OpenDesign map, and promoted Editorial Adventure. No Labs routes, hosting architecture, audio, or product workflows change.
Audience/job: Developers first encounter Waypoint through the ink map, then decide whether to install and connect a coding agent. Returning visitors can skip immediately to details, where Docs remains available.

## Direction contract

THESIS: A route becomes a field note. The ink map is the front door, not a hidden mode; its complete chart opens into a native-scroll product story and hands-on demonstration.

OWN-WORLD: Preserve the main Day Chart hero, ocean ink, rust direction, Poppins and Literata, Thelu artwork, and the approved map’s own material vocabulary. Promote Editorial's actual Driftwood Paper surface, tilted specimen, drawn brackets and retained note, not an approximation of the experiment.

STORY: Chart Annotation → Queue → agent → review, scroll onward into the hero, then make a sample mark and send it to a demo Queue. Close with local-first boundaries and setup links. Skip to details is the immediate escape route; Docs lives in the hero.

FIRST VIEWPORT: The approved map's ink landing and camera sequence starts on arrival. Skip to details stays visible, including loading and failure states; the duplicate Docs exit is omitted. Mobile uses a second row of checkpoint controls, preserving a clear exit without squeezing labels.

FORM: User-pinned composition extension; no concept seed applies. Inline map hands off to native scrolling at the full-route overview; More details and Skip to details focus the hero. Scrolling up restores the same chart, with explicit Replay inside the overview. Reuse Editorial's actual Motion choreography: staged copy, specimen tilt and departure, bracket draw, form arrival and exit, and shared-layout note transfer into the Queue. Preserve its timing and geometry; adapt only the standalone shell, heading levels, accessibility and demo wording.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Boundaries and verification

- Native document scrolling outside the map. Pause rendering offscreen/hidden, resume its retained state on return, and dispose on page unmount/context loss. Explicit continuation focuses the hero; scrolling alone does not steal focus.
- Editorial is official product content, not a Labs entry. It is illustrative, has no storage/network writes, and ends at the Queue without simulating agent implementation.
- Preserve existing assets and their provenance. No new raster work.
- The composition specification records desktop/mobile, keyboard, reduced-motion, no-WebGL, long-note, replay, early-exit and final-handoff evidence. Mobile is 390×844 viewport emulation; physical-device touch remains unverified.
- Sound effects and narration remain deferred to the final creative gate.

The earlier finish verdict is `ship` for the three scored fixes: zero-area GPU pause/resume, readable six-card context-loss fallback, and lazy-bundle failure preserving its exits. The later approved simplification removes duplicate Docs exits; Skip still leads to the hero and its Docs link. The verdict scores those earlier fixes, not a new whole-surface audit. Evidence lives under `.impeccable/review/journey-first-*`; behavior and validation details are in `docs/specs/homepage-composition.md`.

Documentation is complete for this composition extension. Root `DESIGN.md` and `.impeccable/design.json` remain the incumbent system; their pre-existing route, typography and sidecar drift is outside this pass. No new raster assets were introduced.
