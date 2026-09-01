# Waypoint Ink Route — Director's Notebook

**Production home:** `docs/specs/waypoint-ink-route/production/`

**Current stage:** Tracer production dispatched. The Ink Route treatment and bounded signature-shot tracer are approved; the next gate is a screening of the required dailies.

**Approved production boundary:** Implement only the responsive hero-to-Ink Route tracer defined in `shot-plan.md`: journey activation; hero clear; genuinely empty Driftwood Paper; ink impact and first dashed route; scroll continuation to one simplified Annotation checkpoint; user-unlocked, mutable route foley; reduced-motion and muted paths; and Take A / Take B timing comparison. Queue, Agent, Resolution, final assets, full navigation, final install routing, and postproduction polish remain outside the frontier.

## Creative battery

- **Premise:** The visitor does not arrive at a completed world. After choosing the journey, they watch Waypoint author that world into existence.
- **Audience-facing theme:** A minimalist map travel sequence on Driftwood Paper, drawing from classic animated adventure-film map montages without reproducing a crowded antique pirate map.
- **Product truth:** Waypoint turns precise visual feedback into retained, agent-ready work and returns a Resolution the developer can inspect.
- **Conflict → change:** An unstructured observation becomes a visible route through Annotation, Queue, Agent, and Resolution.
- **Primary feeling:** Setting out with purpose: storybook wonder held inside a trustworthy developer instrument.
- **Irresistible actions:** Get Waypoint immediately, or deliberately enter the cinematic journey.
- **Reference qualities:** Sparse ink drawing, material paper, authored travel montage, causal route motion, and sound synchronized to the route's visible creation.
- **Non-negotiables:** Preserve Waypoint's identity and typography; keep an immediate product action; retain native scrolling and complete keyboard, muted, reduced-motion, and mobile paths; never require sound to understand the story.

## Locked choices

- The new homepage direction starts from scratch. Existing homepage composition and motion are not creative authority.
- The canonical treatment is **The Ink Route**, within the broader Living Storybook Chart direction.
- The base canvas is minimalist **Driftwood Paper `#e9e1d3`**.
- The initial hero is immediately useful and contains a public product action, a journey action, and a documentation path.
- **See the journey** is an optional, intentional gate into the cinematic sequence; the primary product action remains available without completing the journey.
- Journey activation receives a tactile press. The hero then clears until only the paper remains.
- The journey starts from a brief blank-paper hold followed by a black ink impact and organic bloom that becomes the first dashed route segment.
- The route creates the map rather than traveling across a fully completed map.
- Native scroll carries the travel montage after the short journey-activation transition.
- The product route follows **Annotation → Queue → Agent → Resolution**.
- Copy carries the story. Narration is not part of the approved treatment.
- The signature sound is responsive ink-on-paper foley synchronized to visible route drawing. Sound begins only from intentional user action, remains mutable, and carries no required meaning.
- A visible literal pen is not required; the approved origin image is the ink drop and spreading route.
- Waypoint's established Poppins, Literata, and IBM Plex Mono roles remain the production typography. The condensed concept headline is not production typography.
- The CTA disappears with the hero; the blank-paper hold is genuinely empty; and the ink impact lands at the remembered CTA-arrow position to preserve positional causality.
- A single normalized native-scroll entrance range is the visual authority. Journey activation may advance that same range after unlocking sound; manual scroll follows the same visuals silently.
- Reverse scroll reverses the tracer visuals without replaying sound. Haptics are not part of this tracer.
- The tracer compares Take A (900–1050 ms exit, 160–200 ms blank hold) with Take B (1200–1350 ms exit, 280–340 ms blank hold).

## Open questions

- Exact hero promise, CTA labels, and final public installation destination at launch.
- Thelu's precise framing in the hero and whether Thelu reappears during the route.
- Final production timing after the tracer comparison.
- Final route-foley recording and mix after the procedural or locally produced tracer cue proves the interaction.
- The exact map vocabulary and evidence shown at each product destination.
- Exact production device floor and lowest fidelity tier after the 375 px tracer coverage.
- Whether tracer evidence justifies changing the proposed CSS, animation-frame, SVG, and Web Audio implementation approach.

These remaining questions belong to the tracer screening or later production gates. The approved tracer must not silently answer them for the full page.

## Rejected directions and reasons

- **Reuse or refine the currently built homepage:** rejected by the director's explicit restart; retain only durable product, identity, typography, stack, and accessibility facts.
- **Begin with a completed map:** rejected because the approved idea is that the visitor causes the route—and therefore the world—to come into being.
- **Force every visitor through an intro before product access:** rejected because the immediate CTA must remain available.
- **Busy antique pirate-map pastiche:** rejected in favor of a sparse travel montage where product causality stays legible.
- **Narration-led storytelling:** not selected; copy and synchronized foley carry the current treatment.
- **Visible pen as a required character:** replaced by the more elemental black-ink impact and bloom.
- **Treat the generated concept as a pixel-exact layout or typography target:** rejected; it is art-direction and composition evidence only.
- **Convert the uncertain signature interaction into tickets now:** rejected by the production topology; one unresolved signature shot should be directed and traced before scheduling.

