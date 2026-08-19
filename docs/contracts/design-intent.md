# Design Intent contract

Design Intent is an optional structured field on an Annotation. Version 1 supports the Impeccable workflow with a Freeform Design Action:

```json
{
  "design_intent": {
    "version": 1,
    "workflow": "impeccable",
    "action": {
      "type": "freeform"
    }
  }
}
```

The Annotation comment is the Freeform brief. Design Intent does not own status, Claims, resolution, deletion, Watch delivery, or any other lifecycle state. Omitting `design_intent` produces an ordinary backward-compatible Annotation. At update boundaries, `design_intent: null` removes the optional field; persisted Annotations never store `null`.

Full Queue synchronization preserves an existing Design Intent when an ordinary client omits the optional field. A client that intentionally removed Design Intent includes the Annotation ID in the sync request's `design_intent_removals` list. The removal signal is transport metadata and is never stored on the Annotation.
