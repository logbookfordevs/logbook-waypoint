# The living field guide — Rive lab

Status: authorized alternate-universe lab; not canonical production or picture lock.
Scope: playable observation → Annotation → transition into Queue. No extension/server edits, push, merge, or publication.

## Direction

An open field guide treats a rendered interface as a specimen worth observing. A rust pin fixes the exact point; the specimen and its note become a retained work card. The visitor performs the causal action, rather than scrolling past a demonstration. Warm paper, ocean ink, restrained brass registration marks, Poppins structure, Literata narration, and IBM Plex Mono coordinates preserve Logbook identity.

The first frame pairs a large living folio with “Every change starts with a closer look.” Immediate setup and documentation paths stay visible. The three beats are Observe, Annotate, Queue. A typed note accompanies a sample target. Queue exposes the preserved note and target to make the agent handoff concrete; no agent work is claimed or executed.

Creative departure: a stationary tabletop and transforming specimen replace a traveling map camera. Short, interruptible Rive state transitions replace the mainline's authored travel legs. Silence is the default; an optional local tonal cue marks deliberate input. Reduced motion and failed enhancement use an illustrated static/readable alternative with identical controls.

## Production strategy

Real Rive RML, local CLI 1.1.0, native vector shapes, keyed poses, and a view-model-driven state machine. React sets the semantic chapter; Rive owns interpolation. No scripts or cloud signing required. The React canvas runtime is the explicitly requested medium, newly installed with pnpm. Runtime WASM is served locally. Original RML remains editable and reproducible; no stock `.riv` is repurposed.

Reference bar: The Boat's authored framing and material continuity, the storybook concept, and the canonical notebook/asset ledger. Local MP4 missing at the supplied Downloads path. The canonical production's approvals remain context, not lab restrictions.

## Evidence / operation

QA obeys `/private/tmp/waypoint-lab-qa-protocol.md`; only the lock owner may start rendering, browser automation, or a preview server. Port 3024 requested. Checks and screening evidence will be recorded here when executed.

## Technical checks before screening

- Website repository typecheck: passed (`pnpm --filter @logbookfordevs/waypoint-website check`). Initial restricted-network package install failed; authorized network install succeeded. pnpm subsequently repaired the local node_modules layout. The workspace's existing extension postinstall generated ignored types; no extension source changed.
- Rive `--verify` and `inspect --summary`: no errors or warnings; 81 shapes, 3 animation poses, 6 conditioned transitions, 1 view model, 0 scripts.
- The local website has no dedicated lint script. Impeccable detector ran once: advisory lab color/type-scale differences only. Canonical DESIGN.md is preserved.
- Four focused component tests protect note preservation across editing/Queue, empty-note gating, reduced-motion handoff, and direct Queue entry. Mocked runtime tests validate the host contract only; they do not prove Rive rendering.
- All synthetic interface data is labeled as a lab. The CTA routes to the existing `/docs/installation` page and does not claim store availability.

## Asset provenance and reproduction

`packages/website/rive/tools/author-field-guide.py` authors original scene geometry and all poses into `field-guide/scene.rml`. No third-party Rive animation is used. Local CLI 1.1.0 compiles it without scripts or publishing. The runtime files are from `@rive-app/canvas` 2.42.2, used via `@rive-app/react-canvas` 4.34.3. The fallback reuses `public/ink-route/chart-world-desktop-v1.webp` from the canonical [asset ledger](../../waypoint-ink-route/production/asset-ledger.md).

After obtaining the shared heavy-QA slot, reproduce with:

```sh
python3 packages/website/rive/tools/author-field-guide.py
/Users/leonardo/.rive/bin/rive packages/website/rive/field-guide --once
node packages/website/rive/tools/export-web.mjs
pnpm --filter @logbookfordevs/waypoint-website dev --port 3024
```

Preview route: `http://localhost:3024/labs/rive`. Stop the preview and your isolated browser before releasing the shared lock. Never run the restart command concurrently with another lab's session.

