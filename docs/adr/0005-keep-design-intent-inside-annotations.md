# Keep Design Intent inside Annotations

Waypoint owns a versioned, provider-neutral Design Intent contract inside the Annotation rather than introducing a separate workflow record or importing provider runtime machinery. The Annotation remains the lifecycle root, its comment is the Freeform brief, and adapters validate and preserve the optional contract through storage, Read, and Watch.

Queue sync treats omission as backward-compatible preservation. Intentional removal travels as request metadata keyed by Annotation ID, so older clients cannot erase Design Intent accidentally and removal state does not become part of the canonical Annotation.
