# Route A Replacement Tracer — Screening Note

**Status:** Awaiting director screening. The picture/material/camera tracer is ready to judge; full production, final art, final foley, and renderer architecture remain unapproved.

**Approved source:** [`medium-scout.md`](./medium-scout.md), [`shot-plan.md`](./shot-plan.md), and the Route A greenlight recorded in [`director-notebook.md`](./director-notebook.md).

**Live cut:** Local Next runtime at `http://localhost:3015/` while this production session remains active.

## Creative evidence

| Evidence | Exact path |
| --- | --- |
| Desktop hydrated tracer recording, `1440 × 900` | `/private/tmp/waypoint-gpu-tracer-desktop-final.webm` |
| Desktop continuous material arrival | `/private/tmp/waypoint-gpu-annotation-desktop-final.png` |
| Desktop direct `#annotation` entry | `/private/tmp/waypoint-gpu-direct-annotation.png` |
| Mobile tracer recording, `375 × 812` | `/private/tmp/waypoint-gpu-tracer-mobile.webm` |
| Mobile hero composition | `/private/tmp/waypoint-gpu-hero-mobile.png` |
| Mobile impact / route birth | `/private/tmp/waypoint-gpu-route-birth-mobile.png` |
| Mobile Annotation arrival | `/private/tmp/waypoint-gpu-annotation-mobile.png` |
| Reduced-motion static mobile destination | `/private/tmp/waypoint-gpu-reduced-motion-mobile.png` |
| Deliberate WebGL context-loss fallback | `/private/tmp/waypoint-gpu-renderer-fallback.png` |
| Procedural impact / scratch / checkpoint foley reference | `/private/tmp/waypoint-ink-route-procedural-foley.wav` |

The recordings are VP8 video-only captures; they do not embed browser audio. The live build synchronizes the existing procedural impact, velocity-responsive scratch, silence, and checkpoint release to rendered state. That mix is sufficient to test causality live, but it is not final authored foley and should not be judged as the production sound finish.

## Creative observations

- The tracer now uses original authored desktop and mobile chart boards, a real density plate, a live GPU material pass, route-led world revelation, shallow edge parallax, camera travel, and live semantic Annotation evidence. SVG is absent from the visible route and impact.
- The held-breath blank frame survives the richer picture. The impact is materially legible and the route grows from it rather than appearing as a separate line layer.
- Desktop holds a wide diagonal journey into the rust target. Mobile is independently composed as a vertical channel and keeps the hero actions above the fold.
- The world appears only where the route has earned it. Context at the destination resolves from the authored chart into exact DOM copy rather than being flattened into the image.
- Two failed shader looks were rejected during dailies: discrete curve samples read as beads, and quantized noise read as rectangular blocks. The screened revision uses continuous segment distance plus interpolated material noise.
- The static renderer-failure cut is richer but less causal: it sacrifices live ink and camera motion while preserving the world, Annotation meaning, controls, focus, and useful document.

## Engineering evidence

- Website TypeScript check: pass.
- Website Vitest: `7` files, `14` tests pass.
- Next.js 16.3.2 webpack production build: pass, including TypeScript, static generation, and trace collection.
- Desktop browser state: WebGL renderer `ready`; observed `3.0 ms` maximum route work and `0.7 ms` at impact during the final recorded interaction.
- Mobile browser state at exactly `375 × 812`: renderer `ready`; observed `1.3 ms` maximum route work and `0.5 ms` at impact.
- Reduced motion jumps to the static destination, focuses “The route authors the world.”, pauses sound, and retains controls.
- Direct `#annotation` entry focuses the same heading and converges on the completed visual state.
- Deliberate `WEBGL_lose_context` switches the stage to the authored static image without removing semantic Annotation evidence.

## Honest gaps

- The image boards are representative generated-and-finished tracer art, not final editable layered masters.
- Parallax is a bounded edge-relief proof inside one board, not separate final far/middle/near exports.
- Browser captures are silent; the synchronized procedural mix must be heard in the live build. Final authored/recorded foley remains unapproved.
- Mobile evidence uses a real mobile composition at a `375 × 812` emulated viewport, not physical Adreno/Mali hardware. A real-device GPU session remains required before production expansion.
- Take B is still a rhythm hypothesis. This cut did not manufacture a second timing variant because the representative picture did not expose a useful binary choice yet.

## Director's recommendation

Screen this cut for the visual direction: material, authored world, camera, continuity, Annotation discovery, and the held-breath rhythm. If that direction is approved, keep the current implementation as tracer evidence and open only the next named production batch. Do not picture-lock the generated plates, procedural foley, or custom renderer architecture from this screening alone.

## Decision requested

Approve the Route A tracer direction, request specific visual revisions, or reject it. If approved, separately name whether the next frontier is final asset authoring for this hero-through-Annotation cut or expansion to the next journey segment.
