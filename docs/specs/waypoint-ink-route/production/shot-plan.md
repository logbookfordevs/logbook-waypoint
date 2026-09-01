# Waypoint Ink Route — Preproduction Shot Plan

**Status:** Narrative blocking and the original tracer boundary were approved on 2026-08-31. The SVG-first medium and original creative-evidence contract were superseded on 2026-09-01 by [`medium-scout.md`](./medium-scout.md); preserve this plan as the governing shot sequence, not the active render strategy.

**Approved source:** [Ink Route treatment](./treatment.md)

**Boundary:** The hero-to-Ink Route transition and arrival at the first Annotation destination. Queue, Agent, Resolution, final copy, final illustration, and full-page production remain outside this cut.

## Directing principle

The visitor's action causes the map, but the transition must preserve a genuinely empty paper beat. The recommended blocking uses **positional causality**: the journey control disappears with the hero, the frame holds on unmarked Driftwood Paper, and the ink drop strikes the paper where the control's route arrow last occupied the composition. The interface does not literally morph into ink.

One normalized entrance progress value owns the visible transition. Native scroll can move it forward or backward. Activating **See the journey** enables sound and advances through the same scroll range; it does not start an independent cinematic clock.

## Proposed sequence

| Shot | Local progress | Framing and subject | Picture and action | Motion role | Sound | Interruption / fallback |
| --- | --- | --- | --- | --- | --- | --- |
| 01. Useful hero | Before entry | Static wide product frame on Driftwood Paper; copy and CTA left, Thelu right, quiet map evidence behind | `Get Waypoint`, `See the journey`, and Docs are immediately available. The frame waits indefinitely. | Orient | Silent | Ordinary links remain usable. Reduced motion is identical. |
| 02. Contact | Pointer/touch/key press | Detail emphasis remains inside the wide frame | Journey control compresses slightly and its route arrow darkens. Release commits; pointer cancellation restores the hero. | Confirm | Optional dry paper-touch one-shot, subordinate to ink | Escape or canceled pointer returns to the stable hero. Repeated activation is ignored after commit. |
| 03. Clear the frame | `0.00..0.28` | Wide frame, no camera move | Copy, Thelu, navigation ornament, and controls fade as one authored layer with a shallow upward release. Paper and texture remain still. | Exit | Silence | Reverse scroll restores hero opacity and position. Reduced motion skips the exit. |
| 04. Empty paper | `0.28..0.42` | Static extreme wide of uninterrupted `#e9e1d3` | A deliberate blank hold. No origin marker, mascot, UI, coastline, or route is visible. | Focus | Silence | The hold shortens on small screens and disappears under reduced motion. |
| 05. Ink impact | `0.42..0.56` | Extreme close-up implied inside the same static viewport | A black-brown point appears at the remembered CTA-arrow position, spreads through two irregular capillary rings, and leaves one directional edge. | Transform | Wet ink contact begins on the first rendered impact frame | Reverse scroll removes the bloom without replaying reversed audio. Backgrounding cancels audio and restores from visual progress. |
| 06. Route birth | `0.56..1.00` | The frame remains static while the route becomes the traveling subject | The directional edge resolves into three to five organic dashes. Sparse bearing marks appear only near the route. The final dash points beyond the viewport. | Connect | Paper-fiber scratch follows positive route velocity; gain falls to silence when progress stops | Reverse route travel is silent in the first tracer. Muted and unsupported paths retain complete visual meaning. |
| 07. Annotation arrival | First journey segment | Desktop: medium-wide target fragment beside a Rust checkpoint. Mobile: vertical target fragment below the route. | Scroll extends the route into the first destination. A minimal Target outline and retained-context evidence appear only after the checkpoint closes. | Reveal | Short nib lift / paper tap at checkpoint completion | Direct entry shows the completed first segment. Reduced motion presents the route and evidence statically in document order. |

## Entrance rhythm

The tracer should compare two edits without changing composition:

