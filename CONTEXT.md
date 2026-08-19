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

## Lifecycle

**Pending**:
The state of an Annotation that is available for an agent to claim.
_Avoid_: open, new, unassigned

**Claim**:
Temporary ownership of an Annotation by one agent while work is active.
_Avoid_: lock, assignment, reservation

**Resolved**:
The terminal state of an Annotation whose requested work was explicitly completed and retained as history.
_Avoid_: done, completed, deleted

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

**Variant**:
One named candidate implementation produced for an Annotation.
_Avoid_: option, version, alternative

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

## Design direction

**Design Intent**:
Optional structured direction attached to an Annotation for a design workflow. The Annotation remains the lifecycle root.
_Avoid_: workflow job, agent task

**Design Action**:
The kind of design work requested by a Design Intent.
_Avoid_: command, lifecycle operation

**Freeform**:
A Design Action whose brief is the Annotation comment rather than a named action.
_Avoid_: custom prompt, unstructured annotation
