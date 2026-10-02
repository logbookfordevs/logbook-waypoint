# The Atlas of Small Changes — alternate-universe lab

## Authority and boundary

2026-09-19: the user explicitly authorized an autonomous alternate-universe Three.js / React Three Fiber experiment through Annotation and toward Queue. This is a separate lab, not a revision of the canonical Ink Route. No publishing, extension or server implementation changes. Route: `/lab/storybook`; preview port 3022.

## Direction

A physical, clothbound atlas makes feedback tangible. Layered cream pages, cut-paper topography, miniature trees, a rust observation marker, and a verdigris dispatch house inhabit one continuous world. A low, three-quarter establishing view gives way to a deliberate camera move into Annotation. The visitor writes a note and pins it. That same numbered note crosses the book's gutter toward Queue. The cut stops at retained context, with the coding agent named as the next recipient.

The visual departure is intentional: a populated physical book replaces the canonical empty-paper ink birth. Camera travel reveals scale and relationships. User-controlled viewing bearings allow inspection between beats. The world is made with authored procedural geometry and paper textures, not generic downloaded models. The established Poppins, Literata and IBM Plex Mono roles remain.

## Shot and interaction contract

- Overview: immediate Get Waypoint and Docs; open the atlas voluntarily.
- Annotation: authored approach, then indefinite hold; editable sample observation and Pin annotation button.
- Capture: rust marker plants; note identity WP-001 becomes visible.
- Queue: deliberate dispatch carries the marker over the gutter; verdigris depot and retained note show continuity. Agent receives context in the product story; no agent execution is simulated.
- Restart, skip motion, direct chapter controls, reduced motion, and a readable edition remain available.
- Semantic state owns the cut. R3F owns camera interpolation and 3D projection only. No autonomous orbit. Demand rendering stops at rest and pauses while hidden.
- Silent by default. Existing optional recorded narration can be enabled explicitly and stopped; text carries all meaning.

## Medium and budget

React Three Fiber and Three.js are explicitly assigned. No postprocessing, remote models or shaders. One procedural 1024-square paper atlas (4 MiB decoded), low-poly geometry, one shadow map, DPR capped at 1.5, on-demand rendering. A separate client chunk isolates the renderer from semantic content. Target: 60 Hz during travel; mobile and worst-frame performance require evidence. Readable edition avoids GPU rendering entirely.

The Boat supplies the bar for authored depth and spatial continuity. Existing storybook concept and chart plates supply material context. The requested Downloads video is missing. Canonical treatment/notebook/asset ledger read; their production restrictions are context rather than this lab's scope.

## Next decision

Screen the playable cut. This experiment has no creative approval or production adoption implied by implementation or technical checks.

## Implementation findings

- Treasures `3D WebGL` category inspected live: Three.js, React Three Fiber, Drei, Theatre.js, Spline, Babylon.js, PlayCanvas, model-viewer and React-Force-Graph. The assigned R3F/Three pair fits; no helper renderer or timeline was needed.
- Next.js local client-boundary and dynamic-import documentation read; R3F official Canvas/hooks documentation checked. Renderer is a separate browser-only dynamic chunk with a catch boundary and context-loss fallback.
- Five focused component regressions cover retained text and WP-001 identity, empty input, skip, direct Queue, reduced-motion flow, silent start, and restart. Scope is a simulated page-local interaction, not real Waypoint integration.
- Initial test invocation accidentally passed a separator that let Vitest run the 25-test website suite (1.37 s). Corrected invocation uses `exec vitest run components/storybook-lab/storybook-lab.test.tsx --maxWorkers=1`; subsequent runs use one worker. No browser, dev server, build, or render started while another lab owns the QA lock.
- Original Downloads video unavailable. Existing narration is reused only on opt-in. The narration is a companion from the canonical cut, not newly directed or synchronized to every 3D beat.

## Source references

