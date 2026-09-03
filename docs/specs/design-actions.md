# Design Actions

## Problem Statement

Developers can describe interface changes in Waypoint Annotations, but they cannot explicitly request Impeccable's guided design workflows in a structured, inspectable way. Freeform comments alone cannot reliably distinguish ordinary feedback from a request to apply a specific design discipline such as Polish, Distill, Layout, or Animate.

The integration must not turn Waypoint into a thin wrapper around Impeccable Live. Waypoint already owns the Queue, Annotation lifecycle, Watch delivery, Variant evaluation, Scaffold cleanup, and retained history. Developers also need a quiet ordinary-Annotation experience when they do not use Impeccable, transparent attribution when they do, and recoverable behavior when an agent cannot execute the requested workflow.

## Solution

Add **Design Actions** as an optional section inside the existing Annotation editor. Developers may enable Impeccable with either their existing comment as freeform direction or exactly one named Design Action. The initial catalog is Bolder, Quieter, Distill, Polish, Typeset, Colorize, Layout, Animate, Delight, and Overdrive.

Waypoint saves the request as validated Design Intent on an ordinary Annotation. The Annotation continues through Pending, Claim, Resolved, and Discarded without provider-specific lifecycle states. Survey, Inspect, and Watch deliver the intent to agents. Agents that cannot proceed release the Annotation to Pending with a Work Notice; successful work resolves with a provider-neutral Resolution Record.

Requesting alternatives saves separate Variant Intent. After generating candidate implementations, the agent creates a server-owned Variant Set. Waypoint alone governs activation, individual discard, Finalization, cancellation, Scaffold cleanup, and the rule that unresolved Variants prevent resolution.

Developers who do not want this workflow may globally hide Design Actions from new Annotation authoring. Existing saved Design Intent always remains visible when its Annotation is reopened.

## User Stories

