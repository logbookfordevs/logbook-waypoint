# Pixi lab — screening record

Cut: The living field note. Alternate-universe experiment, not a production replacement or final creative acceptance.

## Evidence

- [Playable GPU cut recording](./evidence/pixi-cut-gpu.webm), 1440 × 960 Chromium, captured at 20 fps. Includes the real authored Annotation leg, indefinite hold, note editing and Queue transition.
- [Opening](./evidence/desktop-opening.png), [ink in flight](./evidence/ink-in-flight.png), [Annotation](./evidence/desktop-annotation.png), [pinned note](./evidence/desktop-pinned.png), [Queue](./evidence/desktop-queue.png).
- 375 × 812 responsive coverage: [Annotation](./evidence/mobile-annotation.png), [editable note](./evidence/mobile-pinned.png), [readable Queue](./evidence/mobile-readable-queue.png), [context-loss fallback](./evidence/mobile-context-loss.png).
- [Performance summary](./evidence/performance-summary.json), [compressed development trace](./evidence/gpu-trace.json.gz).

## Verified

- Website TypeScript check passes: `pnpm --filter @logbookfordevs/waypoint-website check`.
- All five focused tests pass: `pnpm --filter @logbookfordevs/waypoint-website exec vitest run components/pixi-lab/pixi-lab.test.tsx --maxWorkers=1`.
- Tests cover retaining edited intent into Queue, nonempty/pinned submission gating, skip/replay race safety, reduced-motion direct entry without GPU creation, unavailable GPU startup, and same-document hash navigation.
- GPU canvas verified present before recording the successful cut. Browser screening found and fixed missing explicit `pixi.js/prepare` registration; the initial fallback-only take was discarded.
- Natural authored travel holds at Annotation and requires fresh input for Queue. Edited note retained exactly.
- At 375 px, document width equals viewport width; no horizontal overflow. Native scrolling exposes the full note and controls.
- Reduced-motion keyboard submission verified: edited note retained, `data-simple=true`, zero Pixi canvases.
- Deliberate `WEBGL_lose_context` recovered to the readable Annotation workflow. No browser page errors reported.
- Queue axe WCAG 2 A/AA audit: zero violations; one incomplete contrast check covering ten nodes over translucent material. Screenshots manually reviewed for legibility; this is not comprehensive accessibility certification.
- Shared QA lock acquired atomically after Theatre release. Browser `pixi-lab-9549` closed; preview exec session `24356` exited; no listener remained on 3021. Owner file removed and lock released. Three.js task notified directly.

## Performance and limits

DPR capped at 1.5; renderer capped at 30 fps. Geometry is cached at stable holds; only restrained tide/bearing motion continues. Texture uploads complete before the GPU journey gate opens. Hidden pages stop the private ticker; reduced motion does not create it.

Development trace: p95 animation callback 0.612 ms, p99 0.771 ms. Raw maximum 233.565 ms includes 232.6 ms of `CpuProfiler::StartProfiling` instrumentation. A separate 64.62 ms callback and six tasks above 50 ms remain in the trace. Recording and development instrumentation were active; this is not physical-device frame-pacing proof. Do not call the cut production-performance ready.

No physical mobile or Safari profiling. No production build or global test suite was run. Existing website has no lint script; TypeScript and focused behavior tests are the code checks. Voice is implemented as an opt-in companion using the existing asset; audio output/mix was not auditioned in this screening. Existing atlas/ink plates retain original generated-asset lineage in the canonical asset ledger. The local reference MP4 was unavailable.

## Creative departures

The coastline is faintly present at entry, rather than waiting for canonical blank-paper clearance. Live Pixi paint masks, material impact, stippled route, slow camera change, and subtle tide marks animate the authored atlas. The visitor writes a real demo note and sees it retained in a ruled Queue. Explicit buttons replace scroll triggering. This cut stops at the coding-agent handoff; it sends no data and executes no agent work.

## Restart

From `/Users/leonardo/.codex/worktrees/9549/logbook-waypoint`:

```sh
pnpm --filter @logbookfordevs/waypoint-website dev --hostname 127.0.0.1 --port 3021
```

Open `http://127.0.0.1:3021/labs/pixi`. While the parallel labs remain active, first follow `/private/tmp/waypoint-lab-qa-protocol.md` and acquire the shared lock atomically. No preview has been left running.

Recommended next move: screen this alternate cut for creative comparison. No production integration is implied.
