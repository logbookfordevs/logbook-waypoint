---
name: Logbook Waypoint
description: Local-first visual feedback for coding agents.
colors:
  page: "#f1f4f0"
  page-raised: "#f8faf7"
  ink: "#102c34"
  ocean: "#071f25"
  ocean-raised: "#0b2a30"
  verdigris: "#167b78"
  rust: "#b5482e"
  brass: "#b99247"
  walnut: "#eee6d7"
  walnut-raised: "#f8f2e7"
  focus: "#e5913a"
typography:
  display:
    fontFamily: "Besley Variable, Besley, serif"
    fontSize: "clamp(3rem, 4.8vw, 4.9rem)"
    fontWeight: 610
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Besley Variable, Besley, serif"
    fontSize: "clamp(2.3rem, 4.8vw, 4.7rem)"
    fontWeight: 610
    lineHeight: 1.03
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Besley Variable, Besley, serif"
    fontSize: "clamp(1.7rem, 3vw, 2.8rem)"
    fontWeight: 680
    lineHeight: 1.06
  body:
    fontFamily: "Waypoint Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.08em"
  navigation:
    fontFamily: "Waypoint Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 650
  control:
    fontFamily: "Waypoint Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.78rem"
  evidence:
    fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace"
    fontSize: "0.72rem"
rounded:
  code-control: "0.4rem"
  instrument-control: "0.45rem"
  sm: "0.5rem"
  record: "0.55rem"
  md: "0.875rem"
  lg: "1rem"
spacing:
  gutter: "1.5rem"
  control: "0.75rem"
  section: "clamp(4.5rem, 8vw, 8rem)"
components:
  button-primary:
    backgroundColor: "{colors.ocean}"
    textColor: "{colors.page-raised}"
    rounded: "{rounded.sm}"
    padding: "0.8rem 1.15rem"
  button-launch:
    backgroundColor: "{colors.rust}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0.65rem 1rem"
  workflow-instrument:
    backgroundColor: "{colors.ocean-raised}"
    textColor: "#eef6f3"
    rounded: "{rounded.md}"
    padding: "0.75rem"
  docs-code-block:
    backgroundColor: "{colors.ocean}"
    textColor: "#eef6f3"
    rounded: "{rounded.md}"
    padding: "1.5rem"
---

# Design System: Logbook Waypoint

## Overview

**Creative North Star: "The Living Route"**

Waypoint is Atlantic Chartroom made operational: cool chart paper supports Day Chart marketing, Deep Ocean holds the working mechanism, and Walnut turns documentation into a sustained reading surface. The page should feel like a calibrated instrument and field guide, not a generic developer-tool landing page.

The product story remains visible as a route: Annotation, Queue, then Resolve. Thelu closes or guides the passage after the mechanism is understood; the mascot never substitutes for product proof. Night Watch is a complete semantic appearance, not a separate visual identity.

**Key Characteristics:**

- Ocean marketing frame with a distinct Walnut documentation recipe.
- Authored dashed routes, checkpoints, radar geometry, and ledger structure.
- Restrained brass coordinates; Verdigris bearings; Signal Rust annotations and launch attention.

## Colors

Cool chart paper is the daylight canvas; semantic accents identify purpose, not decoration.

### Primary

- **Deep Ocean:** primary actions, global framing, code, and the dominant workflow instrument.
- **Verdigris Bearings:** navigation accents, active states, focus-adjacent guidance, and constructive action.

### Secondary

- **Signal Rust:** Annotation marks, early-stage launch attention, warnings, and field notes.
- **Brass Coordinates:** route geometry, indices, checkpoint trim, and other fine instrument detail.

### Neutral

- **Day Chart:** the default marketing canvas and raised paper surfaces.
- **Walnut Paper:** documentation articles and long-form reading surfaces.
- **Chart Ink:** high-legibility content and structural borders on paper.

**The Chartroom Roles Rule.** Brass stays a fine-detail material and Rust stays a signal; neither becomes an all-purpose brand fill. Night Watch changes semantic surface and ink tokens together so the same roles remain legible.

## Typography

**Display Font:** Besley Variable, Besley, serif

