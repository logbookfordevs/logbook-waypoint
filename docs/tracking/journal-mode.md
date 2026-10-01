# Journal mode — PT-325 implementation

Status: implemented locally, awaiting Leonardo's review. No commit, push, release, or publication. PT-325 remains In progress; later phases are not implemented.

## Changes

- Added the Agent / Journal menu beside the existing toolbar pen. Journal selection, creation, missing-target recovery, and explicit storage cleanup live in the extension.
- Kept text journals in a separate local storage record with serialized background writes; they do not enter the agent Queue or server synchronization.
- Reused element selection and multi-target capture, with one shared note per target set.
- Added taped notes, a bundled OFL-licensed Caveat font, deterministic SVG outlines and curved arrows, and small-target pins. All saved notes now remain open together. The eye button and note corner close icons hide/show the whole journal; closing the editor only ends editing.
- Preserved full captured URLs while matching normalized journal scopes. Pagination and unknown query values remain meaningful; only the explicit sorting/tracking list and ordinary section fragments are ignored.
- Added model and UI-boundary regression coverage for persistence, missing targets, reattachment, save errors, and separation from agent data.

## Verification

- Extension suite: 178 tests passed, 0 failed, including dependency parity between built-in and manually permitted sites.
- Repository `pnpm check`: extension and website TypeScript checks passed.
- Extension production build and `git diff --check`: passed.
- Loaded the actual unpacked build in isolated Chrome on a controlled localhost page, with no Waypoint server required.
- Verified create/select/save, reload persistence, small text targets, missing-target management, reattachment to a badge, Agent/Journal separation, and distinct pagination scopes.
- Visually checked desktop and 390px layouts, taped-note typography, outline/arrow placement, and Night Watch contrast.
- Verified a nested scrolling panel hides a fully clipped target's pin and restores it when visible. Escape closes menus or the editor while saved notes remain open. No browser errors were reported.

## Handoff and limits

Load or reload `packages/extension/.output/chrome-mv3` as an unpacked Chrome extension, then refresh the page and choose Journal beside the pen.

Browser checks used controlled localhost fixtures. The permitted-site injection list includes the journal modules, but arbitrary third-party sites and all possible page layouts have not been manually verified. Existing selector matching remains intentionally fallible after data or UI changes. Journals are local to this browser profile, without sharing, agent authoring, media, or walkthroughs.

The first tracker update was rejected by automatic approval review. Leonardo subsequently explicitly authorized PT edits; the implementation dashboard is recorded on PT-325 without replacing the original roadmap.

## Always-open journal refinement

- User superseded the selected-note-only behavior: all notes now open together, with content-sized paper and top-right SVG icon actions. Journal visibility affects notes, pins, and drawings together.
- Added non-overlapping placement candidates and a scrollable column fallback for dense or narrow layouts. Bounded the menu list height and replaced row Delete buttons with accessible icons.
- Corrected select chevron inset, vertical alignment, and theme color; retained the nonshrinking Create button.
- Regression coverage verifies all notes render together, global visibility preserves data, and editing/deleting one note preserves the others. Browser checks covered two simultaneous notes, menu spacing, 390px width, and the scrollable note-column layout.

## Inline editing refinement

Saved notes now enter an inline textarea on double-click or pencil activation. The same card and its placement are retained, with handwritten typography, an auto-growing textarea, a save checkmark, and Cmd/Ctrl+Enter support. Verified in actual Chrome: the card node stayed identical, its top position did not change, and saving returned the updated text to reading view. All 178 extension tests passed; the production build and diff whitespace check passed.

## Consistent pin creation

Removed the separate pencil action. New pins now start in the same compact taped-note textarea; saved text supports double-click or keyboard Enter/Space to edit. Browser-verified creation and saving; all 178 extension tests and production build passed.

## Draggable notes

Added pointer-captured dragging from the tape/header, viewport bounds, and connector regeneration on release. Positions are retained for the current page session only. All 179 extension tests pass, including dragging without mutating note text.

## Journal menu polish

Grouped the selector and visibility icon on one row. New journal creation is disclosed on request after the first journal exists; first-use creation stays visible. Added a note count and quiet Manage storage footer. All 180 extension tests and build passed, including creation disclosure; browser-checked at 390px width.

## Selection freeze fix — 2026-09-30

Reproduced a nested-event ordering bug: Journal can synchronously stop inspection during inspection:started, after which the toolbar incorrectly sets its own flag back to active. The toolbar now reads the actual inspector state, including when toggling selection. Also reproduced capture retaining temporarily disabled inspection while waiting for asynchronous context; Journal now stops inspection before that wait, preserving any reattachment request separately. Both regressions failed before the fixes. All 182 extension tests and production build passed. Actual unpacked-browser check confirmed rejected selection leaves the toolbar stopped and subsequent journal creation/target selection works. The reported third-party page was not directly reproduced.