1. As a developer, I want to create an ordinary Annotation without enabling Design Actions, so that my existing feedback workflow remains unchanged.
2. As a developer, I want Design Actions to be discoverable in the Annotation editor, so that I can learn that guided design work is available.
3. As a developer who never uses Impeccable, I want to hide Design Actions globally, so that the editor contains no recurring irrelevant controls.
4. As a developer, I want the visibility preference to follow my extension rather than each route, so that I configure my workflow once.
5. As a developer, I want the setting to say “Show Design Actions,” so that it does not falsely imply that Waypoint installed or detected Impeccable.
6. As a developer, I want the editor to say “Requires Impeccable,” so that the external dependency is transparent.
7. As a developer, I want the dependency disclosure to lead to setup guidance, so that I know how to make the workflow available to my coding agent.
8. As a developer, I want Waypoint documentation to attribute and link to Impeccable prominently, so that the feature name does not obscure its design methodology.
9. As a developer, I want to enable Design Actions without selecting a named action, so that my comment can serve as freeform Impeccable direction.
10. As a developer, I want the freeform state labeled “Design Actions · Freeform,” so that it cannot be confused with an ordinary Annotation.
11. As a developer, I want to see the complete V1 action catalog at once, so that I can compare and select an action with one click.
12. As a developer, I want the catalog to wrap into two columns without horizontal scrolling, so that it remains usable in the narrow floating editor.
13. As a developer, I want exactly one named Design Action selected at a time, so that the requested playbook is unambiguous.
14. As a developer, I want a selected action labeled “Design Action · Polish,” so that the active operation is immediately visible.
15. As a developer, I want a short explanation beneath the selected action, so that I can understand what it does without consulting documentation.
16. As a keyboard or assistive-technology user, I want changed action state and explanatory copy announced accessibly, so that selection does not rely only on color or position.
17. As a developer, I want deselecting the active chip to return to Freeform, so that it does not unexpectedly turn the entire workflow off.
18. As a developer, I want the complete catalog to remain visible after selection, so that changing my choice remains a one-click action.
19. As a developer, I want the existing comment field to remain the only text brief, so that Design Actions does not introduce duplicated or conflicting prompts.
20. As a developer, I want my selected workflow and action restored when reopening a Pending Annotation, so that saved intent is never hidden.
21. As a developer, I want saved Design Intent shown even when I later hide Design Actions globally, so that reopening an Annotation faithfully represents its request.
22. As a developer, I want to edit Design Intent while an Annotation is Pending, so that I can correct the request before work begins.
23. As a developer, I want Design Intent and its comment locked while Claimed, so that an agent's work contract cannot change underneath it.
24. As a developer, I want Resolved and Discarded Design Intent to remain historical and read-only, so that retained Queue history remains trustworthy.
25. As an agent, I want Design Intent delivered through Watch, so that I can evaluate capability before performing work.
26. As an agent, I want Design Intent delivered through Survey and Inspect, so that selecting or diagnosing an Annotation never omits its requested workflow.
27. As an agent, I want a small versioned and allowlisted contract, so that I can route Design Actions without parsing UI text.
28. As an agent without Impeccable, I want to release the Annotation with a structured Work Notice, so that I do not silently substitute generic design work.
29. As a developer, I want an unavailable-workflow notice shown beside the Pending Annotation, so that I understand why work did not proceed and how to recover.
30. As a developer, I want to dismiss a Work Notice without discarding the Annotation, so that transient information does not control lifecycle.
31. As an agent, I want recoverable execution failures to return the Annotation to Pending with a distinct Work Notice, so that another attempt can proceed.
32. As a developer, I want Waypoint to retain only the latest Work Notice, so that the Annotation does not become an unbounded attempt log.
33. As a developer, I want execution progress expressed through Waypoint's canonical lifecycle, so that provider-internal steps do not leak into the product model.
34. As a developer, I want a Resolved Design Action to retain a short outcome and verification evidence, so that I can understand what was changed and checked later.
35. As an agent, I want to record that verification remains manual when automation is unavailable, so that resolution evidence stays honest.
36. As a developer, I want Request Variants to remain visually and conceptually separate from Design Actions, so that an action does not automatically imply multiple candidates.
37. As a developer, I want Design Action without Variant Intent to produce one implementation, so that small guided changes remain lightweight.
38. As a developer, I want Design Action plus Variant Intent to produce multiple named candidates, so that I can explore alternatives using Waypoint's established evaluation workflow.
39. As a developer, I want three Variants by default, so that exploration is meaningful without requiring another control.
40. As a developer, I want an explicit count in my comment to override the default between two and six, so that I can request a suitable breadth without another field.
41. As a developer, I want requests above the supported maximum clarified rather than silently truncated, so that the delivered candidates match an understood contract.
42. As an agent, I want Variant Intent delivered before candidates exist, so that requested exploration is not confused with generated evaluation state.
43. As an agent, I want to create the complete Variant Set atomically after generation, so that Waypoint never presents partial candidate state.
44. As a developer, I want exactly one Active Variant at all times during evaluation, so that the interface has one unambiguous presented implementation.
45. As a developer, I want to activate and discard individual Variants through Waypoint, so that candidate evaluation remains independent of the coding agent.
46. As a developer, I want to cancel an unresolved Variant Set without discarding the Annotation, so that I can safely revise the underlying Design Intent.
47. As a developer, I want cancellation to remove every candidate and Scaffold atomically, so that stale preview structures cannot remain in the application.
48. As a developer, I want unresolved Variants to lock Design Intent and block resolution, so that the request cannot complete while evaluation remains open.
49. As a developer, I want a finalized Variant to preserve only the chosen implementation after cleanup, so that temporary candidates do not become product code.
50. As an agent, I want to reclaim an Annotation after a long Variant evaluation, so that I can verify Finalization and resolve even if the original Claim expired.
51. As a developer, I want Waypoint rather than Impeccable Live to own Variant acceptance and cleanup, so that one system remains authoritative.
52. As a security-conscious developer, I want Design Intent, Work Notices, and Resolution Records validated and safely projected, so that annotations cannot smuggle hidden execution instructions or sensitive internals.
53. As a developer, I want Design Actions available regardless of the selected agent, so that the browser does not guess capability from incomplete setup information.
54. As a developer, I want documentation to distinguish tested, expected, and unknown agent integrations, so that compatibility claims remain honest.

