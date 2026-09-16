# Add a foreground Watch consumer

Waypoint exposes `waypoint watch <url>` as a foreground consumer of the existing MCP Watch interface and durable journal. Human-readable output supports terminals; `--json` emits complete NDJSON MCP result envelopes; `--once` supports hosts that react only when commands finish; and `--cursor` resumes from an envelope the downstream consumer has actually processed.

The server remains the sole event authority. The CLI does not persist a second journal, run another daemon, interpret Annotation content, or renew Claims. It reconnects with bounded backoff, preserves its in-memory cursor, and respects output backpressure.

We rejected a separate Watch daemon because it would duplicate process supervision and recovery already owned by the Waypoint server. MCP resource subscriptions remain a possible later enhancement, but current host support does not guarantee that a resource update schedules agent attention. The existing `watch_annotations` long-poll remains the compatibility fallback.

Repository tests verify that an active foreground consumer receives later Annotations and Variant cancellation while other work continues. They do not prove that a particular agent harness surfaces that output or schedules another model turn; each supported harness still needs that integration evidence.
