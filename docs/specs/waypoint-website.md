# Logbook Waypoint Website

## Problem Statement

Logbook Waypoint has a working browser extension, local server, documented domain model, and a distinctive Logbook identity, but it does not yet have a product website. A developer encountering the project cannot quickly see how an in-page Annotation becomes structured Queue activity that a coding agent can Watch, Claim, and Resolve. The existing repository documentation explains the system, but it is not a persuasive, approachable, or visually memorable introduction to the product.

The website must make the product mechanism understandable before asking the visitor to read extensive documentation. It must feel joyful and authored without copying the README banner's AI Field Kit-derived palette, engraved-map texture, fantasy cartography, or orange glow. It must also remain honest about Waypoint's early state: the extension and npm package are not yet published, so the website cannot imply immediate store availability, customer adoption, or production maturity.

## Solution

Create a production Logbook Waypoint website consisting of a persuasive landing page and a coherent documentation shell.

The landing page will be led by a horizontal operational sequence that demonstrates `Annotate → Queue → Resolve`. Three distinct product-shaped surfaces will show a developer placing precise feedback on a running interface, the resulting Annotation entering a lifecycle-aware Queue, and a coding agent Claiming and resolving the work. The sequence will use real Waypoint vocabulary and visible Pending, Claimed, and Resolved states.

The production design will use the Ocean recipe of the Atlantic Chartroom system for marketing and navigation. Documentation reading surfaces will use the Walnut recipe inside the same Ocean-led shell. The verified standalone prototype establishes the composition, responsive staging, and interaction expectations, but production will replace its disposable implementation with maintainable React components, external assets, authored route geometry, final motion, complete content, accessible behavior, and a cohesive documentation experience.

The primary launch action will remain `Coming soon` until Waypoint has a supported distribution channel. Visitors may still inspect how the product works, open documentation, and reach the repository without encountering invented availability or adoption claims.

## User Stories