## Implementation Decisions

- **Waypoint owns the workflow.** Design Actions use Impeccable's design discipline, but ordinary Queue delivery, lifecycle, Watch, Variant Sets, Scaffold, Finalization, Work Notices, and Resolution Records remain Waypoint contracts. Embedding Impeccable Live's helper, polling journal, preview protocol, or acceptance machinery is rejected because it would create competing workflow authorities. Revisit only if Waypoint deliberately adopts an external workflow engine for all annotations.

- **Feature and dependency naming remain distinct.** The editor section is `Design Actions`; the global preference is `Show Design Actions`; the dependency disclosure is `Requires Impeccable`. Documentation explains the integration and prominently attributes Impeccable. Calling the section itself “Impeccable” is rejected because Waypoint needs coherent product vocabulary; hiding attribution is rejected because the execution dependency is real.

- **The selected visual direction is A1, Wrapped Catalog.** When enabled, all ten V1 actions appear simultaneously in a wrapped two-column matrix. Full visibility and one-click selection are prioritized over minimizing editor height. A compact chooser remains a fallback only if real usage demonstrates that the expanded editor is cumbersome.

- **The three authoring states remain distinct.** Ordinary Annotation means Design Intent is absent. Freeform Design Actions means Impeccable is enabled with no named action. Named Design Action means one allowlisted action is selected. The prototype established this state model:

  ```text
  Design Actions off
  Design Actions · Freeform
  Design Action · Polish
  ```

- **One action is allowed.** Multiple action combinations are rejected because playbook order, completion, and conflicting constraints would become ambiguous. The comment may add constraints but does not create another structured action.

- **The existing comment is the brief.** Freeform Impeccable direction and named-action constraints use the normal Annotation comment. A second prompt field is rejected because it would split intent across competing text inputs.

- **Selected actions have concise explanatory copy.** Show one muted line only for a named action, update it with the selection, and announce it politely to assistive technology. Initial copy is:

  | Action | Explanation |
  | --- | --- |
  | Bolder | Increase visual impact and confidence. |
  | Quieter | Reduce visual intensity and distraction. |
  | Distill | Remove complexity and keep only what matters. |
  | Polish | Refine hierarchy, spacing, and visual details. |
  | Typeset | Improve typography, scale, and rhythm. |
  | Colorize | Add purposeful color and clearer emphasis. |
  | Layout | Improve structure, spacing, and alignment. |
  | Animate | Add purposeful motion and transitions. |
  | Delight | Add personality through thoughtful details. |
  | Overdrive | Push the design beyond conventional limits. |

- **Visibility is a global authoring preference.** It defaults on and affects new authoring UI only. Existing saved Design Intent always overrides the hidden preference when reopening that Annotation. “Enable Impeccable” is rejected because it would imply installation or capability detection.

- **Waypoint does not install or infer Impeccable capability.** The extension provides setup guidance but does not modify agent skill directories or infer the active agent. Automatic installation is rejected because agent environments, permissions, trust, and update mechanisms vary. The interim dependency link may target authoritative Impeccable documentation until a Waypoint integration guide exists.

- **Design Intent is an optional validated Annotation field.** The accepted contract is:

  ```json
  {
    "schema_version": 1,
    "workflow": "impeccable",
    "action": "polish"
  }
  ```

  `action` is `null` for Freeform and otherwise one lowercase V1 action. Ordinary Annotations omit the field. The server rejects unknown schema versions, workflows, and actions. The contract does not duplicate the comment, Target, URL, Variant data, Surface Mode, agent identity, hidden prompt, or filesystem path.

