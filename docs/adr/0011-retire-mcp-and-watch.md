# Retire MCP and Watch

Waypoint agents use only the `waypoint` CLI, guided by the bundled `waypoint` skill. The MCP server and the Watch feature (`waypoint watch`, `--events`, `--cursor`, the Watch HTTP route, and the Watch journal) are retired.

MCP tool definitions load into every agent session, so they cost context even when nobody is annotating. Waypoint is a local, single-user, bursty development tool: work arrives when the developer annotates and asks the agent to act, so a standing connection and a push channel buy little. A CLI that prints one JSON payload per command, together with a skill that is loaded only when Waypoint work is in scope, spends context only when the work exists, and leaves one agent-facing surface to maintain. Every command output still carries `data_trust: "untrusted"`, and the lifecycle, Survey and Inspect projections, and Variant rules are unchanged.

Without Watch, an agent learns about new work only when the user asks it to read Waypoint (`waypoint read <url>`). We accepted that loss of proactive delivery because Watch could never wake an idle agent on its own; that depended on the agent harness. Variant cancellation is detected by re-reading: an Annotation that had an unresolved Variant Set and is back to Pending without `variant_request` means the user cancelled it. `get_project_context` is dropped because agents infer the project URL from the repository.

Agents without skill support, or without a shell, use the extension's copy and paste flow. `waypoint --help` tells agents to ask the user before installing the skill when it is missing.

Migration is handled by the installer, which removes the old `logbook-waypoint` MCP registration from global agent configurations on upgrade (`WAYPOINT_SKIP_MCP_CLEANUP=1` opts out), and by `waypoint cleanup-mcp` for npm installs. The legacy MCP code stays in the server for one release behind `WAYPOINT_ENABLE_MCP=1` as a rollback path only, and is then removed.

This supersedes [ADR 0009](0009-foreground-watch-consumer.md) and [ADR 0010](0010-watch-current-open-work.md), and replaces the MCP-description trade-off in [ADR 0008](0008-install-a-waypoint-workflow-skill.md).