## Text bounds and first-use creation

Simple text targets now use Range text bounds for journal geometry, avoiding blank container width. Wrapped lines use their combined bounds; sections and mixed media/control targets retain element bounds. First pen use without a current journal automatically creates a playful named local journal and resumes selection. All 183 extension tests and production build passed.

## Storage integration and selection gesture protection

Moved Journal storage into Data & Storage with Agent and Journal tabs, preserving separate cleanup scopes. Removed the standalone settings action. The menu footer opens the Journal tab and now uses a bordered button separated from a clearer first-note hint.

Reproduced a completing-click leak after Journal synchronously stopped inspection on pointer-down. A gesture-specific capture guard now suppresses the remaining mousedown/click independently of inspector state and releases on completion or a new gesture. Regression failed before and passed after the fix. All 184 extension tests and production build passed. Actual browser checks confirmed the fixture click action remained at zero while a note editor opened, the footer selected Journal storage, and switching to Agent showed existing cleanup controls. Browser errors were empty.

## Extension typeset and polish

Kept the extension's Driftwood identity and existing bundled Inter/Caveat fonts. Added shared typography role tokens, consistent headings and control text, larger help text with more leading, and matched 24px handwritten reading/editing text. Completed missing Queue surface/font aliases, global keyboard focus and browser selection styling, theme-aware scrollbars, reduced-motion coverage, narrow popover/dialog bounds, and clearer storage tab spacing. Tiny numeric badges and precision editing controls retain their intentionally dense sizes. The typography detector's remaining 24 advisories compare these extension controls against the website's DESIGN.md ramp; the website design system was not changed during this extension refinement.

Added Enter to select the hovered inspection Target for both Agent and Journal, including the scope chosen with arrow keys. Existing editor save shortcuts remain unchanged. All 185 extension tests and production build passed, including the shared selection regression. Actual browser checks verified Enter opens both editors, inspected settings in light/dark and at 390px, inspected Queue, and measured saved journal text at 24px/32.4px without horizontal clipping. Browser errors and diff whitespace checks were clean.

## Direct toolbar mode switching

Replaced the dropdown mode button with an Agent/Journal segmented control. Mode changes no longer open a menu; the Journals icon owns journal selection and management. Removed duplicate mode controls from the picker and retained current journal selection across switches. Narrow toolbar spacing keeps the full controls on one row at 390px. All 186 extension tests pass; the final production build and diff checks passed. Browser-confirmed direct switching sets the active state without opening the picker, and the user confirmed the interaction works.

## Screenshot clipboard trial

The pre-trial Journal checkpoint was committed and pushed on feat/journal-mode. Journal's copy control now copies a visible-viewport PNG instead of note text. Toolbar, menus, inspection chrome, and tooltips are hidden during capture; notes, pins, and journal drawings remain. The camera control has no native or custom tooltip and retains an accessible name. A brief synthetic shutter sound plays only after clipboard success. No new permissions or libraries were added.

Capture failures restore the controls and show an error in the Journal panel. Missing activeTab access explains how to enable capture by invoking the extension's browser action; clipboard denial explains allowing clipboard access and retrying. All 188 extension tests and the production build pass. Regression coverage exercises PNG transfer and control restoration for both capture and clipboard errors. The isolated browser reproduced the temporary capture permission requirement; the user confirmed screenshot copying works in their browser and reported the tooltip defect, which was subsequently removed. Automated OS clipboard verification encountered headless browser focus limitations and is not claimed as a passing paste check.

## Full Journal storage cleanup

Added Clear all Journal data to the Journal storage tab, using the existing destructive-action styling. Confirmation explains device-wide scope and preserves Agent data. The command runs through the serialized journal storage boundary, clears all journals and notes across page scopes, and resets current selection and session presentation state. Regression coverage verifies cancelling does nothing, accepting removes journal data and visible pins/cards, and Agent storage remains unchanged.

## Journal documentation

Added a dedicated Journal user guide and website article, linked from the repository documentation map and README. Updated everyday settings, privacy disclosures, store permission notes, and developer entry points. The guides use release-ready wording at the user's request; this does not record a release or website deployment.

The website guide annotates its own actual paragraphs with authored taped margin notes, measured SVG circles, and curved arrows. It is explanatory page content, without a simulated toolbar, editing demo, extension storage writes, or MCP calls. A real extension screenshot captured on a controlled sample page is included in both the website and Markdown guide. Desktop and 390px browser checks confirm the notes render and the page has no horizontal overflow. Website tests, repository typecheck, and the production website build pass.