- **Surface Mode remains agent reasoning.** Persuade, Operate, Read, or Experience is inferred from the selected Target and surrounding surface by the executing Impeccable workflow. It is neither an editor control nor persisted Annotation state.

- **Design Intent is routing-critical projection data.** Watch, Survey, and Inspect include it in full. It is small, validated, and required for an agent to determine capability before execution.

- **Lifecycle owns editability.** Design Intent and the comment are editable only while Pending, locked but visible while Claimed, and historical while Resolved or Discarded. Mutating intent during a Claim is rejected because it would change the work contract underneath its owner.

- **Recoverable execution information uses Work Notices.** Extend release with an optional safe structured reason. Initial codes are `workflow_unavailable` and `execution_failed`. A Work Notice returns or keeps the Annotation Pending, never creates another lifecycle state, never silently falls back to generic work, and retains only the latest safe summary and timestamp. It may be dismissed without discarding the Annotation and is cleared when capable work begins.

- **Resolution requires provider-neutral evidence.** A Design Action resolves with a Resolution Record containing a short summary and verification checklist, or an explicit statement that verification remains manual. Provider-internal steps, stack traces, hidden prompts, and filesystem paths are rejected.

- **Watch and Survey stay concise while Inspect is complete.** Watch includes Design Intent, lifecycle state, the latest Work Notice code and safe summary, and concise Resolution Record summary. Survey keeps the full Resolution Record because it is actionable retained evidence while compacting heavy Target diagnostics. Inspect adds the complete captured Target context for selected IDs.

- **Variant Intent and Variant Set are different concepts.** Variant Intent is saved with the authored Annotation before candidates exist. A Variant Set is created only after an agent has generated named implementations and Scaffold. Conflating them is rejected because candidate-owned state cannot exist atomically at authoring time.

- **Variant Intent has an inspectable fallback.** The accepted shape is:

  ```json
  {
    "requested": true,
    "default_count": 3
  }
  ```

  The comment may explicitly request between two and six candidates. Three remains the fallback. More than six requires clarification; silent truncation is rejected.

- **Creating a Variant Set is atomic.** The agent generates candidates before invoking the server-owned creation interface. The complete set contains unique stable keys, human names, implementation payloads, and Scaffold ownership. Partial presentation is rejected.

- **Variant Sets remain Waypoint-owned.** Exactly one Active Variant is required. Activation, individual discard, Finalization, cleanup, and resolvability guards remain under the canonical Variant interface. A Design Action alone produces one implementation; Variant Intent opts into candidate generation.

- **Whole-set cancellation is distinct from Discard.** Add an explicit cancellation operation for unresolved Variant Sets. It atomically removes candidates, active presentation, and all Scaffold while preserving the Annotation as Pending. Terminal Annotation discard is rejected as a substitute because the developer may only want to revise intent.

- **Unresolved evaluation locks intent and resolution.** Design Intent cannot change while a Variant Set is unresolved, and the Annotation cannot resolve until Finalization has removed all discarded candidates and Scaffold. Claim expiry may return the Annotation to Pending without destroying the Variant Set; an agent later reclaims it to verify and resolve.

- **The initial integration does not version-lock Impeccable.** Waypoint versions its own schema, not the installed external skill. An incompatible or unavailable installation produces a Work Notice. Version negotiation is rejected until real compatibility failures justify it.

## Testing Decisions

- Tests verify behavior through two confirmed public seams. Tests must not assert private helper calls, duplicate production validation logic, or depend on exact source formatting.

- **Editor behavior seam:** load the built Annotation editor in the established DOM harness and interact through rendered controls and its extension-facing save/update interface. Cover ordinary versus Freeform versus named action, exact-one selection, deselection to Freeform, dynamic explanation, accessible state, global visibility preference, saved-intent restoration, hidden-preference override for existing intent, pending editability, claimed/terminal locking, and serialized Design/Variant Intent. Prior art is the existing built-extension DOM coverage for Variant selection and the current Annotation creation tests.