1. As a developer building an interface with coding agents, I want to understand Waypoint's workflow within the first viewport, so that I can quickly decide whether it fits my development process.
2. As a first-time visitor, I want to see an Annotation move through Queue and agent work, so that the product promise is demonstrated rather than merely claimed.
3. As a frontend developer, I want the browser surface to resemble a real development interface, so that I can recognize where Waypoint enters my workflow.
4. As a design engineer, I want the example Annotation to carry precise visual and element context, so that I can see that Waypoint supports more than generic comments.
5. As an agent-assisted developer, I want to see the coding agent Claim and resolve an Annotation, so that I understand how visual feedback becomes actionable work.
6. As a visitor, I want the terms Annotation, Queue, Claim, Pending, Claimed, and Resolved used consistently, so that the website teaches the same domain language as the product.
7. As a visitor, I want the headline `Pin the point. Chart the change.`, so that Waypoint has a concise and memorable promise.
8. As a visitor, I want the supporting statement `Visual feedback your coding agent can act on.`, so that the practical benefit is explicit.
9. As a visitor, I want a visible `See how it works` action, so that I can move directly to the product demonstration.
10. As a visitor, I want the primary launch action to say `Coming soon`, so that the website remains honest while distribution is unavailable.
11. As a visitor, I want the Coming soon action to explain the current launch state, so that it does not behave like a broken installation button.
12. As a visitor, I want a clear repository path, so that I can inspect or follow the early project without mistaking the repository for a polished installer.
13. As a developer, I want the first viewport to prioritize product proof over mascot illustration, so that I understand the tool before encountering supporting brand personality.
14. As a visitor, I want Thelu to appear as a secondary navigator or guide, so that the page feels welcoming without hiding the product mechanism.
15. As a visitor, I want a joyful and distinctive composition, so that Waypoint is memorable among conventional developer-tool landing pages.
16. As a Logbook follower, I want the website to feel related to Logbook for Devs, so that the product lineage is recognizable.
17. As a visitor unfamiliar with Logbook for Devs, I want Waypoint to remain understandable on its own, so that brand context is not required to understand the product.
18. As a visitor, I want the visible attribution `A tool from the Logbook for Devs`, so that the product's origin is transparent.
19. As a visitor, I want `Logbook for Devs` in the attribution to link to `https://logbookfordevs.com/`, so that I can reach the parent project.
20. As a visitor, I want the exact tagline `Charting the technical seas, one commit at a time.`, so that Logbook attribution remains consistent.
21. As a visitor, I want maritime language expressed through routes, bearings, manifests, checkpoints, and instruments, so that the theme supports comprehension rather than becoming costume.
22. As a visitor, I want the marketing surface to use the Ocean recipe, so that the site immediately establishes the current Logbook visual system.
23. As a documentation reader, I want article surfaces to use the Walnut recipe, so that sustained reading is comfortable while remaining recognizably Logbook.
24. As a visitor using Night Watch, I want the chosen recipe to remain legible and coherent, so that dark appearance does not flatten the brand into generic black UI.
25. As a visitor, I want Deep Ocean to carry navigation, code, and primary structure, so that strong actions and technical content have consistent hierarchy.
26. As a visitor, I want Verdigris to mark navigation and active state, so that location and progress remain easy to understand.
27. As a visitor, I want Signal Rust reserved for annotations, warnings, and field-note attention, so that it retains meaning.
28. As a visitor, I want brass used only for fine instrument detail, so that decorative warmth does not overwhelm the product.
29. As a keyboard user, I want every interactive control reachable and visibly focused, so that I can use the website without a pointer.
30. As a screen-reader user, I want navigation, workflow controls, Queue filters, state changes, and feedback announced semantically, so that the interactive demonstration remains understandable.
31. As a visitor who cannot distinguish color reliably, I want lifecycle states represented with labels and shapes in addition to color, so that state never depends on color alone.
32. As a visitor with reduced-motion preferences, I want the workflow explanation to remain complete without route drawing or positional movement, so that motion is optional rather than required.
33. As a visitor using forced colors, I want controls, focus, and state boundaries to remain visible, so that the page stays operable.
34. As a visitor at 200% zoom, I want all content and actions to reflow without clipping, so that magnification does not hide functionality.
35. As a mobile visitor, I want the horizontal workflow recomposed into three vertically staged sections, so that I receive a deliberate mobile narrative instead of a shrunken desktop canvas.
36. As a mobile visitor, I want navigation to open and close predictably, so that I can reach site sections without obscuring the page.
37. As a mobile keyboard user, I want Escape to close the navigation and return focus to its trigger, so that focus remains controlled.
38. As a touch user, I want controls to have comfortable targets and no pointer-only affordances, so that the website remains usable without hover.
39. As a visitor on a narrow viewport, I want no page-level horizontal overflow, so that the content remains contained and readable.
40. As a visitor on a wide display, I want the workflow to preserve its dense instrument quality without stretching into empty space, so that composition remains intentional.
41. As a visitor, I want the Queue demonstration to support visible filtering, so that retained lifecycle state feels inspectable rather than decorative.
42. As a visitor, I want Queue filtering to produce understandable empty or filtered states, so that the control never appears inert.
43. As a visitor, I want the Resolve action to show loading and success feedback, so that agent work feels stateful and responsive.
44. As a visitor, I want resolution feedback announced through an accessible live region, so that success is not conveyed visually alone.
45. As a visitor, I want the demonstration to clearly identify illustrative content, so that synthetic examples are not mistaken for customer data.
46. As a security-conscious developer, I want the website to explain the loopback-only local boundary, so that I understand where my Annotation data lives.
47. As a security-conscious developer, I want the site to explain local persistence and retained history, so that the workflow is inspectable.
48. As a security-conscious developer, I want the site to state that Waypoint exposes no public page-world automation bridge, so that the browser boundary is clear.
49. As a developer, I want a concise feature manifest, so that I can understand precise capture, context, Queue routing, and agent work without reading repetitive cards.
50. As a developer, I want Design Actions explained as optional structured Design Intent, so that I understand how Impeccable contributes without owning Waypoint's lifecycle.
51. As a developer, I want named Variants explained through Waypoint's own Variant Set and Finalization model, so that candidate evaluation has one authority.
52. As a developer, I want Watch explained as non-destructive delivery of Queue activity, so that I do not confuse it with Claiming work.
53. As a developer, I want Source Identity described as untrusted contextual assistance, so that the website does not imply guaranteed source mapping.
54. As a visitor, I want installation documentation prepared even while the public CTA remains Coming soon, so that release can activate a supported path without redesigning the site.
55. As a future user, I want installation guidance to distinguish published and development-only setup, so that I do not follow unsupported instructions accidentally.
56. As a developer using Codex, I want agent setup guidance, so that I can connect Waypoint's MCP server correctly.
57. As a developer using another MCP-compatible agent, I want provider-neutral setup guidance, so that the documentation does not imply exclusive compatibility.
58. As a documentation reader, I want routes for Installation, Core Workflow, Agent Setup, Queue and Lifecycle, Variants, Design Actions, Security, Troubleshooting, and Releases, so that information is predictable and findable.
59. As a documentation reader, I want a persistent site identity and section navigation, so that marketing and documentation feel like one product.
60. As a documentation reader, I want code examples on Deep Ocean surfaces with an accessible copy action, so that setup commands are clear and reusable.
61. As a documentation reader, I want warnings and field notes to pair icons and text with color, so that their meaning remains accessible.
62. As a documentation reader, I want readable line length, hierarchy, and anchor navigation, so that technical material is comfortable to scan and study.
63. As a visitor, I want the website metadata and social preview to describe Waypoint honestly, so that shared links do not overstate availability.
64. As a search visitor, I want canonical metadata, sitemap, and robots behavior prepared for the final domain, so that launch does not require retrofitting basic discovery infrastructure.
65. As a maintainer, I want website copy and navigation represented as maintainable content structures, so that adding documentation does not require rewriting page chrome.
66. As a maintainer, I want brand semantics expressed through shared tokens rather than scattered hex values, so that Day Chart, Night Watch, Ocean, and Walnut stay coherent.
67. As a maintainer, I want the website composed from focused React modules, so that the homepage demonstration, navigation, and documentation shell can evolve independently.
68. As a maintainer, I want generated or raster artwork stored as external assets rather than embedded data URLs, so that source remains reviewable and caches remain effective.
69. As a maintainer, I want route geometry authored as scalable SVG or equivalent responsive geometry, so that the operational sequence stays crisp and animatable.
70. As a maintainer, I want interaction behavior tested through the rendered website DOM, so that internal component refactors do not invalidate the specification.
71. As a maintainer, I want TypeScript typechecking and a production build to gate delivery, so that the new package integrates safely with the monorepo.
72. As a maintainer, I want the root workspace commands to include the website where appropriate, so that CI does not silently omit it.
73. As a maintainer, I want the website package isolated from extension and server runtime code, so that marketing changes cannot alter the local security boundary.
74. As a maintainer, I want website claims derived from approved product truth, so that future design changes cannot invent capabilities or evidence.
75. As a maintainer, I want the verified standalone prototype retained as design evidence rather than production dependency, so that visual intent remains auditable without shipping disposable code.
76. As a maintainer, I want desktop and mobile capture comparisons during finishing, so that responsive composition is verified visually rather than inferred from CSS.
77. As a maintainer, I want a documented design system after the production build, so that future pages inherit the shipped world rather than reinterpreting the prototype.
78. As a future visitor, I want a project-progress-led homepage variation to remain possible, so that Waypoint can later expose its voyage log without compromising the initial product-conversion thesis.

