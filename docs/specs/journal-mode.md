# Journal mode — PT-325

Status: Phase 1 implemented locally for user review; see [implementation record](../tracking/journal-mode.md). Later phases remain roadmap, not implementation scope.

## Problem Statement

Waypoint users want to leave personal explanations, observations, and presentation notes directly on an interface without requesting code changes. The current agent-work lifecycle does not express this purpose. Users also want annotations to feel like a beautiful personal journal: expressive pen marks, curved arrows, and readable notes attached to the things they are discussing.

## Solution

Add an extension-only Journal mode with multiple named journals over a page context. Preserve the existing annotation entry point and Target selection interaction. Users select something and write text; Waypoint supplies all decorative SVG marks automatically.

The active journal displays all its saved notes together as paper-like notes with a slight tilt, subtle depth, a piece of tape, and hand-drawn arrows to their Targets. A single journal visibility control hides or shows all its notes, pins, and drawings. Clicking away does not close saved notes. There is no empty placeholder note.

Phase 1 works on permitted localhost and non-localhost sites without the local server or MCP. Journal content persists locally and remains separate from agent work.

## User Stories

1. As a user, I want to enter Journal mode, so that my observations do not become code-change requests.
2. As a user, I want to use the familiar annotation entry point, so that I do not learn a new selection workflow.
3. As a user, I want named journals on the same page context, so that personal notes, architecture explanations, and demos can remain separate.
4. As a user, I want to create and select a journal, so that I can organize a new set of observations.
5. As a user, I want only the selected journal's pins displayed, so that unrelated notes do not clutter the interface.
6. As a user, I want to select an element and write plain text, so that capturing a thought is quick.
7. As a user, I want to pin a short text label, so that a small detail can carry an explanation.
8. As a user, I want to pin a small badge or other compact element, so that annotations are not limited to large containers.
9. As a user, I want existing supported point and element Target selection to remain available, so that Journal mode does not narrow familiar annotation capabilities.
10. As a user, I want automatic pen-like marks, so that I get a journal aesthetic without drawing anything myself.
11. As a user, I want all journal notes open together, so that I can read my thoughts across the interface without opening pins individually.
12. As a user, I want the arrow to point toward the intended Target, so that the relationship is unambiguous.
13. As a user, I want varied arrow origins and curves, so that the journal feels naturally composed.
14. As a user, I want each note's decoration to remain stable when reopened, so that the interface does not randomly change around me.
15. As a user, I want one hide/show control for the whole journal, so that I can reveal the underlying interface without managing individual notes.
16. As a user, I want to edit a saved note, so that I can refine my explanation.
17. As a user, I want to delete a note, so that temporary observations do not accumulate forever.
18. As a user, I want local persistence across reloads, so that I can return to my journal without a server.
19. As a user, I want journals on permitted non-localhost sites, so that I can annotate interfaces beyond my own development environment.
20. As a user, I want pagination values to distinguish journal contexts, so that notes for one page of results do not automatically appear on another.
21. As a user, I want common sorting and tracking changes to preserve journal availability, so that incidental URL changes do not fragment my notes.
22. As a user, I want unknown query parameters preserved, so that meaningful application state is not silently discarded.
23. As a user, I want a missing Target's note preserved and accessible, so that losing an anchor does not lose my writing.
24. As a user, I want to reattach a missing Target or delete its note, so that I can maintain journals as interfaces change.
25. As a user, I want familiar trash and storage-management controls to include journal data, so that I can explicitly clean it up.
26. As a user, I want scrolling and resizing to keep decorations aligned, so that arrows continue to describe the right thing.
27. As a user, I want readable notes on narrow screens and in either appearance, so that playfulness does not compromise usability.
28. As a keyboard user, I want to select pins, read notes, edit, and dismiss them, so that the journal is accessible without pointer-only interaction.
29. As a user, I want normal Annotations to retain their existing behavior, so that trying Journal mode does not change my agent workflow.