- **Take A — Quiet cut (recommended):** approximately `900–1050ms` from committed press to first completed dash. Blank paper receives roughly `160–200ms`.
- **Take B — Held breath:** approximately `1200–1350ms`. Blank paper receives roughly `280–340ms` and the ink bloom develops more slowly.

The comparison exists to judge anticipation and release. Neither duration is approved until screened in motion with sound.

## Input and focus coverage

- **Pointer:** press feedback begins on contact; leaving or canceling before release restores the hero.
- **Touch:** the same control commits on release without hover-only preparation.
- **Keyboard:** Enter or Space commits the journey. After the entrance completes, focus moves to the visible journey heading without adding another scroll jump.
- **Manual scroll:** traverses the same visual progress silently until the visitor deliberately enables sound.
- **Reverse scroll:** reconstructs the hero and route deterministically. One-shot impact audio does not replay in reverse.
- **Escape after commit:** does not interrupt the short entrance mid-frame; a persistent Back to hero control becomes available when the journey state is established.
- **Direct hash entry:** enters at the first stable journey frame rather than replaying an intro the visitor did not request.

## Responsive coverage

### Desktop and wide tablet

- Hero uses a two-subject frame: product promise and actions on the left, Thelu on the right.
- The remembered ink-impact coordinate originates near the journey control's arrow, inside the left/lower third.
- The first route arcs toward the center before departing below the fold, preserving room for the Annotation evidence.

### Mobile at 375 CSS pixels

- Hero becomes a deliberate vertical composition: brand and promise, actions, then a smaller Thelu frame.
- The journey control remains above the fold on the working device floor.
- The ink-impact coordinate resolves below the action group rather than retaining a desktop x-position.
- The route becomes a vertical bearing and the Annotation evidence follows in normal document order.
- No horizontal map pan, clipped desktop canvas, or gesture-only navigation is introduced.

### Reduced motion

- Journey activation performs no fade, blank hold, ink bloom, smooth programmatic scroll, or continuous route draw.
- The anchor moves directly to a completed static first route segment and Annotation evidence.
- Focus moves to the journey heading, sound remains off, and the ordinary document continues below.

## Sound direction

- The Journey action is the audio-unlock gesture. `Get Waypoint` and Docs never enable sound.
- The empty-paper beat is silent.
- Ink contact is a short one-shot synchronized to the first painted impact frame.
- Route scratch is a small loop or procedural texture whose gain follows positive route-progress velocity.
- Stopping scroll ramps the scratch to silence quickly rather than pausing mid-sample.
- Reverse progress is silent in the tracer; a reverse paper texture remains a later creative option.
- Sound preference stays visible and mutable once the journey is entered.
- No narration, constant ocean ambience, or meaning carried only by audio.
- Haptics are excluded from the tracer so the signature visual and sound can be judged cleanly; a supported-device checkpoint pulse remains a later production option.

## Proposed tracer boundary

The tracer may implement only:

1. One responsive hero composition using existing identity and provisional copy.
2. Journey activation through pointer, touch, and keyboard.
3. Hero clear, empty-paper hold, ink impact, and first organic dashed route.
4. Scroll continuation to one simplified Annotation checkpoint.
5. Sound unlock, ink-impact cue, progress-responsive scratch, and persistent mute.
6. Static reduced-motion and muted paths.
7. Take A / Take B timing comparison.

The tracer must not implement Queue, Agent, Resolution, final production assets, full site navigation, final installation routing, or post-production polish.

## Dailies required for tracer screening

- Live cut with Take A and Take B selectable without code changes.
- Desktop recording at 1440 CSS pixels with pointer and sound.
- Mobile recording or real-device session at 375 CSS pixels with touch and sound.
- Keyboard journey activation and focus handoff.
- Reduced-motion static path.
- Muted and direct-hash-entry paths.
- Frame-time trace covering first ink impact and initial route draw.
- Exact note on any Safari/Web Audio resume or programmatic-scroll variance.

## Greenlight requested

Approve or revise the seven-shot sequence, positional-causality recommendation, timing comparison, sound behavior, responsive/reduced-motion coverage, and tracer boundary.