## Implementation Decisions

- **The website is a new workspace package.** It will use Next.js with the App Router, React, TypeScript, Tailwind CSS v4, and the repository's pnpm workspace. This gives the landing page and documentation shell one deployment unit while preserving separation from the extension and local server runtimes.

- **The verified standalone prototype is the closest reference, not production source.** Its desktop proportions, mobile staging, interaction states, and dense-instrument hierarchy are accepted evidence. Its inline implementation, embedded assets, temporary content shortcuts, and disposable JavaScript are rejected as a production architecture. Revisit this boundary only if the prototype is deliberately promoted through a separately reviewed implementation decision.

- **The first viewport is owned by the horizontal operational sequence.** The browser Annotation, Queue, and coding-agent surfaces must remain the dominant composition. A conventional centered hero, detached product screenshot, or generic feature-card grid is rejected because it delays comprehension of Waypoint's mechanism.

- **Desktop and mobile use different compositions of the same story.** Desktop presents one connected horizontal mechanism. Mobile presents three vertically staged sections in the same order. Shrinking, clipping, or horizontally scrolling the desktop canvas is rejected because mobile is not degraded desktop.

- **The production page inherits Atlantic Chartroom rather than the README banner.** Ocean leads marketing and navigation; Walnut leads sustained documentation reading. The banner's fantasy map, engraved illustration, orange glow, and AI Field Kit-derived treatment are not visual authority. Revisit only if the Logbook brand contract changes.

- **The physical use scene selects Day Chart as the default.** The marketing page is expected to be evaluated during normal development and reading conditions, so cool chart paper provides the primary canvas while Deep Ocean concentrates the operational demonstration. Night Watch remains a complete appearance rather than the default visual shortcut.

