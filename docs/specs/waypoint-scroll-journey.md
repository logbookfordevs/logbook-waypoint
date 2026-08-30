# Waypoint scroll journey

## Experience brief

- **Primary mode:** Cinematic narrative, with kinetic clarity at each product beat.
- **Dials:** Motion 4, space 3, input 1, immersion 2, density 2.
- **Primary feeling:** Following a field note as it becomes an actionable handoff.
- **Irresistible action:** Understand the route, then open the docs or repository.
- **Device floor:** A current mid-range mobile browser at 375 CSS pixels wide; no WebGL requirement.
- **Input paths:** Native wheel, trackpad, touch, keyboard scrolling, anchor links, and ordinary document reading.
- **Reduced-motion direction:** The complete route and every beat remain visible as a static chart. The traveling bearing is removed.

## Story spine

1. **Promise — Pin the point. Chart the change.** The first viewport identifies Waypoint as local-first visual feedback for coding agents and keeps Docs and Repository available.
2. **Beat — Mark the rendered target.** An Annotation retains the exact element, screenshot, route, and requested change.
3. **Beat — Keep the field note together.** The local Queue preserves context and lifecycle instead of flattening feedback into a screenshot or chat message.
4. **Reversal — The note becomes agent-ready work.** MCP lets an agent Watch, Claim, and act without inventing a second source of truth.
5. **Beat — Return with evidence.** Resolution brings the implementation and verification back to the original point.
6. **Payoff — Choose the next bearing.** Installation status, Docs, and Repository turn the authored route back into visitor agency.

There is no artificial gate. Native scroll is the meaningful input and is fully reversible.

## Authoritative spine

One normalized `0..1` scroll progress value belongs to the route section. The SVG path draw, traveling bearing, and active checkpoint all derive from it. Continuous progress stays outside React render state and is projected directly to the route layer in `requestAnimationFrame`.

| Segment | Range | Narrative change | Reduced motion |
| --- | --- | --- | --- |
| Annotate | `0.00..0.24` | A vague observation becomes a precise Target. | Complete beat shown. |
| Queue | `0.24..0.49` | The Target becomes durable local work. | Complete beat shown. |
| Agent | `0.49..0.74` | MCP turns retained context into claimed work. | Complete beat shown. |
| Verify | `0.74..1.00` | The result returns with a Resolution Record. | Complete beat shown. |

## Tracer-bullet acceptance

- The dashed SVG route draws forward and backward from native scroll.
- One traveling bearing follows the same path without causing React renders or layout writes per frame.
- Every beat is readable before enhancement and remains in DOM order.
- Docs, Repository, and primary journey links are available without completing the scroll sequence.
- At `prefers-reduced-motion: reduce`, the route is complete and no traveling bearing is shown.
- At 375 CSS pixels, beats form one intentional vertical route without horizontal scrolling.
- The route layer only animates SVG stroke geometry, transform, and opacity; no filters or large continuously repainted surfaces are used.

## Fidelity ladder

- **Full:** Scrubbed route draw, traveling bearing, checkpoint focus, subtle paper lift.
- **Reduced:** Discrete checkpoint emphasis with a complete static route.
- **Base:** Semantic headings, copy, links, and ordered beats with no script-dependent meaning.

## Performance budget

- No homepage animation dependency and no canvas/WebGL runtime.
- One passive scroll listener and at most one scheduled animation frame.
- No React state updates during scroll.
- Signature work is bounded to one SVG path measurement, one SVG marker update, and checkpoint attribute updates per rendered frame.