## Implementation Decisions

### Domain and ownership

- Preserve the glossary's Page definition: origin and pathname. View State remains query/hash state; Captured URL remains the exact original address.
- Introduce a Journal as a named local collection and a Journal scope as the Page plus normalized relevant View State. Do not redefine Page globally to implement journal matching.
- Journal entries reuse appropriate Annotation and Target capture concepts, but their purpose is explanatory text. They must not enter the Queue, become Pending agent work, generate Watch events, acquire Claims, or offer resolution/Design Intent/Variant Intent workflows in Phase 1.
- Use stable identities for journals and entries, journal membership, Captured URL, normalized matching information, text, captured Target context, and a stable visual seed or equivalent deterministic variation. Exact storage representation is an implementation choice, not an agreed schema.
- Reuse the extension's selection, overlay, message/storage boundary, and data-management foundations. Keep journal persistence and presentation cohesive; avoid duplicating the entire annotation stack.
- Do not expose public page-world journal CRUD. Preserve the ADR removing page automation and treat captured page data as untrusted. Do not change the server's loopback security boundary for non-localhost journaling.
- Preserve the existing Target Set ownership rule wherever existing multi-Target selection is reused: one shared entry owns its Targets. Do not split a shared note into separately managed per-Target entries. The prototype demonstrates single-Target cases; it does not establish new multi-Target UI behavior.

### Phase 1 interaction

- Place an Agent / Journal dropdown beside the pen inside the existing floating toolbar. Keep mode choices, journal creation, and the active journal picker inside that menu. In Journal mode, the list, copy, and trash controls operate on the active journal.
- Keep the familiar pinning/selection entry point. Journal mode changes purpose and presentation; it does not introduce pen, brush, freehand canvas, or manual doodle tools.
- Provide creation and selection of named journals. Show one active journal at a time as the initial presentation baseline. Multiple simultaneously visible layers are not required.
- Text is the initial content format. Do not expand Phase 1 into media upload, rich Markdown editing, embedded links, or guided tours. URLs may occur as ordinary text.
- All saved notes with visible Targets remain open together. Pin and list actions focus the corresponding note. The toolbar eye button hides/shows the whole active journal, including notes, pins, and drawings; the note corner close icon performs the same journal-wide action. Closing the editor cancels editing only. Click-away and Escape do not hide saved notes.
- Drag the tape/header to reposition a note. Release redraws its connector using the existing stable visual seed. Text and action controls do not initiate dragging. Manual positions last for the current page session; reloading restores automatic layout.
- When the pen is used without a journal in the current page scope, create a local journal with a playful suggested name and continue selection automatically. Explicit named journal creation remains available.
- Simple text Targets use browser-measured text bounds, including wrapped lines, for pins, note placement, circles, and arrow endpoints. Larger containers and mixed visual/control elements retain full element bounds.
- New pins immediately open a compact taped-note textarea using the same paper styling and placement as saved notes. There is no separate pencil icon.
- Double-clicking saved text (or focusing it and pressing Enter/Space) edits the same taped note in place, preserving its position, width, and handwritten styling. A checkmark or Cmd/Ctrl+Enter saves; the editor close icon cancels editing with the existing unsaved-change confirmation.
- Taped notes size to their content, with top-right delete and journal-hide icons. Collision-free placement is preferred; dense or narrow layouts use a scrollable note column. Long note bodies remain scrollable.
- Bound the menu notes list with its own scroll area and use icon delete actions; increasing note count must not grow the panel indefinitely.
- Preserve note edits locally; cancellation must not leave an accidental empty saved entry. Surface persistence errors instead of claiming a save succeeded.
- Missing Targets are an expected condition. Hide their anchored pins when they cannot be located, retain the text in journal management, label the missing Target, and offer reattachment or deletion. Do not invent fallback coordinates that imply a valid anchor.
- Deletion is permanent removal, not Resolved or Discarded. Integrate journals into existing explicit trash/storage cleanup semantics, preserving the scope and confirmation behavior of those controls. No automatic expiry is requested.
- Data & Storage contains Agent and Journal tabs. Journal menu storage access opens the Journal tab; Agent cleanup remains scoped to Agent data.
- The Journal tab offers an explicit confirmed reset of all journals and notes on this device, across page scopes, without deleting Agent data.
- Selecting a Target suppresses the entire selection gesture, including its completing click, so links and buttons do not activate while being annotated.
- During inspection, Enter selects the hovered Target and opens its editor in either mode. Arrow-key scope adjustments apply to Enter as they do to clicks; saving retains the existing editor shortcut.
- Journal's camera action copies the current visible viewport as a PNG, preserving notes and drawings while omitting Waypoint controls and tooltips. It restores controls on errors, explains capture/clipboard access recovery, and plays a short success sound only after copying. Agent copying remains text-based.
- Journal data is not expected to survive arbitrary redesigns forever. Users may clean it up when the underlying UI changes.

