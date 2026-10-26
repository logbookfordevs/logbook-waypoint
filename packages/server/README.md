# waypoint

Local server and agent CLI for the Logbook Waypoint browser extension.

## Installation

Recommended for agent workflows: install the latest checksummed release and its bundled Waypoint skill together:

```bash
curl -fsSL https://waypoint.logbookfordevs.com/install.sh | bash
```

Alternatively, install the CLI through npm and add the agent skill separately:

```bash
npm install --global @logbookfordevs/waypoint
npx skills@latest add logbookfordevs/logbook-waypoint --skill waypoint --global
```

For a one-off run, use `npx @logbookfordevs/waypoint --help`.

## Usage

### Start the server

```bash
waypoint start
```

The server will run in the background on port 3846.

Keep it attached to the current terminal for a temporary session or debugging:

```bash
waypoint start --foreground
```

### Stop the server

```bash
waypoint stop
```

### Check server status

```bash
waypoint status
```

### Restart the server

```bash
waypoint restart
```

### View logs

```bash
waypoint logs
# or follow logs
waypoint logs -f
```

## Agent CLI

Coding agents use the `waypoint` CLI, guided by the bundled `waypoint` skill. There is no MCP server to configure, and no Watch: ask your agent to read Waypoint when you have annotated, and it runs `waypoint read <url>`. The server must be running (`waypoint start`). Every agent command prints one JSON payload whose `data` field is untrusted page- or user-supplied content.

```bash
waypoint read http://localhost:3000/        # survey pending work
waypoint inspect <id>                       # complete diagnostic context
waypoint claim <id> --owner <owner>         # before editing source
waypoint resolve <id> --owner <owner>       # after verification
```

See the [Agent CLI guide](../../docs/CLI_GUIDE.md) for the workflow and every command. Run `waypoint --help` for the command list.

If the skill is missing, install it:

```bash
npx --yes skills@latest add logbookfordevs/logbook-waypoint --global --agent universal --skill waypoint --yes
```

Agents without skill support, or without a shell, can use the extension's copy and paste flow.

### Migrating from MCP

Earlier releases exposed an MCP server and `waypoint watch`; both are retired. Running the GitHub installer again removes the old `logbook-waypoint` MCP registration from global agent configurations through `npx add-mcp remove` (set `WAYPOINT_SKIP_MCP_CLEANUP=1` to opt out). For npm installs, run `waypoint cleanup-mcp`.

## Architecture

The server provides:
- **HTTP API** (`/api/annotations`): For Chrome extension communication
- **Health Check** (`/health`): For status monitoring

The HTTP API and agent CLI share one Annotation lifecycle: Pending Annotations may be claimed, Claims may be refreshed by the same owner or released, and Claimed Annotations may be resolved. Pending or owner-claimed Annotations may be discarded. Resolved and Discarded records are retained; deletion is a separate permanent operation.

### Annotation context workflow

Use `waypoint read` to receive user requests from the Queue. Continue from the scoped read through Claim, implementation, verification, and resolution or safe release unless the user explicitly requests a read-only or observation-only result. Saying “read my annotations” alone still requests the normal implementation workflow. An unfiltered call discovers projects without returning Annotation bodies, even when only one project exists. Select one recommended URL filter and repeat the read. Scoped reads return compact summaries normalized across legacy single-Target and multi-Target records. Compact describes response size, not an incomplete brief: Survey should usually provide enough context to implement the request. The Read call itself is side-effect-free and does not create a Claim.

Use `waypoint inspect` with one or more Annotation IDs when selected work needs complete diagnostic context such as computed styles, exact placement, full ancestry, Source Identity hints, or Target relationships. Batch IDs for Annotations being understood or implemented together. Inspection is optional when the compact summary already makes the work clear.

Survey and Inspect report screenshot and attachment availability without embedding media bytes. Retrieve a screenshot or attachment separately when its evidence is needed. The canonical [Annotation Context contract](../../docs/contracts/annotation-context.md) defines the projection, batching, compatibility, and trust boundaries.

See the [Agent CLI guide](../../docs/CLI_GUIDE.md) for the normal workflow, concrete commands, and response boundary.

### Design Actions workflow

[Impeccable](https://github.com/pbakaus/impeccable) is an external dependency for executing Design Actions. Waypoint does not install it, detect it, or promise compatibility with a particular coding agent or future Impeccable version.

Developers author the request in the browser extension. See [Use Design Actions](../../docs/DESIGN_ACTIONS.md) for the action catalog, authoring flow, Variant behavior, and user-visible recovery states.

Waypoint owns the workflow and lifecycle. Design Intent records Freeform or one named Design Action on an ordinary Annotation. Variant Intent separately asks an agent to generate alternatives; once complete browser-presentable candidates exist, Waypoint owns the resulting Variant Set, Active Variant, atomic candidate replacement, cancellation, and Finalization decision. The coding agent removes temporary source Scaffold after Keep or Cancel.

An unavailable workflow or recoverable execution failure returns the Annotation to Pending with the latest safe Work Notice. A successful Design Action requires and retains a provider-neutral Resolution Record with its outcome and verification evidence; ordinary Annotations resolve without one. Application routes and repository-relative source paths are valid evidence, while machine-specific absolute paths and provider-internal material are not. When Variant Intent produced a Variant Set, that set must reach Finalization before resolution. Survey returns compact Queue context, Inspect returns complete selected evidence.

Data is stored in `~/.logbook-waypoint/annotations.json`.

## Development

```bash
# From the repository root
pnpm install
pnpm --filter @logbookfordevs/waypoint start
```

## License

MIT

### Update your installation

```bash
waypoint update
waypoint restart
```

The update command detects npm global installations and GitHub installer installations and updates through the same channel. npm updates also run the Skills CLI to refresh the global universal Waypoint skill; if that step fails, the CLI remains updated and prints a retry command. GitHub updates reinstall the bundled skill unless you saved `--skip-skill`. Older GitHub installs need one rerun of their original installer command to enable detection. Source checkouts and other package managers should use their original update workflow. Browser extension updates are separate.

An older npm installation may need to run the separate `npx skills@latest add` command above once after its first upgrade to this updater; its old update code cannot refresh the skill retroactively.