- **Color roles remain semantic.** Deep Ocean carries navigation, strong actions, and code. Verdigris marks navigation, focus, and positive/active state. Signal Rust marks annotations, warnings, destructive attention, and field notes. Brass is limited to coordinates and fine instrument detail. Normal text uses accessible semantic text tokens rather than decorative accents.

- **The component grammar is instrument-like, not card-first.** The page combines paper bands, one dominant operational field, manifests, ledger rows, code surfaces, and selective raised controls. Repeated same-size icon cards and nested cards are rejected because they flatten hierarchy.

- **Typography has three jobs.** The display serif carries narrative statements and major section titles. The sans family carries body copy, navigation, and controls. The mono family is reserved for code, coordinates, lifecycle metadata, and operational labels. Mono styling used merely to make content feel technical is rejected.

- **The website uses real product vocabulary and product-shaped examples.** Illustrative Annotation and Queue records may be authored at full fidelity, but factual claims, availability, customers, metrics, testimonials, pricing, benchmarks, and integrations may not be invented. Synthetic examples must not look like customer evidence.

- **The launch posture is Coming soon.** The primary action may reveal concise launch context or route to an approved follow mechanism, but it must not masquerade as an installer. When a supported distribution channel exists, the same action position may become installation without restructuring the page.

- **Thelu is a secondary navigator.** Thelu may support guidance, progress, documentation transitions, and the closing passage after the operational mechanism is clear. Thelu must preserve the canonical face, scarf, and cheek mark and must not replace product proof.

- **Route geometry is authored vector behavior.** The connection between Annotation, Queue, and agent surfaces should be semantic SVG or an equivalent responsive vector system. It must adapt across breakpoints and remain meaningful without motion. Rasterizing the route is rejected because it prevents responsive and stateful behavior.

- **Motion has one primary explanatory purpose.** The route and checkpoints explain how work progresses through the system. State transitions provide feedback when filtering or resolving. Decorative motion remains subordinate. The implementation will prefer CSS transitions or animation for predetermined movement and use JavaScript only where stateful control requires it.

- **Motion defaults are already-visible and interruptible.** The page content must remain present without JavaScript or animation. User-triggered state transitions must retarget cleanly rather than restart long keyframes. Reduced motion removes positional travel while retaining state and feedback.

- **The Queue filter and Resolve action remain real controls.** Filtering changes visible Queue content and exposes an understandable empty state. Resolve shows disabled/loading/success behavior and updates the visible lifecycle outcome. These controls demonstrate workflow; they are not decorative replicas.

- **Navigation is responsive and accessible.** Desktop navigation remains visible. Mobile navigation uses a proper disclosed menu, closes through its trigger and Escape, returns focus, and never traps the page behind unmanaged custom chrome.

- **The documentation shell shares navigation but changes reading material.** Ocean remains in global framing, code, and navigation while Walnut provides article canvas and sustained-reading surfaces. Marketing components are not copied wholesale into documentation.

- **Documentation begins with a defined information architecture.** Initial destinations are Installation, Core Workflow, Agent Setup, Queue and Lifecycle, Variants, Design Actions, Security, Troubleshooting, and Releases. Content may begin with honest early-development notices, but navigation must not link to empty or misleading pages.

- **Brand attribution is a project-level requirement.** The visible Logbook for Devs attribution, exact destination, and exact tagline appear once in an appropriate persistent or closing site location rather than being repeated in every reusable component.

- **Theme attributes stay co-located.** Recipe and appearance live on the same stable root or section boundary so that Ocean/Walnut and Day Chart/Night Watch resolve consistently. A split-ancestor theme architecture is rejected because combined selectors become brittle.

- **Assets are external and auditable.** Product artwork, Thelu imagery, texture, and any generated raster material ship as files with appropriate dimensions and alternative-text decisions. Base64 data URLs and cropped pixels taken from comparison screenshots are rejected.

- **No website behavior crosses the local product boundary.** The marketing site does not connect to a visitor's local Waypoint server, inspect local Annotations, detect installed extensions, or claim agent capability. The interactive mechanism is a clearly illustrative demonstration.

- **The project-progress homepage remains deferred.** The initial homepage persuades visitors through product mechanism and launch readiness. A public voyage-log or progress-led variation may reuse the route system later, but it must not compete with the initial first-viewport job.

## Testing Decisions

- **Primary behavioral seam: rendered website DOM.** Tests render the relevant public page or component surface, interact with visible controls, and assert user-observable outcomes. Tests must not call private helpers, inspect internal React state, or duplicate production logic.