### Journal URL matching

- Retain the full Captured URL independently of the matching key.
- Preserve origin, pathname, meaningful query values, unknown parameters, and hash-based routes such as `#/dashboard`.
- The `page` parameter MUST remain significant. It was explicitly removed from the proposed ignorable list.
- Ignore ordinary section fragments such as `#details`; retain route-like hashes. Route detection is a bounded heuristic, not a claim to recognize every application's routing convention.
- Use a small explicit exception list for recognized sorting parameters: the discussed baseline is `sort`, `sortBy`, and `sortOrder`. Include recognized tracking parameters through a bounded documented list; the exact tracking list remains an implementation proposal to review, not an unlimited pattern that strips arbitrary parameters.
- Normalize ordering of distinct query keys. Preserve duplicate-key value ordering unless equivalence is established; do not silently change applications that assign meaning to repeated values.
- Do not guess the meaning of arbitrary names such as `banana`. Preserve them.
- Accepted trade-off: ignored sorting state may change the record at a matching DOM position. Matching journal scope is not proof of Target identity. Reuse current Target tracking rather than promising semantic record matching.
- Keep normal Annotation Page matching unchanged. Revisit exception policy only with evidence from actual usage; a configurable URL-rule editor is not Phase 1 scope.

### Visual direction

- Preserve the approved taped-paper note: readable content, a restrained tilt, subtle depth, and a small tape treatment. Handwritten styling is welcome where readable; do not sacrifice long-text legibility.
- Draw outlines and arrows with Waypoint-owned SVG geometry. Circles should have asymmetric proportions, a loose closure or small overlap, and a deliberate pen gesture. A regular ellipse with noisy edges is not the visual target.
- Vary arrow attachment between suitable note edges and vary the curve. Use a stable seed per entry rather than rerandomizing on render, scroll, or selection.
- Space and legibility override a randomly preferred edge: route around note content and important controls, stay within the viewport, and adapt on narrow screens. Top/bottom/left/right variation is a design vocabulary, not a requirement to force every edge in every layout.
- Orient arrowheads along the final curve tangent toward the Target. The initial fixed-angle prototype arrowhead was a defect, not a design decision.
- Size decorative geometry to the Target, including tiny text and badges. Keep pin hit areas usable without masking the text. For a point Target without element bounds, use its existing point marker rather than inventing an enclosing element.
- Display outlines and arrows with all visible notes. Hide connectors for clipped notes in the scrollable column. Journal-wide visibility applies to every decoration together.
- Recompute geometry as needed for document scrolling, nested scrolling, resizing, and relevant layout changes. Keep decorative layers from intercepting ordinary page interaction.
- Preserve keyboard focus, meaningful accessible pin labels, theme legibility, and reduced-motion behavior. Continuous wobbling is not required.
- Do not add Drawably now. Its ellipse roughness does not provide the approved gesture, and its arrow positioning has unsuitable scrolling limitations. Keep it as an optional future reference; reconsider only for a concrete feature where its benefit is demonstrated.

