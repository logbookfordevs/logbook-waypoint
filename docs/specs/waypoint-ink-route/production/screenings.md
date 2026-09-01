# Ink Route Tracer — Screening Note

**Status:** Revision requested at cinematic screening on 2026-09-01. The build is retained as blocking and engineering evidence only; it is not an approved visual take.

**Cut / scene / tracer:** Responsive hero → blank Driftwood Paper → SVG proxy impact → dashed-route travel → first simplified Annotation checkpoint.

**Historical approved source it interprets:** [`shot-plan.md`](./shot-plan.md), the now-superseded [`technical-scout.md`](./technical-scout.md), and the approved Ink Route treatment. [`medium-scout.md`](./medium-scout.md) now governs the replacement tracer.

**Live build or recording:** Local implementation at `2e111a9` (`9241c19` tracer plus the mobile label-collision repair).

**Device / input / motion preference / fidelity tier:**

- Chromium at `1440 × 900`, pointer and keyboard, ordinary motion.
- Chromium at exactly `375 × 812` CSS pixels with CDP touch emulation (`maxTouchPoints: 5`, coarse pointer, trusted touch/pointer/click events), ordinary motion.
- Chromium at `1440 × 900`, `prefers-reduced-motion: reduce`.
- Muted, reverse-scroll, and direct `#annotation` paths exercised separately.
- Safari and a real iOS simulator were unavailable in this environment; `xcrun simctl` reported that Xcode may not be installed.

**Variants or compromises shown:**

- Take A — Quiet cut: `980 ms`, with the approved `360 / 180 / 170 / 270 ms` phase split.
- Take B — Held breath: `1280 ms`, with the approved `480 / 310 / 250 / 240 ms` phase split.
- Foley is procedural tracer audio, not final recorded or mastered sound.
- The browser screen recorder emitted video-only WebMs. The actual Web Audio output was therefore captured as a separate three-second stereo foley file rather than represented as an inaudible “sound recording.”
- The scene ends at Annotation. Queue, Agent, Resolution, full navigation, final assets, and postproduction remain absent by design.
- The director prefers the slower held-breath rhythm represented by Take B as a starting hypothesis. The exact `1280 ms` edit is not locked because representative material, camera, environment, and sound may change its perceived timing.

## Dailies

| Evidence | Exact path |
| --- | --- |
| Take A desktop pointer recording | `/private/tmp/waypoint-ink-route-take-a-desktop-pointer-sound.webm` |
| Take B desktop pointer recording | `/private/tmp/waypoint-ink-route-take-b-desktop-pointer-sound.webm` |
| Procedural impact / scratch / checkpoint foley | `/private/tmp/waypoint-ink-route-procedural-foley.wav` |
| Trusted-touch 375 px recording | `/private/tmp/waypoint-ink-route-375-touch-sound.webm` |
| Final 375 × 812 mobile composition | `/private/tmp/waypoint-ink-route-375-touch-native.png` |
| Desktop hero | `/private/tmp/ink-route-desktop-hero.png` |
| Blank-paper hold | `/private/tmp/waypoint-ink-route-blank-hold.png` |
| Ink impact | `/private/tmp/waypoint-ink-route-ink-impact.png` |
| Take A Annotation arrival | `/private/tmp/waypoint-ink-route-take-a-annotation.png` |
| Take B Annotation arrival | `/private/tmp/waypoint-ink-route-take-b-annotation.png` |
| Keyboard / focus handoff | `/private/tmp/waypoint-ink-route-keyboard-focus.png` |
| Reduced-motion static destination | `/private/tmp/waypoint-ink-route-reduced-motion.png` |
| Persistent muted state | `/private/tmp/waypoint-ink-route-muted-persistent.png` |
| Direct Annotation entry | `/private/tmp/waypoint-ink-route-direct-annotation.png` |
| Chrome DevTools trace | `/private/tmp/waypoint-ink-route-frame-trace.json` |

## Creative observations

- The genuinely blank paper beat and remembered journey-arrow impact position remain useful blocking evidence.
- The A/B comparison establishes a preference for more anticipation, but the variants differ only in timing and do not constitute two visual directions.
- Layered SVG paths, rings, feather lines, stroke reveals, sparse labels, and procedural audio are not production-representative evidence for material ink, an authored illustrated world, camera travel, or final sound.
- The screening therefore cannot approve the cinematic direction. Its earlier material, travel, and Annotation-discovery claims are withdrawn pending a corrected medium scout and replacement tracer.

## Technical findings

- One passive scroll listener schedules bounded animation-frame work; the final desktop runtime sample reported `2.8 ms` maximum route work and `0 ms` at the impact threshold. The exact 375 px touch sample reported `1.7 ms` maximum work and `0.7 ms` at impact.
- The trace initially exposed Web Audio output-device construction inside click activation. Audio is now prepared on focus or pointer-down and visual progress no longer awaits `resume()`.
- The final DevTools trace contains one `370.382 ms` input task from Chromium's audio-output device initialization before click, then a `21.698 ms` click task. No task above `50 ms` occurred during the impact frames themselves.
- Forward velocity controls scratch gain; stopped and reverse travel are silent. Impact and checkpoint one-shots are threshold-bound and do not replay during reverse travel.
- Keyboard activation hands focus to “The route authors the world.” Native Page Down continues the route. Reduced motion hides the bloom and smooth travel while rendering the complete static route and Annotation destination.
- Mute persisted across navigation as `waypoint-ink-route-muted=true`. Direct `#annotation` entry converged on the stable destination without invoking the journey-intent path.
- Chrome programmatic scroll and Web Audio paths were exercised. Safari resume and programmatic-scroll variance remain explicitly unverified.

## Validation

- Isolated TypeScript 5.9.3 check using the matching dependency tree: pass.
- Website Vitest suite: `7` files and `14` tests pass.
- Next.js 16.3.2 webpack production compile, static generation, and route trace collection: pass. The duplicate built-in type phase was skipped because this worktree intentionally has no dependency installation; the isolated TypeScript check covered that phase separately.
- The exact `pnpm --filter @logbookfordevs/waypoint-website check` attempted pnpm's automatic install bootstrap because `node_modules` was absent. It was stopped; the generated root cache was removed, and no install or symlink remains.

## Director's recommendation

Preserve the behavior and engineering findings, carry Take B as a tempo hypothesis, and reopen preproduction at [`medium-scout.md`](./medium-scout.md). Do not refine the SVG visual system or expand the route.

## Decision or notes requested from the user

Approve, revise, or reject the corrected medium strategy and the production-representative evidence contract for the replacement tracer.

## Next production boundary if approved

Only after that greenlight: produce representative assets and shoot a replacement hero-through-Annotation tracer in the approved medium. This note does not authorize Queue, Agent, Resolution, the full page, dependency installation, or final-cut production.
