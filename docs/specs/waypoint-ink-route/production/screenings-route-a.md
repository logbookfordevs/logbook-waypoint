# Route A Replacement Tracer — Screening Note

**Status:** Visual direction approved at tracer screening on 2026-09-01. The accepted picture/material/camera tracer and its dashed-route revision are integrated as production evidence; this is not picture lock, final art, final foley, renderer lock, or authorization for the next route segment.

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
- The director's screening response was strongly positive. The only concrete visual revision requested after that response was a more map-like dashed route; commit `3399ea0` supplied eleven irregular dash periods with continuous origin/arrival joins and was accepted as “amazing.” This later approval supersedes the earlier three-to-five-dash blocking note without expanding the scene.

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
- Background/foreground recovery suspends Web Audio but does not yet explicitly resume it when the page becomes visible.
- Texture decode/upload begins eagerly but journey activation does not yet wait for renderer readiness, so an unusually fast activation on a slow device can outrun the creative-master warm path.
- Focused component tests cover semantic content, activation, audio preparation, and reduced motion, but the shader and Web Audio graph remain covered by live dailies rather than deterministic unit tests.
- The custom animation-frame projection is a deliberate tracer exception to the general Motion-library preference: it is the WebGL render cadence approved by the medium scout, and adding an animation dependency was outside this production boundary.
- On local Node `26.7.0`, Vitest requires `--localstorage-file` for the mute-persistence tests; with that environment flag the complete `7`-file, `14`-test suite passes.

## Director's decision

Approve the Route A visual direction and retain the integrated tracer as evidence for material ink, authored-world emergence, camera continuity, Annotation discovery, held-breath rhythm, and the dashed-map route. Do not picture-lock the generated plates, procedural foley, or custom renderer architecture. Resolve the documented warm-path and audio-resume conditions before promoting this tracer into a production-ready batch.

## Next decision requested

Choose the next frontier: final asset authoring and engineering hardening for the approved hero-through-Annotation cut, or preproduction for the next Queue journey segment. Neither frontier is opened by this screening record.
