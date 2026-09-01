# Waypoint Ink Route — Director's Notebook

**Production home:** `docs/specs/waypoint-ink-route/production/`

**Current stage:** Full sandbox production cut completed and screened. The original tracer package remains below as historical preproduction evidence.

**Approved production boundary:** The director later superseded the bounded tracer frontier for this disposable worktree and authorized a complete, code-led homepage cut with full creative autonomy. The production cut now covers the immediate hero, Ink Route entrance, Annotation, Queue, Agent, Resolution, closing local-first payoff, responsive layouts, reduced motion, focus handoff, direct entry, and procedural route foley. This authorization does not imply release, merge, or deployment approval.

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
- Production cut: `packages/website/components/route-journey.tsx` and `packages/website/app/styles/route-journey.css`
- [Motion specification](./motion-spec.md)
- [Asset ledger](./asset-ledger.md)
- [Screening ledger](./screenings.md)

## Last greenlight

**2026-08-31 — Full disposable-worktree production approved.** After the tracer gate, the director explicitly authorized a complete high-quality website cut with autonomous creative decisions and permission to generate image, sound, or video assets when justified. The production chose a code-led route rather than baked video so native scroll, reverse travel, responsive reblocking, reduced motion, and semantic product truth remain intact.

## Next co-directing decision

Director experience review of the completed cut. Optional post-production remains limited to replacing procedural ink scratch with recorded nib-on-paper foley if the synthesized texture does not survive subjective listening.

## Current production slate

- **Recorded:** The full cut preserves the useful hero and makes the optional journey a four-destination travel montage: Annotation → Queue → Agent → Resolution.
- **Current gate:** Director experience review in the disposable worktree.
- **Implementation authority:** Native scroll plus a bounded animation-frame projection, CSS scene composition, authored SVG route geometry, Web Audio procedural foley, and semantic React state. No animation or media runtime was added.
- **Validated evidence:** Desktop, 390 px mobile, reduced motion, direct hash entry, user-unlocked sound state, keyboard focus handoff, full website typecheck, 12 website tests, static production build, and a warmed scroll sample with no long tasks or frames over 32 ms.
- **Still unresolved:** Subjective audio material quality and Safari-specific Web Audio/scroll behavior need human or device listening before public release.
- **Next evidence or greenlight:** Leonardo screens the cut and either accepts it as the production direction or issues a focused revision note. Public release remains a separate decision.

## Continuity log

- **2026-08-31 / treatment greenlight** — Recorded The Ink Route as the selected treatment. Advanced the production to the preproduction gate. No implementation authority was inferred from the director's agreement.
- **2026-08-31 / preproduction prepared** — Added the proposed shot plan, technical scout, storyboard SVG/PNG, tracer boundary, and dailies matrix. Status remains unapproved pending director review.
- **2026-08-31 / tracer greenlight** — Director explicitly greenlit the preproduction package and requested a fresh worktree production unit. Locked the seven-item tracer boundary, recorded the next screening gate, and kept the rest of the page outside production authority.
- **2026-08-31 / production supersession** — Director explicitly widened the disposable-worktree boundary to a complete autonomous website cut, named The Boat, Pixel Space, and Active Theory as experience references, and authorized generated media only where code could not preserve the intended quality.
- **2026-08-31 / complete cut** — Finished and screened the responsive code-led route. Kept video and music out because they would weaken reversible native-scroll authorship; reserved recorded nib-on-paper foley as the only plausible post-production upgrade.