- **Waypoint server seam:** exercise a real local server through its public HTTP, MCP, Watch, lifecycle, persistence, and Variant interfaces. Cover Design Intent validation, Survey/Inspect/Watch projections, Work Notice release behavior, dismissal and clearing, required Resolution Records, candidate-count bounds, atomic Variant Set creation, whole-set cancellation, edit/resolution locks, Claim expiry during evaluation, and persistence-failure rollback. Prior art is the retained lifecycle integration suite and the server Variant integration suite.

- Use TDD in vertical slices: one failing public-behavior test, the smallest implementation to satisfy it, then the next behavior. Do not write the entire imagined suite before implementation teaches the actual module shape.

- Keep one canonical validation implementation shared by all server adapters. HTTP, MCP, Watch, and extension tests demonstrate adapter conformance rather than restating the allowlist independently.

- Include malformed and adversarial records at the server seam: unknown schema/workflow/action, Design Intent on terminal records, unsafe Work Notice or Resolution Record content, out-of-range candidate counts, incomplete Scaffold cleanup, and persistence failure during cancellation or Finalization.

- Run a bounded browser acceptance pass after implementation at desktop and 390px. Verify the wrapped matrix, Freeform and named states, each action's one-line explanation, keyboard focus, 200% zoom, reduced motion, the separate Request Variants control, reopened saved intent, Work Notice presentation, and lifecycle-locked states. This is acceptance evidence, not a replacement for the two automated seams.

- The selected throwaway prototype is visual evidence only. Production tests must not import it or assert its incidental markup.

## Out of Scope

- Embedding, forking, or reproducing Impeccable Live's helper server, journal, polling loop, HMR preview, acceptance, or cleanup implementation.
- Automatically installing, updating, or uninstalling Impeccable in agent environments.
- Detecting the active coding agent or installed skill from the browser extension.
- Adding project- or route-scoped Design Actions; V1 operates on the selected Target while retaining route information as context.
- Exposing the full Impeccable command catalog. V1 is limited to the ten element-appropriate actions and Freeform.
- Selecting multiple Design Actions on one Annotation.
- Storing Surface Mode, provider prompts, hidden reasoning, stack traces, or provider-internal progress.
- Introducing a Blocked or Failed Annotation lifecycle state.
- Building an unbounded attempt-history system; V1 retains only the latest Work Notice.
- Adding an explicit Variant-count control to the editor.
- Supporting fewer than two or more than six generated Variants for Design Action requests.
- Version negotiation with installed Impeccable skills.
- Promoting the throwaway comparison lab directly into production source.
- Building the future Waypoint website or full documentation portal as part of this feature.

## Further Notes

- The domain language follows the Waypoint glossary: Annotation, Target, Queue, Claim, Work Notice, Resolution Record, Variant Intent, Variant Set, Active Variant, Scaffold, and Finalization.
- ADR 0005 establishes Waypoint as the design workflow authority. ADR 0006 separates authored Variant Intent from generated Variant Sets.
- PT-301 is the canonical project ledger for discovery decisions, prototype evidence, and later implementation status.
- The selected A1 prototype demonstrates the accepted editor direction and responsive behavior but remains a disposable design artifact.
- Discovery identified two existing gaps that implementation must not paper over: current UI Variant metadata does not create a canonical Variant Set, and the current Variant interface has neither a candidate maximum nor whole-set cancellation.
- Success means an ordinary Annotation remains unchanged by default behavior; a developer can explicitly request one Impeccable action or Freeform work; capable agents receive complete validated intent; incapable or failed work remains recoverable and visible; Variant exploration remains wholly Waypoint-owned; and retained completion evidence is useful without leaking provider internals.
