# Official homepage composition

Approved scope: start directly inside the OpenDesign Ink Map Journey, continue into the main hero, then the promoted Editorial Adventure and existing local-first section. This supersedes the earlier optional-dialog composition. Other experiments and Labs hosting remain deferred.

## Visitor flow

1. **Opening map:** The first viewport starts the existing ink-drop sequence automatically, without a discovery click or modal. Preserve the chart, camera, route, and checkpoint cards. Skip to details remains available, including while the engine loads or fails. Docs lives in the hero reached by Skip, not in the immersive map. The journey progresses through scroll, swipe, keyboard or checkpoint controls.
2. **Continuation and hero:** At the full-route overview, a fresh downward scroll flows natively into the hero. Leftover momentum does not skip the overview. More details or Skip to details scrolls to and focuses the hero. The map remains in the document; scrolling back up returns to the same chart, without a redundant hero return link. Replay in the overview explicitly restarts the ink sequence. Hero installation and setup links remain available immediately after skipping.
3. **Editorial:** A small mark. A clear direction. Visitors select a sample heading, edit a brief, pin it, and send the same note to a demo Queue. Native scrolling stays available. Demo context is synthetic and clearly labeled; nothing is persisted or sent, and no agent execution is fabricated. Replay resets only this example.
4. **Local by default:** Retain the existing security/lifecycle explanation, extension and CLI setup links, docs, source, and official footer.

## Acceptance

- Desktop and mobile retain the established palette, typography, assets, and expressive Editorial specimen.
- Initial homepage loads the map engine automatically. Rendering pauses when the map is offscreen or the page is hidden and resumes the same scene when revisited. Renderer resources are released on page unmount or context loss.
- Map navigation, final continuation, early exit, reduced motion and WebGL fallback remain usable.
- Map input is captured only while its inline viewport is fully at the top; it must not intercept the hero, Editorial or docs links. Native document scrolling remains available outside it. Explicit continuation transfers focus to the hero; ordinary scrolling does not force focus. The hands-on form has accessible labels, blank-note validation, and visible focus.
- A custom note and its target context survive the pin-to-Queue transition. Long notes remain fully readable, and replay restores the example.
- Promote the actual Editorial source, including Motion 13.4.0 choreography: animated copy, specimen tilt/departure, drawn brackets, form arrival/exit, shared-layout retained-note transfer and progress draw. Do not substitute a CSS-only reconstruction. Verification must inspect live temporal behavior, not only still captures.
- No Labs index, other experiment engines, storage calls, analytics, or audio are added.

## Deferred

Sound effects and narration are a final creative decision, not part of this composition pass. Labs discovery, source ownership and deployment architecture will be discussed separately.

The opening runs silently for now. A later optional sound-enabling interaction belongs in the opening, without reinstating a required gate to discover the journey. Do not autoplay audio, add fake sound controls, or assume a page refresh grants audio permission. Audio content, narration and consent mechanics remain at the final sound gate.

## Design-system reconciliation

The existing Day Chart palette, font roles, authored geometry and Thelu assets remain authoritative. This composition replaces the older homepage route presentation, not the shared design system. Root `DESIGN.md` still describes an alternating native-scroll route, an illustrative Resolve control and earlier navigation; those descriptions were already stale against the approved OpenDesign map. This scoped specification records the current homepage behavior. Global `DESIGN.md` and its sidecar are preserved; a broader documentation refresh remains separate from this composition pass.

## Source references

- Main hero and local-first content: `packages/website/components/route-journey.tsx`.
- Approved map: `packages/website/components/ink-map-journey.tsx` and `ink-map-engine.ts`; existing OpenDesign provenance stays intact.
- Editorial reference: branch `feat/lab-editorial-adventure`, commit `50a6588`, `packages/website/app/labs/margin/`. Its standalone shell and audio are not promoted.

## Editorial promotion

`editorial-demo.tsx` is adapted directly from `margin-lab.tsx`; `editorial.css` retains the experiment's specimen, stage and note styles. Motion 13.4.0 replaces the rejected CSS-only reconstruction. The standalone navigation, sound/readable controls and attribution are omitted because the homepage owns those boundaries. Demo wording, heading levels, instance-scoped LayoutGroup identity, bounded long-note scrolling and focus cleanup remain integration adjustments.

The focal moment is the same note moving from the page into the Queue through Motion's shared-layout projection. Bracket drawing, copy replacement, form arrival/exit, specimen departure and progress drawing retain the source's coordination and easing. Motion is user-triggered and local to this section; reduced motion resolves the same useful states without positional travel.

Verification includes a live desktop recording with intermediate frames, actual form transform/opacity progression over approximately 850 ms, and a same-node note transfer over 59 sampled frames. Mobile retained the custom note with contained vertical scrolling and no horizontal overflow at 390px. Reduced-motion initial load exposed the form at full opacity with no transform. These are behavior observations, not a claim that automated checks establish artistic quality or complete accessibility compliance.

## Journey-first verification

The inline composition was verified at 1440×1000 and 390×844. A fresh wheel gesture at the overview scrolls into the hero; scrolling back returns to the retained chart. Explicit continuation and Skip move focus to the hero heading. The existing map camera/route sequence and Editorial animation remain intact.

At the exact map/hero boundary (map bottom at zero), GPU draw calls remained unchanged during the observation interval; scrolling back resumed drawing. A regression covers zero-area intersection and continuation of the same unfinished leg. Context loss reveals all six checkpoint cards in readable document flow, with no horizontal overflow at 390px. A blocked lazy map bundle preserves Docs and Skip; Skip still focuses the hero.

Website verification: 45 tests across 16 files, repository typecheck, website lint and production build passed. Mobile inspection uses viewport emulation; physical-device touch is not claimed. Sound remains unimplemented and deferred.

The supplied finish reviewer verdict is `ship`: zero-area GPU pause/resume, six-card context-loss fallback readability and lazy-bundle failure exits were scored resolved. That verdict covers those three fixes. The scoped specification and surface brief now describe the finished extension; root design-system files remain preserved.

Subsequent approved refinement: remove the duplicate Docs exit from the map, loading and failure states, and reclaim its reserved header space. Skip to details remains the single early exit; the hero retains Docs.
