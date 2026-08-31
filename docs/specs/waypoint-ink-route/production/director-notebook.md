# Waypoint Ink Route — Director's Notebook

**Production home:** `docs/specs/waypoint-ink-route/production/`

**Current stage:** Preproduction review. The Ink Route treatment is approved; the proposed shot plan, technical scout, storyboard, and tracer boundary await greenlight.

**Approved production boundary:** Preserve the approved treatment and prepare its next creative gate. Do not implement the tracer or expand the production without an explicit greenlight.

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

## Open questions

- Exact hero promise, CTA labels, and final public installation destination at launch.
- Thelu's precise framing in the hero and whether Thelu reappears during the route.
- Exact blocking and timing for CTA contraction, hero exit, blank-paper hold, ink impact, and the first route reveal.
- Whether the CTA becomes the route's origin mark literally or only establishes its causal position.
- Journey-sound invitation, default preference, persistent mute control, replay behavior, reverse-scroll behavior, and final sound assets.
- The exact map vocabulary and evidence shown at each product destination.
- Mobile shot coverage, exact device floor, reduced-motion composition, and the lowest fidelity tier.
- The authoritative animation driver, route rendering mechanism, warm path, budgets, and whether an animation dependency is warranted.
- The exact tracer shot boundary and the rendered evidence required for its greenlight.

The proposed preproduction package answers these questions for review without locking them. Approval or revision belongs to the next greenlight.

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
- Tracer: not greenlit and not created
- Production cards, asset ledger, screenings, motion spec: not yet earned

## Last greenlight

**2026-08-31 — Treatment direction approved.** The director approved The Ink Route: a minimalist map travel sequence on Driftwood Paper in which the journey action clears the hero, an ink drop begins the dashed route, and native scroll carries the product journey. This approval did not greenlight tracer implementation.

## Next co-directing decision

Approve or revise the proposed hero-to-Ink Route shot sequence, positional-causality blocking, timing comparison, sound behavior, responsive and reduced-motion coverage, technical scout, tracer boundary, and required dailies.

## Current production slate

- **Recorded:** The approved Ink Route treatment plus an unapproved preproduction package containing the shot plan, technical scout, editable storyboard, rendered board, tracer boundary, and dailies matrix.
- **Current gate and approved boundary:** Preproduction review. Treatment is locked; the new package is a proposal, and no implementation is authorized.
- **Recommended production move:** **Shoot a tracer** — only after the director approves or revises this preproduction package and explicitly opens the bounded tracer.
- **Why this move fits now:** One signature uncertainty remains: whether the hero-clear, blank hold, ink impact, sound, and scroll handoff feel causal and cinematic in motion. A live tracer will answer it more honestly than additional documents or tickets.
- **Approved production frontier:** Treatment only until the preproduction greenlight. If approved, the frontier becomes the seven-item tracer boundary in `shot-plan.md`.
- **Still unresolved in the Director's Room:** Approval of positional causality, Take A / Take B timing coverage, reverse-scroll silence, exact tracer boundary, and its evidence matrix.
- **Venue for the director to choose:** Current room, handoff/fresh task, or a bounded production unit. Tickets are premature.
- **Next evidence or greenlight:** Preproduction greenlight or revision notes. A greenlight must explicitly authorize the tracer before code changes begin.

## Continuity log

- **2026-08-31 / treatment greenlight** — Recorded The Ink Route as the selected treatment. Advanced the production to the preproduction gate. No implementation authority was inferred from the director's agreement.
- **2026-08-31 / preproduction prepared** — Added the proposed shot plan, technical scout, storyboard SVG/PNG, tracer boundary, and dailies matrix. Status remains unapproved pending director review.