- [R3F Canvas](https://r3f.docs.pmnd.rs/api/canvas): demand rendering, separate canvas, fallback.
- [R3F hooks](https://r3f.docs.pmnd.rs/api/hooks): renderer-owned frame projection and cleanup.
- [The Boat](https://www.sbs.com.au/theboat/): reference supplied by the user; text retrieval does not expose its rendered experience, so visual reference study relies on the supplied director's notes.

## Screening plan and restart

QA coordination order received from the director: Editorial/Motion → Theatre → Pixi → Three.js. Wait for Pixi task `01a0b7c0-9a6c-7ea2-8bd1-75237a81643a` to report cleanup, then acquire `/private/tmp/waypoint-lab-heavy-qa.lock` atomically. Do not race or remove another owner.

After ownership is recorded and port 3022 is free, from this worktree:

```sh
pnpm --filter @logbookfordevs/waypoint-website dev --port 3022
```

Open `http://localhost:3022/lab/storybook`. `#annotation` and `#queue` provide sample direct entry. Stop the browser session and this preview before releasing the lock. No server is intentionally left running at handoff.

Focused checks:

```sh
pnpm --filter @logbookfordevs/waypoint-website check
pnpm --filter @logbookfordevs/waypoint-website lint:lab
pnpm --filter @logbookfordevs/waypoint-website exec vitest run components/storybook-lab/storybook-lab.test.tsx --maxWorkers=1
```

All three passed at the pre-screening checkpoint (5 interaction tests). The extension and server importer entries in the lockfile remain unchanged. Visual evidence and mobile/browser findings will be appended after the coordinated screening.

## Final lab screening — 2026-09-20

**Status:** playable cut delivered for creative review; not production-approved. The gate authorized by the user is complete. Next move: screen this alternate universe against the other labs, then decide whether any idea earns further development.

### Rendered evidence

- [Final motion take](./evidence/journey-final.webm) — silent desktop capture of approach, pinning, and Queue transfer; actual 3D camera and note interaction.
- [Prologue](./evidence/prologue.png), [Annotation arrival](./evidence/annotation.png), [Queue](./evidence/queue.png).
- [375 px Queue](./evidence/mobile-queue.png).
- [Reduced-motion keyboard capture](./evidence/reduced-motion.png).
- [WebGL context-loss fallback](./evidence/context-loss.png).

Screenshots use Chromium at 1440 × 1000 and 375 × 812. The Next.js development indicator was hidden only for clean final captures. Earlier reduced-motion evidence retains the focus outline deliberately.

### Findings and corrections

The physical book, page strata, topography, miniature browser and dispatch depot carry the alternate direction. The annotation approach focuses attention, and Queue pulls back enough to make continuity legible. The route passes over a physical bridge across the gutter. A custom note remains WP-001 through the handoff. The final scene stops at Queue and names the coding agent as the next recipient; it does not pretend to run an agent.

Browser screening found and corrected: a fallback component effect that mounted inside the canvas even with working WebGL; low-contrast metadata; a Queue crop that crowded the caption; mobile perspective controls that overlapped copy; and whitespace lost when mobile line breaks collapse. The renderer now uses PCFShadowMap explicitly. One non-fatal Three.Clock deprecation warning originates in R3F's current internal clock; no page errors were reported.

- Final TypeScript, scoped ESLint, and all 5 focused component regressions pass.
- Browser exercises: custom note → pin → Queue; replay; automatic arrival/hold; keyboard activation and pinning; reduced motion with no canvas or camera delay; deliberate context loss removes the canvas and preserves the editable annotation.
- Mobile document width is exactly 375 px at a 375 px viewport; no horizontal overflow. The controls and caption are separate rows.
- Axe 4.12.1 WCAG A/AA: zero violations in desktop Queue and mobile Queue. Contrast involving the canvas background is reported as incomplete rather than automatically certified; the relevant heading and metadata remain dark on paper in inspected frames.
- Warm desktop travel trace: 310 animation-frame callbacks, max 4.47 ms, p95 3.79 ms; all measured FunctionCall events max 16.30 ms. Trace retained at `/private/tmp/waypoint-storybook-trace.json`. These are development-browser CPU timings, not a whole-frame/GPU or physical-mobile performance claim. The final Queue pullback slightly changes camera framing after that trace; renderer mechanisms are unchanged.
- Physical mobile, Safari, cold-start GPU spikes, and voice listening/mix were not screened. No production build was run. No push, merge, publish, or extension/server source changes.

### Cleanup and handoff

Acquired the shared lock after Pixi's explicit verified release. Owned browser: `waypoint-storybook-0c08`; preview exec session: `3240`; port: `3022`. Browser closed, preview exited after Ctrl-C, and `lsof` reported no listener on 3022. Recording/export finished before owner file removal and successful `rmdir`. Coordinator and Theatre received release notifications. No browser, server, or render job remains running for this lab.

## Recovery snapshot — 2026-10-02

Leonardo authorized preserving this experiment on `feat/lab-chartroom-diorama` for later validation, without merging or deleting the worktree. This supersedes the original no-push boundary for this preservation action only.

The branch includes the lab route, procedural 3D source, interaction tests, scoped lint configuration, dependency manifest/lockfile, this notebook, all six evidence screenshots, and the final motion recording. Reused chart imagery, narration, and the Waypoint mark are already tracked under `packages/website/public/`; there are no runtime assets that depend on this worktree's absolute path.

To recover in a fresh checkout of the branch, install dependencies with `pnpm install --frozen-lockfile`, then use the preview command above and open `/lab/storybook`. Coordinate the shared QA slot before running a preview if other labs are active on the same machine; historical task/session identifiers above are screening records, not current ownership.

The generated `.codex/environments/environment.toml`, installed dependencies, build caches, and TypeScript incremental cache are excluded from this snapshot. They are not required to recover the lab. The historical `/private/tmp/waypoint-storybook-trace.json` is no longer present as of this preservation check; its previously recorded measurements remain above, but the raw trace cannot be recovered from this branch. No other required lab asset remains only local.
