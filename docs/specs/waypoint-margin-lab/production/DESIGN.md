---
name: Waypoint Margin Lab
description: A lab-only editorial handoff from authored Annotation to local Queue.
colors:
  driftwood-paper: "#e9e1d3"
  chart-ink: "#172c29"
  annotation-rust: "#ab3e29"
  specimen-paper: "#f8f3e9"
  annotation-paper: "#fff9ed"
  queue-ocean: "#102c2c"
  queue-ink: "#f7efdf"
  queue-muted: "#c2d2c9"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "clamp(48px, 5.7vw, 88px)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.04em"
  editorial:
    fontFamily: "Literata, serif"
    fontSize: "clamp(15px, 1.3vw, 18px)"
    fontWeight: 400
    lineHeight: 1.8
  annotation:
    fontFamily: "Literata, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.55
  evidence:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
    letterSpacing: "0.035em"
rounded:
  sharp: "0"
  control: "3px"
  circular: "50%"
spacing:
  compact: "8px"
  control: "12px"
  field: "20px"
  paper: "24px"
components:
  install-action:
    backgroundColor: "{colors.chart-ink}"
    textColor: "{colors.specimen-paper}"
    rounded: "{rounded.control}"
    padding: "13px 19px"
  annotation-action:
    backgroundColor: "{colors.annotation-rust}"
    textColor: "{colors.annotation-paper}"
    rounded: "{rounded.sharp}"
    padding: "11px"
  retained-annotation:
    backgroundColor: "{colors.annotation-paper}"
    textColor: "{colors.chart-ink}"
    typography: "{typography.annotation}"
    rounded: "{rounded.sharp}"
    padding: "24px"
---

# Design System: Waypoint Margin Lab

## Overview

**Creative North Star: "The Margin Becomes the Message"**

This isolated alternate-universe lab turns an authored observation into visible work. An editorial spread and tilted specimen frame the target; rust brackets select it; the visitor's own note becomes a paper slip that crosses into a Deep Ocean docket without losing its text or element context.

This record is scoped to `/labs/margin`. It describes an experimental surface, not an approved change to the canonical Atlantic Chartroom system. Compared with the incumbent Ocean-led marketing world, the lab makes warm Driftwood Paper the principal field, gives display/editorial typography more dramatic scale and tilt, and uses one finite Motion-driven stage as the product explanation.

Evidence is bounded. Saved review frames predate the final eyebrow removal and `230px` queued-note cap. Source confirms both changes, but updated screenshots and visual scroll behavior remain unverified. The finish-review disposition remains **fix**: the procedural-record issue is resolved, eyebrow removal is only partially closed pending updated frames, the long-note cap is source-confirmed, motion was not independently reviewed, and this record does not claim full Impeccable procedural certification or a source-verifiable quality score.

**Key Characteristics:**

- Warm paper field, precise rust annotation marks, and a single dark Queue destination.
- Poppins structure, Literata authored thought, and IBM Plex Mono retained evidence.
- One visitor-driven story: select, write, pin, send, retain, then point toward a coding agent.

## Colors

Driftwood Paper carries the editorial field, Annotation Rust marks selection and current state, and Queue Ocean signals the local operational destination. Pale paper and green-gray ink variants distinguish nested specimens and retained records without adding another accent.

### Primary

- **Annotation Rust:** selection brackets, pins, current progress, input caret, Annotation labels, and the Pin action.

### Secondary

- **Queue Ocean:** the final docket that separates retained work from the editorial specimen.

### Neutral

- **Driftwood Paper:** full lab canvas.
- **Chart Ink:** body copy, navigation, and the documentation action.
- **Specimen Paper:** the tilted example page and light composition surfaces.
- **Annotation Paper:** the retained visitor-authored note.
- **Queue Ink and Queue Muted:** high- and low-emphasis content inside the docket.

**The Rust Means Annotation Rule.** Use rust for authored selection, active journey state, and Annotation actions; do not turn it into a general background fill.

## Typography

**Display Font:** Poppins, sans-serif

**Body Font:** Literata, serif

**Label/Mono Font:** IBM Plex Mono, monospace