- **Work vertically through the public seam.** Each meaningful behavior begins with one failing rendered-DOM test, receives the smallest implementation that makes it pass, and then moves to the next slice. Bulk speculative test suites are rejected.

- **Interaction coverage includes mobile navigation.** Verify opening, closing through the trigger, Escape handling, focus return, appropriate accessible state, and content availability.

- **Interaction coverage includes Queue filtering.** Verify that choosing a lifecycle filter changes visible Annotation records and that a valid empty state is presented when no records match.

- **Interaction coverage includes resolution feedback.** Verify disabled/loading behavior, visible success, lifecycle copy updates, and accessible status announcement.

- **Interaction coverage includes launch posture.** Verify that `Coming soon` communicates unavailable distribution rather than navigating to a fake installer or store listing.

- **Interaction coverage includes appearance behavior where exposed.** Verify that Day Chart/Night Watch controls update the stable theme boundary and retain accessible labels. Do not assert implementation-specific class names when a semantic state can be observed.

- **Reduced-motion behavior is verified as an outcome.** Content and lifecycle meaning must remain complete when reduced motion is active. Tests should not assert incidental timing values or CSS source formatting.

- **Responsive behavior receives browser acceptance evidence.** Automated DOM tests protect interaction contracts; desktop and mobile screenshots protect composition, overflow, typography, and staging. Browser acceptance is evidence, not a second implementation-coupled test suite.

- **Production gates remain typecheck and build.** The website package and root workspace commands must pass TypeScript checking and a production Next.js build. Generated metadata and routes must resolve without broken internal links.

- **Accessibility gates are behavioral.** Verify semantic landmarks, heading order, labeled controls, visible focus, non-color state cues, keyboard operation, zoom/reflow, and reduced motion. Automated checks supplement but do not replace manual keyboard and visual inspection.

- **Prior art comes from the repository's existing public-seam tests.** Extension tests already exercise built, user-facing DOM and interaction outcomes rather than private helpers. Website tests should preserve that behavior-first style while using tools appropriate to React and the rendered website.

- **The verified prototype's QA becomes acceptance evidence, not a passing production test.** Its desktop/mobile captures and interaction checklist define the initial comparison target. Production must earn fresh evidence against its own output.

## Out of Scope

- Publishing or deploying the website.
- Registering or migrating a production domain.
- Publishing the browser extension or npm package.
- Replacing `Coming soon` with a store installation action before a supported distribution channel exists.
- Connecting the public website to a visitor's local Waypoint server or browser extension.
- Authentication, user accounts, cloud persistence, telemetry, analytics, waitlists, newsletters, or email collection.
- Backend APIs for the marketing demonstration.
- Customer logos, testimonials, adoption metrics, pricing, benchmarks, or unsupported compatibility claims.
- A complete public project-progress or voyage-log homepage variation.
- A community forum, Discord integration, donation CTA, or financial-support flow.
- Reproducing the prototype's inline HTML, embedded data URLs, temporary Python preview server, or disposable JavaScript architecture.
- Reusing the README banner as website visual authority.
- Redesigning the extension or server UI as part of the website implementation.

## Further Notes

- Canonical product truth is recorded in `PRODUCT.md`.
- Canonical domain language is recorded in `CONTEXT.md`.
- Security, lifecycle, Variant, Watch, and Source Identity behavior remain governed by the existing contracts and ADRs rather than this marketing specification.
- The newest verified standalone prototype supersedes the older disposable Option B prototype as the closest visual and structural reference.
- Prototype reference: `/Users/leonardo/.codex/worktrees/260a/logbook-waypoint/docs/references/waypoint-homepage-prototype/index.html`.
- Desktop evidence: `/Users/leonardo/.codex/worktrees/260a/logbook-waypoint/docs/references/waypoint-homepage-prototype/implementation-desktop.png`.
- Mobile evidence: `/Users/leonardo/.codex/worktrees/260a/logbook-waypoint/docs/references/waypoint-homepage-prototype/implementation-mobile.png`.
- Passed design QA: `/Users/leonardo/.codex/worktrees/260a/logbook-waypoint/docs/references/waypoint-homepage-prototype/design-qa.md`.
- The prototype establishes topology, proportions, responsive staging, and interaction expectations. Typography, assets, SVG geometry, Thelu placement, motion, component architecture, complete content, documentation cohesion, and production verification remain implementation work.
- Success means a visitor understands Waypoint's Annotation-to-agent mechanism within the first viewport, trusts the local boundary, finds the documentation path, and encounters an honest launch state inside a joyful, unmistakably Logbook experience.
