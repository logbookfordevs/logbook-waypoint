---
name: Waypoint Theatre Lab — The Marked Page
description: A paper editing desk where one marked observation becomes a retained Queue record.
colors:
  driftwood-paper: "#e9e1d3"
  ocean-ink: "#172b29"
  deep-ocean: "#173b37"
  deep-ocean-hover: "#24544d"
  specimen-paper: "#f6f2e8"
  annotation-paper: "#fbf5e8"
  signal-rust: "#b7432e"
  focus-rust: "#b94932"
  transfer-verdigris: "#35665d"
  retained-brass: "#c7b586"
  hairline: "#bcb5a6"
  ocean-paper: "#f1eee2"
typography:
  display:
    fontFamily: "Poppins, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(42px, 4.8vw, 72px)"
    fontWeight: 500
    lineHeight: 1.07
    letterSpacing: "-0.04em"
  narrative:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: "clamp(14px, 1.25vw, 18px)"
    fontWeight: 400
    lineHeight: 1.9
  operational:
    fontFamily: "IBM Plex Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.07em"
  readable:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.9
rounded:
  square: "0px"
  pin: "50%"
spacing:
  page-gutter: "5%"
  control: "12px"
  panel: "24px"
  panel-wide: "30px"
components:
  installation-action:
    backgroundColor: "{colors.deep-ocean}"
    textColor: "{colors.specimen-paper}"
    typography: "{typography.operational}"
    rounded: "{rounded.square}"
    padding: "12px 20px"
    height: "44px"
  film-action:
    backgroundColor: "{colors.deep-ocean}"
    textColor: "{colors.annotation-paper}"
    rounded: "{rounded.square}"
    padding: "13px 22px"
    height: "44px"
  annotation-note:
    backgroundColor: "{colors.annotation-paper}"
    textColor: "{colors.ocean-ink}"
    rounded: "{rounded.square}"
    padding: "24px 26px 0"
    width: "310px"
  queue-ledger:
    backgroundColor: "{colors.deep-ocean}"
    textColor: "{colors.ocean-paper}"
    rounded: "{rounded.square}"
    padding: "25px 30px"
    width: "min(40%, 540px)"
---

# Design System: Waypoint Theatre Lab — The Marked Page

## Overview

**Creative North Star: "The Marked Page"**

This isolated lab inherits Waypoint's Atlantic Chartroom type roles and turns them into a playable paper edit. Driftwood paper is the desk, a tilted specimen is the observed page, Signal Rust makes the mark, and Deep Ocean receives the same note as a retained Queue record. The visual proof is continuity: the note visibly travels and becomes operational evidence without changing identity.

Theatre.js is the edit authority. Its source-authored 16-second score drives page pose, chart aperture, mark, note, transfer, handoff, Queue, and record reveal through CSS custom properties. The film pauses at Annotation and Queue, while scrub, pace, skip, replay, sound, and readable controls expose the composition rather than hiding it.

**Key Characteristics:**

- One continuous paper specimen moves from observation to retained work.
- Poppins constructs the interface, Literata carries the human story, and IBM Plex Mono identifies operational context.
- Flat editorial controls and ruled ledgers sit over a restrained, inherited chart plate.
- Every animated chapter has a readable, silent, reduced-motion, and failure-tolerant path.

## Colors

Warm paper carries the edit; dark Ocean establishes retained state; Rust and Verdigris describe the handoff rather than decorating it.

### Primary

- **Deep Ocean:** masthead actions, film transport, specimen target, the persistent mobile control, and the final Queue ledger.
- **Signal Rust:** the hand-drawn target, Annotation index, selection, hover underline, and visible keyboard focus.

### Secondary

- **Transfer Verdigris:** the authored path that connects the marked note to the Queue.
- **Retained Brass:** the Queue record number, used as a small retained-state accent.

### Neutral

- **Driftwood Paper:** the full editing desk and readable transcript canvas.
- **Ocean Ink:** primary type, rules, and the authored mark's contrast partner.
- **Specimen Paper:** the illustrative browser page.
- **Annotation Paper:** the traveling note.
- **Hairline:** quiet dividers across masthead, captions, controls, edit rail, transcript, and footer.

**The Signal Has a Job Rule.** Rust marks human intervention, Verdigris carries the transfer, and Brass confirms retention; none becomes a general surface fill.

## Typography

- **Display and UI Font:** Poppins, Avenir Next, Segoe UI, sans-serif
- **Narrative Font:** Literata, Georgia, Times New Roman, serif
- **Operational Font:** IBM Plex Mono, SFMono-Regular, Consolas, monospace

**Character:** The inherited three-font system becomes editorial casting. Poppins builds the page and controls, Literata supplies voice and emphasis, and Plex Mono labels time, target, chapter, and retained context.

### Hierarchy