The preferred restart command is `node packages/website/rive/tools/preview.mjs`. It acquires the shared slot atomically, exports the real asset, copies matching WASM, starts only this preview on 127.0.0.1:3024, records process ownership, and releases after shutdown. Close the isolated browser before stopping this launcher.

## Surface contract and quality bar

Mode: Experience, within Waypoint's established Atlantic Chartroom identity. Code-led Rive medium study; the user explicitly authorized autonomous treatment and execution, so no concept tournament or approval gate applies to this lab.

THESIS: An observation becomes a portable piece of work through the visitor's own action.
OWN WORLD: Warm open folio, a cartographic study opposite an interface specimen, ocean structure and a rust annotation mark. The book is native authored Rive geometry, not CSS impersonating Rive.
FIRST VIEWPORT: Editorial headline and explanation occupy the left third; the open folio is the dominant object on the right. The installation path and pin action are immediately visible. Mobile gives the action and specimen their own vertical space.
SIGNATURE: The specimen enlarges into Annotation; its pin stays attached as it becomes a stacked Queue item. React supplies a chapter value, and Rive's state machine owns the interpolation. The note stays in semantic HTML and remains editable.
FINISH: Poppins / Literata / IBM Plex Mono roles, readable muted and reduced-motion equivalents, no fabricated delivery or public availability claims, keyboard controls, direct entry and replay.

This lab screens the interaction and graphic field-guide direction. It does not claim to match Route A's material ink bloom, or The Boat's complete cinematic production finish. Those are deliberate creative departures, not fulfilled dimensions of the original production master.

## Direct user authority for this lab

The user assigned the form explicitly: “Assigned experiment: Rive: a living interactive field guide, with freedom to reinterpret the entire map concept.” The user also instructed: “Freely reinterpret the storyboard, composition and interaction for your medium. Record a concise direction then proceed autonomously to a crafted playable cut through Annotation and the transition toward Queue—not merely a proposal or an entire site. Existing approvals are context, not lab restrictions.”

This is the direct authority for the pinned field-guide form and autonomous execution, overriding the skill's ordinary concept-tournament/approval sequence. It is not an inferred unattended-run exception. No concept-roll seed was generated or claimed.

FORM: A living field guide, explicitly assigned by the user, treats the interface as an observed specimen. The large open folio, contextual pin, and retained Queue card express that assigned form through native Rive geometry and semantic HTML.

## Screening — 2026-09-19

- Real Rive export: 18,733 bytes, no errors or warnings. Editable native RML source and Python authoring source retained.
- Desktop 1440 × 1000 and mobile 390 × 844: real canvas rendered the folio and transitioned through Annotation to Queue; no horizontal overflow. The captured recording shows both transitions.
- Keyboard: note entry, Tab/Enter submission, and focus transfer to the Queue receipt passed. Editing preserves the note.
- Reduced motion: media preference true, canvas count zero, complete Queue/reading content, no horizontal overflow. Readable-view forcing is now an explicit status, not an ineffective toggle.
- Forced `.riv` request abort: explicit fallback message, canvas count zero, and both actions still reached Queue with the note intact.
- Axe WCAG2A/AA scan on mobile Queue after contrast correction: 0 violations, 0 incomplete checks. This is scoped automated evidence, not a full accessibility certification.
- Four focused interaction tests pass; website typecheck and `git diff --check` pass. No website lint script exists in the baseline.
- Chromium trace includes local development startup and both Rive transitions: 13,493 task events, one task above 50 ms, maximum 109.927 ms. The long task occurs in script startup. This is not a production build or physical mobile performance validation.
- Browser and preview were stopped and the lock released after the main screening. A second serialized session was used for the independent reviewer's one UI correction.

Evidence: [desktop](evidence/desktop.png), [Queue](evidence/queue.png), [mobile](evidence/mobile.png), [reduced motion](evidence/reduced-motion.png), [motion recording](evidence/rive-cut-final.webm), [development trace](../../../../.impeccable/review/rive-trace.json).

Limitations: supplied Downloads MP4 unavailable; physical mobile and Safari not tested; sound is an optional synthesized acknowledgment rather than produced ink foley; motion recording is silent by default. The lab is an authored graphic exploration, not canonical production approval. No push, merge, or publication occurred.

