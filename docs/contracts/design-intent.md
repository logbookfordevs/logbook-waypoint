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
