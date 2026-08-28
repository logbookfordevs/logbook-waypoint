# Logbook Waypoint

Logbook Waypoint is a local development feedback workflow that connects annotated interfaces to coding agents. This glossary defines the shared language used by the extension, server, agent tools, and documentation.

## Feedback

**Annotation**:
A feedback item associated with one page and, optionally, one element on that page.
_Avoid_: Waypoint, comment, ticket

**Target**:
The portable identity and captured context of the page or element associated with an Annotation.
_Avoid_: selector, node, element reference

**Queue**:
The collection of Annotations available to or retained from agent work.
_Avoid_: inbox, backlog, annotation list

**Page**:
A stable annotation surface identified by its origin and pathname, independent of transient query or hash state.
_Avoid_: exact URL, route variant, screen URL

**View State**:
Query or hash state that changes what is presented within one Page, such as an active tab or filter.
_Avoid_: Page, route

**Captured URL**:
The exact URL retained with an Annotation to describe and revisit the View State where it was created.
_Avoid_: Page identity, project URL

## Design workflow

**Design Intent**:
Optional structured design work requested through an Annotation.
_Avoid_: mode, command, design comment

**Design Action**:
The named design operation requested by a Design Intent, such as polishing, adjusting layout, or animating a Target.
_Avoid_: mode, skill, prompt

**Surface Mode**:
The visitor outcome that guides design decisions for a surface: Persuade, Operate, Read, or Experience.
_Avoid_: Design Action, workflow mode

## Lifecycle

**Pending**:
The state of an Annotation that is available for an agent to claim.
_Avoid_: open, new, unassigned

**Claim**:
Temporary ownership of an Annotation by one agent while work is active.
_Avoid_: lock, assignment, reservation

**Work Notice**:
A non-terminal explanation attached to a Pending Annotation when a claimed attempt could not proceed or complete.
_Avoid_: blocked state, error state, failure status

**Resolved**:
The terminal state of an Annotation whose requested work was explicitly completed and retained as history.
_Avoid_: done, completed, deleted

**Resolution Record**:
The provider-neutral summary and verification evidence retained when an Annotation becomes Resolved.
_Avoid_: agent output, result, completion metadata

**Discarded**:
The terminal state of an Annotation intentionally closed without implementing its requested work.
_Avoid_: cancelled, ignored, deleted

**Deletion**:
Explicit permanent removal of an Annotation, separate from completing or discarding it.
_Avoid_: resolve, close, cleanup

**Watch**:
Non-destructive delivery of new or changed Queue activity to an agent.
_Avoid_: poll, read, claim

## Variants

**Variant Intent**:
An optional request on an Annotation asking an agent to produce multiple named Variants.
_Avoid_: Variant Set, Variant Request, checkbox state

**Variant**:
One named candidate implementation produced for an Annotation.
_Avoid_: option, version, alternative

**Variant Set**:
The server-owned collection of generated Variants presented together for evaluation.
_Avoid_: Variant Intent, Variant Request, options list

**Active Variant**:
The single Variant currently presented for evaluation.
_Avoid_: selected variant, current version

**Scaffold**:
Temporary structure that allows multiple Variants to coexist during evaluation.
_Avoid_: variant code, wrapper, experiment

**Finalization**:
Preservation of the chosen implementation together with complete removal of its Scaffold and discarded Variants.
_Avoid_: accept, merge, cleanup

## Source context

**Source Identity**:
Untrusted framework- or page-derived information that may connect a Target to a likely source module.
_Avoid_: source mapping, component path, trusted location
