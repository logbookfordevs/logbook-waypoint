# Separate Variant Intent from generated Variant Sets

An Annotation stores Variant Intent when a developer asks for alternatives; a Variant Set exists only after an agent has generated named candidate implementations for Waypoint to present and govern. We chose this separation because candidate implementations and Scaffold do not exist when the Annotation is authored, while pretending they do would conflate requested work with server-owned evaluation state and weaken atomic cleanup guarantees.