## References and anti-references

- [Chartroom Wonder concept](../../../references/waypoint-storybook-chart/chartroom-wonder-concept.png) — art-direction evidence for an immediate hero, Thelu, paper material, route, and product destinations; not a literal production frame.
- [Concept reference notes](../../../references/waypoint-storybook-chart/README.md) — historical visual-direction context, superseded where this notebook records the hero-first Ink Route transition.
- [`DESIGN.md`](../../../../DESIGN.md) — durable Waypoint identity, color roles, and typography; prior homepage composition is not carried forward.
- [`CONTEXT.md`](../../../../CONTEXT.md) — canonical product vocabulary.
- Codex Director's Room task `01a04dea-a632-72e1-9e89-7dbccfff14fa` — source of the development and treatment decisions recorded here.
- [`docs/specs/waypoint-website.md`](../../waypoint-website.md) and [`docs/specs/waypoint-scroll-journey.md`](../../waypoint-scroll-journey.md) — superseded production directions; factual product and accessibility constraints may be revalidated, but their compositions are anti-references for the restart.

## Technical findings

- The website stack is Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, and pnpm.
- Browser audio requires an intentional user gesture. The journey action can unlock the audio context without making the journey mandatory.
- Native scrolling is the approved input spine after the activation transition. Exact progress ownership remains a technical-scout decision.
- SVG stroke geometry is a plausible route mechanism, but no rendering or animation implementation has been greenlit.
- Semantic content, product actions, and destination meaning must remain complete without motion, sound, or enhanced rendering.
- The proposed scout uses normalized native-scroll progress as the visual authority, CSS for contact states, a bounded animation-frame projection for SVG route geometry, and Web Audio for render-anchored sound. No dependency change is approved.
- The proposed entrance uses positional causality: the CTA disappears with the hero and the later ink impact lands at its remembered screen-space origin, preserving a truly blank paper hold.

## Artifact index

- [Approved treatment](./treatment.md)
- Director's notebook: this file
- [Proposed shot plan](./shot-plan.md)
- [Proposed technical scout](./technical-scout.md)
- [Editable storyboard](./storyboard.svg)
- [Rendered storyboard](./storyboard.png)
- Tracer: authorized and dispatched to a fresh worktree task; implementation and dailies are pending
- Production cards, asset ledger, screenings, motion spec: not yet earned

## Last greenlight

**2026-08-31 — Preproduction and tracer boundary approved.** The director explicitly greenlit the proposed shot plan, positional-causality blocking, Take A / Take B timing comparison, responsive sound behavior, technical scout, seven-item tracer boundary, and required dailies. This authorizes the bounded tracer only, not expansion into the full page.

## Next co-directing decision

Screen the tracer dailies, choose Take A or Take B (or request a specific revision), and decide whether the signature shot is ready to expand into production.

## Current production slate

- **Recorded:** The Ink Route treatment and the complete preproduction package are approved. The tracer boundary, dailies matrix, positional causality, timing comparison, reverse-scroll silence, and sound contract are locked for this shoot.
- **Current gate and approved boundary:** Tracer production. Only the seven-item boundary in `shot-plan.md` is authorized.
- **Recommended production move:** **Dispatch a production unit** to shoot the bounded tracer in a fresh worktree based on `feat/waypointer-website`.
- **Why this move fits now:** The creative questions are expressed clearly enough to test in motion; the remaining uncertainty is rendered feel, not another planning artifact.
- **Approved production frontier:** Hero through the first simplified Annotation checkpoint, including the A/B timing comparison and required accessibility, sound, responsive, and performance dailies.
- **Still unresolved in the Director's Room:** Which timing take wins, whether the positional handoff reads clearly in the browser, whether the temporary foley feels materially synchronized, and what performance or Safari evidence requires revision.
- **Selected venue:** Fresh worktree task as one bounded production unit. This single tracer does not require tickets.
- **Next evidence or greenlight:** Live Take A / Take B tracer, desktop and mobile recordings, keyboard/reduced-motion/muted coverage, frame-time trace, and implementation notes. Expansion stops until the director screens that evidence.

## Continuity log

- **2026-08-31 / treatment greenlight** — Recorded The Ink Route as the selected treatment. Advanced the production to the preproduction gate. No implementation authority was inferred from the director's agreement.
- **2026-08-31 / preproduction prepared** — Added the proposed shot plan, technical scout, storyboard SVG/PNG, tracer boundary, and dailies matrix. Status remains unapproved pending director review.
- **2026-08-31 / tracer greenlight** — Director explicitly greenlit the preproduction package and requested a fresh worktree production unit. Locked the seven-item tracer boundary, recorded the next screening gate, and kept the rest of the page outside production authority.
