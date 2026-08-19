# Keep Design Intent inside Annotations

Waypoint owns a versioned, provider-neutral Design Intent contract inside the Annotation rather than introducing a separate workflow record or importing provider runtime machinery. The Annotation remains the lifecycle root, its comment is the Freeform brief, and adapters validate and preserve the optional contract through storage, Read, and Watch.