- **Display:** medium Poppins with tight tracking names each chapter and gives italic Literata phrases the emotional turn.
- **Narrative:** Literata carries chapter explanations, captions, the Annotation, and the readable transcript with generous leading.
- **Operational:** small Plex Mono identifies folio, browser location, Annotation index, target, Queue state, edit time, and chapter destinations.
- **Readable:** the transcript raises Literata to a sustained 17px/1.9 reading measure inside an 850px column.

**The Three Jobs Rule.** Sans constructs, serif narrates, and mono verifies. The specimen's tiny type is illustrative scale, not a reusable reading role.

## Layout

Desktop uses a 98px masthead, a stage capped by viewport width (`min(680px, 70vw)`), and a 5% page gutter. The chapter copy occupies the left third to half; the specimen begins on the right, comes square for Annotation, then recedes behind the Queue. Caption, transport, edit rail, and provenance footer remain in normal flow below the stage.

At 650px and below, the stage becomes a 970px vertical composition: copy leads, the specimen begins at 310px, and the Queue occupies 88% of the viewport width. Controls stack, and the primary playback action is duplicated as a fixed 48px mobile control at the bottom edge so checkpoint continuation remains reachable while the action is in view. The readable mode leaves the film entirely and uses one bounded editorial column.

**The Reachable Playback Rule.** On narrow screens, the current chapter action persists above the viewport edge; it uses the same play state and destination logic as the main transport.

## Elevation & Depth

Depth belongs to paper handling. The specimen, traveling note, Queue ledger, and persistent mobile control use soft Ocean-tinted shadows; all other hierarchy comes from overlap, angle, scale, and ruled separation. The specimen begins tilted, squares up for marking, and recedes as the Queue advances.

### Shadow Vocabulary

- **Specimen lift** (`0 28px 65px #26372e30, 0 7px 20px #26372e18`): the observed browser page.
- **Annotation lift** (`0 14px 40px #38302424`): the detached note during its handoff.
- **Queue lift** (`0 24px 60px #172b292d`): the retained record over the receding page.
- **Mobile control lift** (`0 5px 24px #172b2930`): keeps the continuation action distinct from moving content.

**The Paper Owns Depth Rule.** Shadows express physical separation in the edit; flat controls and rules remain flat.

## Shapes

The lab is deliberately square: buttons, notes, ledgers, fields, and panels have no radius. Circles are limited to measured marks: browser dots and the numbered Annotation pin. The irregular SVG loop reads as a hand-drawn editorial mark; the authored transfer curve is a precise connective notation.

## Components

### Film Transport

- **Primary action:** square Deep Ocean control, at least 44px high, with a thin Rust inset line on hover.
- **Secondary actions:** square 44px restart and skip controls stay visually quiet until hover or focus.
- **Preferences:** sound is opt-in and readable mode is always adjacent to transport.
- **Mobile:** the active play/pause/continue action persists as a fixed 48px control below 650px.

### Specimen Page and Mark

- **Surface:** tilted warm browser page with a small operational chrome and Literata field-note content.
- **Target:** one Deep Ocean action is circled by a crisp Rust SVG trace and numbered pin.
- **State:** Theatre moves the page from wide framing to a readable mark, then recedes it behind the Queue.

### Annotation Note

- **Surface:** square warm note with Literata comment, mono index and target, and ruled confirmation.
- **Behavior:** it rises after the mark, then translates and straightens toward the Queue before its duplicate record resolves in place.

### Queue Ledger

- **Surface:** Deep Ocean ledger with ruled metadata rows, pale paper text, Verdigris state, and a Brass record number.
- **Behavior:** the ledger reveals first; the retained record appears only after the note completes its handoff.

### Edit Rail

- **Purpose:** exposes the authored Theatre composition with a 0–16 second scrubber, three chapter destinations, and 0.75×, 1×, and 1.25× pacing.
- **Constraint:** reduced motion disables continuous scrubbing and resolves play to the next stable chapter.

### Readable Story

- **Purpose:** preserves the complete Annotation → Queue → coding agent meaning when the film is declined, motion is reduced, Theatre fails, or scripting is absent.
- **Surface:** one 850px editorial column on Driftwood Paper with ruled chapter rows and an installation action.

**The One Score Rule.** Theatre owns all composition channels and checkpoints; React owns lifecycle, preferences, and semantic chapter state; CSS renders the values.

## Do's and Don'ts

### Do:

- **Do** preserve the same comment and target as they move from marked page to Annotation note to Queue record.
- **Do** keep sound optional and synchronize the single narration element to Theatre position, pause, seek, visibility, and disposal.
- **Do** resolve reduced motion to stable chapters and keep the complete story readable without animation.
- **Do** retain provenance when reusing the chart plate or narration: the plate comes from the Route A asset ledger, and the voice is the authorized Spuds Oxley ElevenLabs take recorded in the canonical notebook.

### Don't:

- **Don't** animate the handoff with a second timing owner or infer chapters from CSS transitions.
- **Don't** hide the next checkpoint action below moving content on mobile.
- **Don't** promote specimen-page microtype to product reading typography.
- **Don't** treat the reused chart plate or narration as newly generated, rights-cleared, or finally accepted media.
