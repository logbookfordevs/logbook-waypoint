# Waypoint Theatre lab — The marked page

Status: authorized alternate-universe playable cut; not canonical production or final acceptance.
Scope: isolated `/labs/theatre`, authored hero → Annotation → Queue threshold. No extension/server changes, push, merge, or publish.

## Direction contract

THESIS: A visual observation becomes a retained work record through one continuous paper edit. The specimen itself carries the proof.

OWN-WORLD: Driftwood paper, dark Ocean type, rust target marks, verdigris Queue. Poppins constructs the page, Literata tells the story, Plex Mono identifies retained context. Existing chart plate supplies material; crisp SVG supplies editorial marking.

STORY: See a page that could be better, mark its action, keep the observation and target together, send that same record toward a coding agent.

FIRST VIEWPORT: Oversized left-aligned promise on the left; an angled specimen page and chart fragment on the right. Immediate installation-guide link in the masthead. A quiet transport below the stage invites the first shot.

FORM: Code-led authored editing desk, explicitly assigned Theatre.js/DOM/SVG medium. No randomized concept seed: user authorized autonomous reinterpretation. Signature interaction: marking the specimen freezes the frame, then its annotation travels into a ledger as the page recedes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Edit and authority

Theatre.js 0.7.2 owns camera, page pose, image aperture, annotation trace, note reveal, ledger reveal and playhead. Two authored ranges: 0–10 seconds discovery, hold; 10–16 seconds transfer, hold. A scrub rail exposes the edit for comparison. Fresh action is required at Annotation. Pause/skip/replay cancel current playback. Reduced motion uses discrete stable frames and a readable transcript. Hidden tabs pause; resume is explicit.

Sound is opt-in. Existing 7.94-second grandfather narration enters at 1.5 seconds and follows the sequence position. Muting, pausing, seeking and route disposal stop/synchronize the same media element. Silence preserves all meaning.

## References and departures

Read canonical notebook, treatment and asset ledger, plus chart reference notes. The canonical SVG rejection is contextual; this lab explicitly explores SVG as precise editorial notation, not a replacement for material ink. Borrow the authored depth and breathing room described by The Boat; no live browser study of its animation claimed. Local map MP4 is missing.

Chart image: existing `public/ink-route/chart-world-desktop-v1.webp`, original project generation, provenance and prompt in canonical asset ledger. Narration: existing `waypoint-annotation-narration-grandpa-pace-0.92x-take-01.mp3`, user-supplied ElevenLabs Spuds Oxley take, source in canonical notebook. Both remain lab source assets with inherited final-rights caveats. No new media generated.

## Coverage and budgets

Desktop master 1440×1000; mobile 390×844 repositions the specimen below copy. Semantic HTML remains useful without enhancement; a readable transcript contains Annotation → Queue → agent truth. No WebGL, continuous idle loops, external media, or automatic sound. Opening chart asset ~384 KiB; Theatre dynamically loaded. 16 seconds of motion maximum before an indefinite hold. Desktop browser evidence does not establish physical-mobile or Safari performance.

## QA coordination

Read `/private/tmp/waypoint-lab-qa-protocol.md`. Atomically acquire the shared lock before preview, browser, build or large tests. Stop owned processes before release. Restart on port 3023 only when free and under the same protocol.

## Light validation — 2026-09-19

- Website `check` script passed (`tsc --noEmit`). Sandbox pnpm initially tried to reconcile a different dependency-store configuration; the authorized store-aware invocation completed and the check passed. A direct workspace TypeScript invocation also passed after lifecycle changes.
- Three focused Vitest tests pass against real Theatre: checkpoint reconstruction after reverse seek, next-destination selection, and a manually ticked first-leg playback that stays at Annotation even after extra clock time.
- `git diff --check` passes. No website lint script exists in the baseline; do not label typecheck as lint.
- Impeccable detector ran once. Findings are advisory palette/type-ramp differences for this deliberate lab composition; inherited production tokens remain unchanged. Small specimen-page typography belongs to the illustrated example, not the reading transcript.
- Shared QA queued through coordinator: Editorial/Motion → Theatre → Pixi. No browser or preview has been started while another owner holds the lock.

## Quality bar and authority clarification

The assigned medium is Theatre.js with DOM/SVG, not an open choice of renderer or project identity. The user explicitly instructed: “Freely reinterpret the storyboard, composition and interaction for your medium” and “Record a concise direction then proceed autonomously to a crafted playable cut.” That overrides a new concept tournament/seed approval gate for this bounded lab. No seed or separate comp approval is claimed.