**Body Font:** Waypoint Sans, ui-sans-serif, system-ui, sans-serif

**Label/Mono Font:** SFMono-Regular, Consolas, Liberation Mono, monospace

**Character:** Besley provides editorial navigation and narrative weight; the variable sans does the practical reading and control work. Mono is reserved for operational evidence, coordinates, lifecycle state, and code.

### Hierarchy

- **Display:** carries the hero and document titles with compact, high-contrast line breaks.
- **Headline:** introduces major paper and instrument sections without competing with the route.
- **Title:** names ledgers, routes, and contained feature surfaces.
- **Body:** uses relaxed reading leading and bounded measures on article and explanatory copy.
- **Label:** compact uppercase or metadata-scale mono identifies route numbers, lifecycle evidence, URLs, and commands.

**The Three Jobs Rule.** Use serif for narrative hierarchy, sans for human-facing interface copy, and mono only when content is operational evidence.

## Layout

The site uses wide, bounded fields: the header and hero cap at 92rem, major paper sections at 84rem, and the workflow can expand to an 88rem instrument field. Desktop presents the mechanism as three connected stages; below 72rem it becomes a staged vertical route, and below 38rem the hero route also becomes vertical. Documentation changes to a sticky Ocean navigation column with a Walnut reading surface, then collapses to a stacked mobile shell below 52rem.

**The Route Before Ornament Rule.** The Annotation-to-Queue-to-Resolve mechanism is the dominant first-viewport proof. Geometry and mascot support comprehension; they do not displace it.

## Elevation & Depth

Depth is tonal and material first: paper bands, bordered ledgers, Walnut grids, and Ocean fields establish hierarchy. Raised paper menus and launch explanations use the soft raised shadow; the three workflow surfaces use the deeper instrument shadow. The page otherwise avoids gratuitous floating-card stacks.

### Shadow Vocabulary

- **Raised paper:** soft two-layer shadow for temporary paper surfaces such as navigation and launch context.
- **Instrument field:** deep Ocean shadow for browser, Queue, and agent surfaces inside the workflow.

## Shapes

The default form is gently rounded and measured: small controls use the small radius, contained instruments and code use the medium radius, and large paper surfaces stay mostly square through borders and ruled lines. Circular controls, route points, and the radar are reserved for navigational or measured coordinates. Chips and bearing labels may be fully pill-shaped.

## Components

### Buttons

- **Primary route action:** a compact Deep Ocean action on paper; it lifts slightly on fine-pointer hover.
- **Launch action:** Signal Rust communicates the honest Coming soon posture and never impersonates an installer.
- **Instrument action:** Verdigris resolves the illustrative Queue item while its disabled state preserves the visible lifecycle result.

### Navigation

- **Style:** quiet paper header, editorial brand lockup, sans navigation, and a circular appearance control.
- **State:** Verdigris underlines active hover paths on fine pointers; mobile opens a raised paper menu with the same controls.

### Workflow Instruments

- **Style:** three Deep Ocean panels with brass framing, compact mono evidence, serif titles, and selectively inset Rust annotation emphasis.
- **Route:** dashed brass vector paths and checkpoint circles remain meaningful even when motion is reduced.

### Ledgers and Notices

- **Style:** paper and Walnut information is structured as ruled rows, not repeated feature cards. Rust-backed field notices pair icon and text; status uses both text and a visible mark.

### Code Blocks

- **Style:** Deep Ocean code surface on Walnut articles with a small copy control in the upper corner and horizontal overflow contained within the block.

## Do's and Don'ts

### Do:

- **Do** keep the Ocean and Walnut recipes on one stable themed boundary with Day Chart or Night Watch appearance tokens.
- **Do** use authored SVG route geometry, ruled ledgers, and compact metadata to make workflow state inspectable.
- **Do** keep focus visible, preserve non-color status cues, and remove positional motion under reduced-motion preferences.

### Don't:

- **Don't** replace the operational sequence with a detached screenshot, conventional centered hero, or generic same-size feature-card grid.
- **Don't** use brass as a broad fill or mono merely to make ordinary copy look technical.
- **Don't** turn Thelu or illustrative workflow records into customer proof, availability claims, or a replacement for the mechanism.
