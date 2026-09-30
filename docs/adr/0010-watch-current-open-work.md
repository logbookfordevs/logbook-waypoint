# Watch current open work

The ordinary CLI Watch session presents a lightweight current-state index for one URL scope. On startup and after a relevant change, it emits Pending and Claimed Annotation IDs, status, URL, and optional claim owner. Changed Pending IDs are included separately so an edit is visible even if its index entry is unchanged. It remains running until stopped. The agent reads a selected ID through the Survey interface before doing the work; Inspect remains diagnostic.

The server's annotation store is the source of truth. Watch journal changes wake the CLI, which rereads the scoped current state instead of applying event bodies to a private list. Starting a CLI session takes a journal position before the first read so a concurrent change can cause an extra refresh but cannot be skipped. Deletion invalidates Watch using the deleted Annotation's former URL scope. Empty long-poll results produce no CLI snapshot.

Watch is a CLI-only operation. Its private local HTTP route connects the CLI to the server's journal; `watch_annotations` is no longer an MCP tool. The previous detailed event stream remains available with `waypoint watch --events`. The CLI default does not require callers to manage a cursor. A snapshot is an index, not an implementation brief; `read_annotations` requires an exact ID or URL to supply Survey context. This keeps output proportional to identifiers and state instead of repeating every Target's context on every change.

An optional bounded-session stop rule and a file projection can be added after testing actual host behavior. Neither is required for the current CLI flow.