## Design-system comparison — 2026-09-19

Compared the current `field-guide.tsx` and `rive-lab.css`, the four linked desktop/Queue/mobile/reduced-motion captures, this surface contract, root `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` using Impeccable's document reference. This is an ordinary isolated extension of Atlantic Chartroom. The canonical design files are preserved.

- Palette: local paper `#e9e1d3`, ocean ink `#173737`, and rust `#a7442b` retain Chartroom roles; brass remains fine illustration detail. These lab values do not replace the root tokens.
- Type: Poppins structures headings and controls; Literata carries narration and notes; IBM Plex Mono marks target and figure evidence. The local display is 600 at `clamp(38px, 3.5vw, 58px)/1.1`; secondary heading is `clamp(28px, 3vw, 45px)/1.2`; narrative is 16px/1.85. This compact ramp expresses the Bottle Letter rule without changing the canonical ramp.
- Layout and components: a two-column specimen workspace becomes vertical below 700px; the full-width mobile action, ruled receipt, 4px control corners, rust pin, and Ocean reading band support the Route Before Ornament rule. The folio and layered specimen are illustrations, not a new global card or shadow vocabulary.
- State: the retained note and target remain semantic HTML; named chapters, visible focus, SVG icons, and forced readable status keep the mechanism inspectable. Static captures and source support this comparison; motion timing was not independently reviewed here.
- Pre-existing drift: sidecar palette metadata differs from normative DESIGN.md (for example page `#f1f4f0` versus `#e9e5d8`, ocean `#071f25` versus `#102c2c`); snippets still use Waypoint Sans/Besley and its Three Jobs rule predates Bottle Letter. The sidecar also contains glyph icon examples. These are not repaired or endorsed by this lab pass. The lab's decorative “FIELD STUDY / LOCAL INTERFACE” registration eyebrow is not canonized as a reusable type rule; its presence is not authority to propagate it.

## Final verification addendum — 2026-09-19

Reported by the implementing agent after the final correction: the recaptured reduced-motion Axe scan returned 0 violations and 1 incomplete image-background contrast check, distinct from the normal mobile Queue scan's 0/0 result. The agent visually checked all four current captures and calculated a conservative 5.55:1 fallback text contrast bound using `#173737` over a worst-case black image at 0.28 opacity on `#f4ecde`. This calculation addresses that image-background uncertainty; it does not turn the automated incomplete check into an automated pass.

The independent reviewer's follow-up marked FORM and forced readable status resolved, with a ship disposition scoped to those two fixes. The motion recording remained independently unreviewed. Final `git diff --check` passed after the correction. The final browser was closed, preview launcher 87126 stopped, port 3024 had no listener, and the shared QA lock was released. This documentation pass opened no browser or server.

## Recovery snapshot — 2026-10-02

Preservation branch: `feat/lab-living-field-guide`. The snapshot includes the website route and tests, editable RML and generator, export/preview helpers, dependency lockfile, exported `.riv`, matching runtime WASM, and final screenshots and recording under `evidence/`. The fallback chart and brand mark are already tracked in the base repository.

After checking out the branch, install the locked workspace dependencies with `pnpm install --frozen-lockfile`. To view the preserved export without installing the Rive authoring CLI, run `pnpm --filter @logbookfordevs/waypoint-website dev --port 3024` and visit `/labs/rive`. Re-authoring requires the Rive CLI; the shared-slot preview helper additionally exports the RML before startup. During concurrent lab QA, acquire the shared slot before starting a browser or server and close both before releasing it. The original temporary protocol file is no longer present; the preview helper retains the atomic lock and process cleanup behavior.

Excluded from this snapshot: unrelated `.codex/environments/environment.toml`; installed dependencies and build caches; the superseded `.impeccable/review/rive-cut.webm`; the 43 MB local development trace `.impeccable/review/rive-trace.json`. The final screenshots and recording remain duplicated in their original ignored locations, but their preserved copies no longer depend on this worktree. No merge or worktree deletion is part of preservation.