## Testing Decisions

- Main implementation seam: the existing extension UI/event/message/storage boundary, exercising actual entry creation and presentation against controlled page DOM and simulated Chrome storage/runtime.
- Prior art: extension annotation-creation tests load the built scripts with a DOM harness and simulated runtime; overlay-visibility tests exercise visible state and persistence; Page identity tests verify matching independently; data-management tests verify summaries and deletion scopes. Extend these patterns instead of adding a new testing framework.
- Test external behavior: create, select, edit, reload, switch journals, dismiss, delete, and reattach. Assert visible notes, persisted content, and correctly scoped data rather than private helper calls or exact SVG strings.
- Verify journals never enter agent sync/Queue paths and work when the server is unavailable. Verify normal Annotations still use their existing Page identity and lifecycle.
- Cover journal matching through a compact table of observable examples: `page=1` versus `page=2` differs; sorting-only changes match; reordered distinct keys match; unknown values differ; section fragments match; different hash routes differ; invalid URLs do not match. Cover duplicate keys without assuming their order is irrelevant.
- Verify missing Targets preserve data and expose reattach/delete actions. Verify explicit storage cleanup includes intended journal data and does not silently delete unrelated work.
- Use real browser checks for geometry the DOM harness cannot validate: large elements, short text, small badges, document/nested scrolling, resized layouts, long notes, and viewport edges. Confirm arrow tips point toward Targets and paths avoid the note body. Include narrow width, light/dark appearance, and keyboard dismissal.
- Compare representative rendered states to the approved prototype for note material, loose outlines, and varied curves. Do not snapshot every random coordinate; use stable seeds for reproducible visual cases.
- Run the extension's relevant tests and repository-required typecheck for TypeScript changes. Keep execution evidence in the implementation record.

## Out of Scope

- Phase 2 agent integration, CLI publishing contracts, server synchronization, and automatic DOM discovery.
- Phase 3 sharing, collaboration, permissions, or hosted journals. Local visible-viewport screenshot copying is included in the Phase 1 trial.
- Phase 4 rich Markdown authoring/rendered preview and media support; the first candidates are uploaded/pasted images and GIFs, without dedicated external-media embedding.
- Phase 5 optional ordered Next/Previous walkthroughs.
- Freehand drawing tools, new source-analysis capability, automatic Target healing across arbitrary redesigns, cross-device persistence, Drawably adoption, and replacing normal Annotation semantics.
- Publishing the prototype. The accidental Sites publishing request was explicitly cancelled.

## Further Notes

- Phase 2 assumes an informed agent. Knowledge may come from a repository, research, or conversation with the user; repository access is not a prerequisite. The future contract lets that agent discover or identify DOM Targets and author explanatory journal entries. Transport and tool choice are deferred.
- Phase 3 must evaluate a screenshot decorated with journal-like doodles as an alternative to live shared anchors. This alternative has already been recorded in PT-325. Sharing details remain undecided.
- Phase 4 enriches content; Phase 5 introduces optional ordered walkthroughs. Neither should expand Phase 1 acceptance criteria.
- Visual evidence is the [interactive Journal playground](/Users/leonardo/.codex/visualizations/2026/09/24/01a0d456-9835-7561-9e6e-92afae6a34de/journal-playground.html) produced in this conversation, especially its taped notes, corrected curved arrows, varied note-edge origins, and Small details examples. It is a visual reference, not a production architecture or comprehensive behavior implementation.
- The prototype and this specification take precedence over PT-325's original media-in-Phase-1 wording. The tracker records the Phase 3 screenshot alternative and a concise implementation dashboard; this file remains the detailed specification.
- Supporting references: [Drawably](https://github.com/Danilaa1/drawably) remains optional future context. Existing Page/Target/Queue definitions and the loopback-only, no-public-CRUD, and Target Set ADRs remain governing constraints.
