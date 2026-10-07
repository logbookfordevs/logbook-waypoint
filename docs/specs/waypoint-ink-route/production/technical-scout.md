# Waypoint Ink Route — Technical Scout

**Status:** Proposed preproduction finding. It constrains a possible tracer but does not authorize implementation or dependency changes.

**Scope:** Hero-to-Ink Route entrance and first Annotation destination only.

## Recommended authority

Use one normalized **native-scroll entrance progress** as the authoritative visual spine.

- Manual wheel, trackpad, touch, keyboard scrolling, and anchor navigation all reconstruct the same visual state.
- **See the journey** remains an anchor-like product control. Activating it sets explicit sound intent, unlocks audio, and advances through the same native-scroll range.
- Hero opacity, blank hold, ink impact, route stroke, bearing marks, and Annotation reveal derive from progress ranges rather than independent timers.
- Semantic React state owns only discrete concerns such as sound preference, whether the journey was intentionally activated, and stable focus destinations.
- Continuous progress, velocity, SVG measurements, and audio gain remain outside React render state.

This gives the visitor a reversible sequence while keeping the intentional click causally meaningful.

## Proposed render path

- **Semantic layer:** normal HTML contains hero content, journey heading, Annotation evidence, links, and controls.
- **Route layer:** authored responsive SVG paths use stroke length and dash offset for route progression.
- **Ink impact:** a bounded SVG group with two or three irregular paths/circles uses transform and opacity; avoid blur and displacement filters in the tracer.
- **Paper:** solid Driftwood Paper color plus one optimized, low-contrast texture. The 2.9 MB concept image is reference-only and never ships as the page.
- **Per-frame work:** one passive scroll listener schedules at most one animation frame; the frame reads scroll position once and writes bounded SVG/style/audio values.
- **Visibility:** pause scheduled work and silence audio while hidden; reconstruct from current scroll progress on return.

## Animation stack recommendation

Do not add an animation dependency for the tracer.

- Use CSS for tactile contact and simple discrete control states.
- Use a small requestAnimationFrame owner for normalized progress and SVG projection.
- Use the Web Audio API for render-anchored sound gain and one-shot scheduling.

The current website has no Motion or GSAP dependency. The tracer should prove the signature interaction before choosing a production choreography library. If later production scenes make interruption or layout continuity materially complex, run the repository's dependency-selection gate before adding `motion` or another owner.

## Sound mechanism

- Create or resume one AudioContext only after intentional Journey activation.
- Decode the ink-impact one-shot and scratch texture after the click; visual progress never waits for audio.
- Schedule ink contact from the frame that first paints the impact threshold.
- Derive scratch gain from the positive derivative of route progress, with a short attack/release envelope to prevent clicks.
- Do not reverse an audio buffer during upward scrolling. The first tracer makes reverse travel silent.
- On hidden tabs, ramp gain to zero and suspend. Resume only after the context is allowed and visual progress changes again.
- Missing or failed audio must not alter progress, focus, or visible state.

The tracer can begin with a temporary procedural or locally produced scratch texture. Final foley selection, licensing, mastering, and compression belong to production/post-production.

## Segment ownership

| Segment | Owns | Stable entry / exit |
| --- | --- | --- |
| Hero | Hero semantics, actions, Thelu frame | Fully readable and actionable before enhancement |
| Entrance | Hero exit projection, blank hold, impact group, audio-intent handoff | `progress 0` reconstructs hero; `progress 1` reconstructs first route dashes |
| Annotation | First route continuation, Rust checkpoint, Target evidence | Direct entry shows completed entrance and stable Annotation content |
| Shared | Scroll measurement, responsive path selection, audio bus, mute/back controls | Lives above segment teardown and reconciles on resize/visibility |

## Interruption policy

- **Tactile press before release:** cancelable.
- **Scroll-driven visual transition:** reversible at every progress value.
- **Ink-impact sound after forward threshold:** completing one-shot; do not reverse or duplicate during jitter.
- **Route scratch:** cancelable through gain release whenever positive velocity stops.
- **Resize/orientation:** preserve semantic segment and recompute responsive geometry; do not preserve obsolete pixel coordinates.
- **Direct entry:** restore the stable completed entrance rather than replaying prior side effects.
- **Reduced-motion preference change:** move immediately to the nearest stable semantic state and silence continuous sound.

## Fidelity ladder

- **Full:** paper texture, capillary impact, organic dashed route draw, bearing marks, impact one-shot, velocity-responsive scratch.
- **Standard:** solid paper, simplified impact rings, route draw, no optional bearing motion, same semantic content and controls.
- **Reduced motion:** completed static route and discrete destination reveal, no positional exit, smooth scroll, impact, loop, or haptic.
- **Base / failed enhancement:** ordinary hero followed by ordered Annotation content and links; no script-dependent meaning.

## Working budgets for tracer evidence

- No WebGL, canvas renderer, shaders, or continuously animated filters.
- No animation runtime added before tracer evidence warrants it.
- Opening scene excludes audio and later-destination assets from the critical path.
- Opening reference/illustration assets target no more than `350 KB` transferred at the working mobile breakpoint; final font accounting remains part of production.
- Tracer audio targets no more than `120 KB` transferred and `1 MB` decoded memory.
- Per-frame route work targets under `4 ms` scripting/style on the working mobile device, with no long frame above `50 ms` during first impact.
- Aim for 60 Hz presentation where available; acceptance is based on visible worst frames, not average FPS.

## Primary risks to prove

1. The truly blank paper hold feels intentional rather than like content disappeared or failed.
2. Smooth programmatic advancement and manual native scrolling converge on identical scene state.
3. Ink audio begins on the perceived rendered event and follows variable scroll speed without chatter.
4. Responsive route geometry preserves the remembered CTA-origin relationship without storing desktop pixels.
5. Keyboard focus never remains on invisible hero content.
6. Existing or provisional Thelu imagery does not dominate LCP or obscure the journey action.

## Tracer acceptance evidence

- Forward, reverse, pause, and rapid-direction-change behavior on the entrance range.
- Pointer, touch, keyboard, direct hash, reduced-motion, and muted paths.
- Desktop and 375 CSS pixel composition captures plus motion recordings.
- Audio/video recording that makes impact synchronization judgeable.
- Performance trace spanning first audio decode, ink impact, and route draw.
- Visibility-background recovery without a stuck loop or repeated impact.

## Reserved decisions

Final animation library, final sound assets, exact path geometry, production typography scale, hero copy, Thelu asset, full-route segment graph, and post-production effects remain outside this scout.
