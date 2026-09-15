# Install a Waypoint workflow skill

Waypoint's MCP tool descriptions remain concise, while the GitHub release installer strongly recommends a model-invoked Waypoint skill. With confirmation, it opens the Skills CLI so the user selects the receiving agent harnesses. The skill owns project URL inference, optimistic empty reads, Survey-before-Inspect guidance, claim-before-edit sequencing, lifecycle completion, and interpretation of Variant cancellation.

We rejected placing the full workflow in always-loaded MCP descriptions because it repeatedly spends context even when the agent is not actively handling Waypoint work. We also rejected a server-side project registry for empty projects: an agent can infer the current loopback development URL and scoped reads already accept it safely with an empty result.

The installer delegates destination discovery, installation method, and skill removal to the Skills CLI instead of maintaining agent-specific paths. Non-interactive installs print the follow-up command, and `--skip-skill` suppresses the recommendation for automation. This decision covers Waypoint's workflow skill only. Impeccable remains an independently installed Design Action dependency.

The canonical skill lives at repository root under `skills/waypoint`. Release packaging copies that directory into the CLI archive for the direct installer; the server package does not own a second editable copy.