**Character:** Poppins states the scene with compact editorial scale. Literata carries human observation and explanation. IBM Plex Mono verifies target, route, lifecycle, and illustrative status.

### Hierarchy

- **Display:** Poppins at the fluid display token, with a Literata italic second line for the authored turn.
- **Specimen headline:** Poppins at `clamp(45px, 5vw, 72px)` with the same tight tracking as the display.
- **Queue headline:** Literata at `39px/1.08`, reduced to `33px` on narrow screens.
- **Editorial body:** Literata at the editorial token and a bounded `36ch` measure.
- **Annotation:** Literata at the annotation token; the queued record wraps anywhere and caps at `230px` with vertical overflow.
- **Evidence:** IBM Plex Mono at `8–10px` for page metadata, selector/path context, state, and demo disclosure.

**The Three Voices Rule.** Poppins frames the scene, Literata carries human meaning, and mono proves what context survived.

## Layout

The main stage is a two-column editorial spread (`1.08fr 1fr`) with a narrative field facing a `450px` specimen theatre. The theatre layers circular registration guides, specimen, composer, retained note, and Queue docket in one semantic stage. At `700px` and below, the stage becomes a vertical sequence; the specimen remains visible, controls stay native, and nonessential captions are removed. At `1600px`, the stage stops growing beyond `1500px`.

**The Same Note Crosses the Boundary Rule.** The visitor's entered text and `h1 · /studio` context must remain visibly identical from pinned paper to queued record.

## Elevation & Depth

Depth comes from paper-on-paper layering and one dark destination. The specimen uses `0 25px 40px -16px #403a2c45`; the composer uses `0 20px 50px -15px #453c3055`; the retained note uses `0 20px 35px -20px #25302c66`. These soft shadows support the physical slip metaphor; the Queue docket itself stays flat.

## Shapes

Paper surfaces and form fields are square. The install control alone uses a restrained `3px` radius. Circles belong to registration or state geometry: orbit guides, the numbered pin, the Annotation index, and the next-step marker. Selection is drawn with open SVG brackets instead of a rounded container.

## Components

### Actions

- **Documentation action:** compact Chart Ink fill, pale paper text, `3px` corners, and a darker green hover.
- **Narrative action:** rust text with a thin underline; only its arrow translates on hover.
- **Pin Annotation:** solid rust, square corners, disabled opacity at `.45`, and native submit behavior.
- **Toolbar controls:** quiet text controls whose underline appears on hover or pressed state.

### Annotation Composer

The light paper composer overlays the specimen. Its Literata textarea is square, vertically resizable, capped at 200 characters, and paired with mono target evidence. Empty trimmed input disables Pin Annotation.

### Retained Annotation

The visitor's note is the signature component: Annotation index and lifecycle in rust mono, note text in Literata, and selector/path/context below a rule. Motion reuses one `layoutId` so the same record travels from pinned paper into the Queue.

### Queue Docket

Queue Ocean fills the theatre only at the final stage. It states LOCAL QUEUE, preserves the retained note above it, and ends at “Next stop: coding agent”; it does not simulate agent execution.

### Motion and Modes

The stage uses Motion DOM/SVG with a shared `0.85s` duration and `[0.22, 1, 0.36, 1]` easing, plus shorter `0.35s` copy transitions. Movement is finite and interaction-triggered. Reduced-motion and Readable mode resolve transitions at zero duration; Readable mode also exposes the complete mechanism in prose. Narration is opt-in and carries no exclusive meaning.

## Do's and Don'ts

### Do:

- **Do** preserve the authored causal chain: target selection → Annotation → Queue → coding-agent threshold.
- **Do** keep visible focus, native controls, reduced-motion behavior, and the complete Readable-mode explanation.
- **Do** label the theatre as an illustrative demo and keep the Queue local and inspectable.

### Don't:

- **Don't** autoplay the story, capture scroll, or imply that the demonstration sends real work.
- **Don't** extend this lab's paper-first editorial composition into the canonical system without a separate approval.
- **Don't** treat the removed eyebrow copy as a reusable label pattern; it was a finish-review defect, not a lab token.
