# Design Actions

Design Actions let you ask a coding agent to apply a specific design discipline to an annotated element. You still describe the change in the normal annotation comment; the selected action tells the agent how to approach that brief.

The feature uses [Impeccable](https://github.com/pbakaus/impeccable) for its design methodology. Waypoint carries the request, work state, variants, and result through its normal annotation workflow.

## Before you begin

You need:

1. The Waypoint extension and local server running.
2. Waypoint connected to your coding agent through MCP.
3. Impeccable installed for that agent using its current installation instructions.

Waypoint does not install Impeccable or detect whether your agent can load it. If the skill is missing, the Annotation stays Pending and shows a setup-required notice instead of silently falling back to generic design work.

## Request a Design Action

1. Inspect an element and open its Annotation editor.
2. Write the desired outcome in **What should change?**
3. Turn on **Design Actions**.
4. Leave the action unselected for **Design Actions · Freeform**, or choose one named action.
5. Save the Annotation and let your agent pick it up through Waypoint.

Only one named action can be selected per Annotation. Selecting the active action again returns the request to Freeform. The comment remains the only brief—there is no second prompt to keep in sync.

### Choose the action that fits

| Action | Use it when you want to… |
| --- | --- |
| **Bolder** | Increase visual impact and confidence. |
| **Quieter** | Reduce visual intensity and distraction. |
| **Distill** | Remove complexity and keep only what matters. |
| **Polish** | Refine hierarchy, spacing, and visual details. |
| **Typeset** | Improve typography, scale, and rhythm. |
| **Colorize** | Add purposeful color and clearer emphasis. |
| **Layout** | Improve structure, spacing, and alignment. |
| **Animate** | Add purposeful motion and transitions. |
| **Delight** | Add personality through thoughtful details. |
| **Overdrive** | Push the design beyond conventional limits. |

Freeform is useful when your comment already gives a clear design direction that does not fit one action. For example: “Make this feel more confident without increasing its height.”

## Ask for alternatives

**Request Variants** is separate from the selected Design Action. Use it when you want the agent to produce multiple named directions instead of one implementation.

The initial request asks for three candidates by default. You can ask for a different count in the comment, within Waypoint's supported range of two to six. Once candidates exist, Waypoint owns which Variant is active, individual discard, cancellation, and final cleanup.

An Annotation with unfinished Variants cannot be resolved. Finalize the chosen Variant first so Waypoint can remove the temporary scaffold safely.

## Follow the result

Design Actions use the same Queue as ordinary Annotations:

- **Pending** means the work is ready or has been safely returned for another attempt.
- **Claimed** means an agent owns the current attempt.
- **Resolved** retains a short outcome and verification checklist.
- **Discarded** closes the request without deleting its history.

If execution cannot continue, the agent returns the Annotation to Pending with a Work Notice. Waypoint keeps only the latest safe notice, and dismissing it does not discard the Annotation.

## Hide Design Actions when you do not use them

Turn off **Show Design Actions** in the extension settings to remove the section from new Annotation authoring. This is a presentation preference, not a data deletion control: reopening an Annotation with saved Design Intent still shows what was requested.

## What Waypoint does—and does not—own

Impeccable supplies the design discipline. Waypoint remains responsible for the Annotation, Queue, lifecycle, Watch delivery, Work Notices, retained results, Variants, and cleanup.

Waypoint does not embed Impeccable Live, run its picker or preview protocol, install skills into agent environments, or guess whether an agent is capable. This keeps one authoritative work state and makes failures recoverable through the normal Queue.
