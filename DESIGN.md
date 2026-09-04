---
name: Logbook Waypoint
description: Local-first visual feedback for coding agents.
colors:
  page: "#e9e5d8"
  page-raised: "#f3f0e7"
  ink: "#17201e"
  ocean: "#102c2c"
  ocean-raised: "#132f31"
  verdigris: "#3f8580"
  rust: "#c94f35"
  brass: "#bd9348"
  walnut: "#e4d8c7"
  walnut-raised: "#eee3d4"
  focus: "#3f8580"
typography:
  display:
    fontFamily: "Poppins, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(3.25rem, 6.2vw, 5.5rem)"
    fontWeight: 650
    lineHeight: 0.92
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Poppins, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(2.3rem, 4.5vw, 4.2rem)"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Poppins, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(1.55rem, 2.6vw, 2.15rem)"
    fontWeight: 600
    lineHeight: 1.1
  readingTitle:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.75rem, 5vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.03
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "0.68rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.08em"
  navigation:
    fontFamily: "Poppins, Avenir Next, Segoe UI, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 650
  control:
    fontFamily: "Poppins, Avenir Next, Segoe UI, sans-serif"
    fontSize: "0.78rem"
  evidence:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Consolas, monospace"
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
    backgroundColor: "{colors.ocean}"
    textColor: "#f4efde"
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

**Display and UI Font:** Poppins, Avenir Next, Segoe UI, sans-serif

**Reading Font:** Literata, Georgia, Times New Roman, serif

**Label/Mono Font:** IBM Plex Mono, SFMono-Regular, Consolas, monospace

**Character:** Bottle Letter treats the interface as the constructed bottle and the narrative as the message inside it. Poppins builds public structure and controls. Literata carries explanatory field notes and sustained reading. IBM Plex Mono verifies coordinates, lifecycle state, and code.

### Hierarchy

- **Display:** Poppins carries the marketing promise with confident, compact line breaks.
- **Headline:** introduces major paper and instrument sections without competing with the route.
- **Title:** names ledgers, routes, and contained feature surfaces.
- **Body:** Literata uses relaxed reading leading and bounded measures for narrative and explanatory copy.
- **Label:** compact uppercase or metadata-scale mono identifies route numbers, lifecycle evidence, URLs, and commands.

**The Bottle Letter Rule.** Poppins constructs the interface, Literata reveals the authored message, and IBM Plex Mono verifies operational evidence. The homepage scopes this system to the marketing journey; the Walnut documentation surface remains a separate, stable reading experience until it receives its own deliberate migration.

## Layout

The homepage uses one native-scroll narrative. The first viewport keeps the promise, Docs, and Repository immediately available. A four-beat route alternates across the chart on desktop and becomes a deliberate vertical bearing on mobile. Local-boundary proof and the final handoff stay compact after the signature journey. Documentation remains a separate Walnut reading surface.

**The Route Before Ornament Rule.** The Annotation-to-Queue-to-agent-to-Resolution mechanism is the dominant proof. Geometry and Thelu support comprehension; they do not displace it.

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
- **Launch action:** Deep Ocean links directly to the official Chrome Web Store listing. Signal Rust remains reserved for warnings, field notes, and other attention states.
- **Instrument action:** Verdigris resolves the illustrative Queue item while its disabled state preserves the visible lifecycle result.

### Navigation

- **Style:** quiet paper header, editorial brand lockup, sans navigation, and a circular appearance control.
- **State:** Verdigris underlines active hover paths on fine pointers; mobile opens a raised paper menu with the same controls.

### Route Journey

- **Style:** four chart-paper field notes alternate around one Verdigris path; Signal Rust marks the initial Annotation, Brass marks bearings, and Deep Ocean contains operational surfaces.
- **Route:** one normalized native-scroll progress value owns SVG draw, active checkpoint, and the traveling bearing. Continuous values stay outside React state. Reduced motion resolves the complete route statically.

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