QUALITY BAR — The marked page: A material paper editing desk with exact typography, three readable compositions, and an unbroken identity from marked target through retained comment. Every motion must clarify that handoff. The same note should visibly travel before merging into the ledger, not simply disappear during a cut. Wide framing earns the close-up. Mobile can be taller, but playback and checkpoint continuation remain reachable while viewing the action. The Boat supplies authored rhythm and continuity ambition; this lab does not claim its illustrated cinematic scale. The comparison question is whether a source-authored Theatre score makes the editorial handoff more intelligible and re-editable than the canonical map camera.

## Screening evidence and remaining confirmation

Initial cut: desktop 1440×1000 and mobile390×844 tested in isolated `theatre-lab-992d`, including natural arrival/hold, Queue departure by keyboard, deep-link checkpoints, reduced-motion readable cut, no horizontal overflow, and sound opt-in/pause. Axe reported zero WCAG A/AA violations; three contrast nodes in the transformed specimen required manual review. Browser errors were empty. Production build succeeded before the final reviewer fixes. Final source TypeScript and three focused tests pass.

The finish review requested a continuous note transfer, mobile controls within reach, relocation of specimen coordinates and replacement of a Unicode arrow. Those are implemented. The new desktop handoff capture shows the same note moving onto the ledger. Mobile persistent control and final Queue endpoint still require recapture after a long interruption terminated the QA session. Reviewer disposition: **recapture**, not final approval.

Evidence lives in repo-local `.impeccable/review/`: `theatre-cut.webm` is the valid initial-cut motion recording; `desktop-handoff.png` shows the latest transfer. `desktop-opening.png` and `desktop.png` are latest; mobile screenshots and `desktop-queue.png` predate the final fix batch. `theatre-cut-final.webm` was interrupted and is not screening evidence. Performance trace before fixes: 3 tasks >50ms, maximum119.708ms; animation callback maximum0.699ms. This development-browser trace is not a physical-device performance claim.

Cleanup after interruption: isolated browser closed, no port3023 listener, exec5204 no longer running. Removed only Theatre's owner.txt and rmdir'ed the shared lock; notified Pixi and coordinator. Final recapture requeued after existing labs. No server/browser remains running for this task.

Restart (after acquiring the shared lock and confirming3023 free): `pnpm --filter @logbookfordevs/waypoint-website dev --port 3023 --hostname 127.0.0.1`; visit `/labs/theatre`. Direct checkpoints: `?shot=annotation` and `?shot=queue`. Scope remains uncommitted, unpushed, unpublished; extension/server source untouched.

## Final lab handoff — 2026-09-19

The queued recapture is complete. Current `desktop-queue.png`, `mobile.png`, `mobile-queue.png`, and `mobile-readable.png` were captured after the last fix batch, opened and verified. `desktop-handoff.png` demonstrates the same note traveling onto the ledger. The final production build and its TypeScript phase pass; all three focused tests pass. Browser console errors were empty. The initial motion recording remains honestly labeled as preceding the final transfer/control refinements.

Independent verdict: **fix**, scoped to six findings. Five visual/evidence findings resolved: continuous transfer, mobile transport, coordinate placement, drawn browser icon and quality-bar evidence. One workflow finding remains: no Impeccable concept roll was run. This was an assigned-medium, explicitly autonomous ADF lab, and no retroactive seed or creative approval is fabricated. The record preserves that process departure; it is not an implementation blocker or claim of whole-surface creative acceptance.

All owned resources were cleaned up after recapture: browser `theatre-lab-992d-final` closed; preview PID76719 terminated; exec98696 exited143; no3023 listener; final build completed; own owner.txt removed and shared lock directory released. Coordinator notified. No commit, push, merge or publish.

Remaining evidence limits: no physical-mobile/Safari screening; no new material-video study because the local MP4 is missing; no final human creative acceptance. No website lint script exists in this repository baseline. These are not described as passed checks.

Lab system documentation: [DESIGN.md](./DESIGN.md) and [design.json](./design.json). Canonical identity/system documents and production notebook are unchanged.

## Preservation authorization — 2026-10-02

Leonardo explicitly authorized a dedicated recovery branch, commit and upstream push. This supersedes the earlier no-push boundary only for preservation; merge, deployment and worktree deletion remain outside scope. Source, dependency lock, scoped documentation, final screenshots and the honestly labeled initial-cut recording are included. Reused runtime assets are already tracked in the base history. Recovery instructions and local-only exclusions: [recovery manifest](../../../references/waypoint-theatre-lab/README.md).
