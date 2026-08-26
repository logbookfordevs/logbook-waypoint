# Use Logbook Waypoint

Waypoint turns feedback on a running interface into a Queue that a developer or coding agent can act on. You can use it for one quick page without any server, or connect the local MCP server when work spans routes, sessions, or agent workflows.

## Choose the shortest workflow

| Your situation | Recommended path |
| --- | --- |
| A few changes on one page | Annotate, **Copy**, and paste into your coding chat. |
| Feedback that needs to travel as a file | Select Queue items and export Markdown or JSON. |
| Work across routes or repeated agent sessions | Run the local server and connect your agent through MCP. |
| A guided visual redesign | Enable Design Actions after installing Impeccable for the agent. |

Copy and export work without MCP. The server becomes useful when the agent should discover, claim, update, and resolve Queue work directly.

## Set up the development build

Waypoint is not published yet. From the repository root:

```bash
pnpm install
pnpm build
node packages/server/bin/cli.js start
```

Load the extension:

1. Open `chrome://extensions` in a Chromium browser.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select `packages/extension/.output/chrome-mv3/`.

Local development origins such as `localhost`, `127.0.0.1`, `.local`, and `.test` are available to the extension by default. On another HTTP or HTTPS site, open Waypoint settings and use **Site access → Enable**. Refresh the page after granting access. When persistent access already exists, the setting reads **Enabled** instead of asking again.

## Create an Annotation

1. Open the page you want to review.
2. Select **Annotate** in the Waypoint toolbar, or use its displayed keyboard shortcut.
3. Select the element that should change.
4. Describe the desired outcome in the Annotation editor.
5. Optionally adjust the element's text, spacing, size, typography, color, layout, or other available presentation controls.
6. Save the Annotation.

Waypoint places a numbered pin beside the Target and adds the request to the Queue. The saved record can include your comment, selector, captured text and styles, element edits, Source Identity hints, and optional visual evidence.

A comment is not required when the Annotation already contains a meaningful element edit or image attachment. A text-only edit receives the label **Text content edit** so its pin and Queue row remain understandable.

### Screenshots and attachments

Automatic screenshots capture visual context for the selected Target when **Screenshots** is enabled in settings. Uploaded image attachments remain separate reference evidence.

Agents first receive flags indicating that media exists. Image bytes are retrieved separately only when the task actually needs them.

## Work with the Queue

Open **Queue** from the toolbar to review the current route.

- **Active** contains Pending and Claimed work.
- **History** contains retained Resolved and Discarded work.
- **Other routes** lets you move through work captured elsewhere on the same site.
- Indicators show relevant evidence such as element edits, Design Actions, screenshots, or attachments.

Select one or more active Annotations to:

- **Copy** only that selection;
- **Export** it as Markdown or JSON;
- **Discard** it while retaining history.

Use **Open** when you want to return to the captured Target and edit the existing request. Permanent deletion is intentionally separate from discard and requires confirmation. History cleanup also previews how many records will be removed before deletion.

### Understand synchronization status

The Queue reports whether local changes are:

- **Up to date**;
- waiting to synchronize; or
- blocked because the local server is unavailable.

Work created while the server is unavailable remains local. **Sync now** stays available so you can restart the server and retry without reopening the Queue. During an outage, Waypoint counts only changes it can prove are locally unsynchronized.

## Send work without MCP

For a short single-page pass, select **Copy all** in the toolbar or copy a Queue selection, then paste the result into your coding chat.

Use **Export annotations** in settings when you need a route- or project-scoped JSON or Markdown file. JSON is useful for importing the records into another Waypoint environment. Markdown is convenient for a person or agent to read directly.

If **Clear on copy** is enabled, using toolbar **Copy all** removes that route's Annotations after a successful copy. Leave it disabled when the Queue should remain as a checklist.

## Connect a coding agent through MCP

The recommended endpoint is:

```text
http://127.0.0.1:3846/mcp
```

Once connected, a simple request such as “Read my Waypoint annotations and implement them” lets the agent survey Pending work. The normal agent path is:

```text
Survey → optional Inspect → Claim → implement → Resolve or Release
```

Survey returns compact context intended to be sufficient for normal implementation. Inspect is the optional equivalent of opening DevTools when layout, cascade, placement, source identity, or relationships between Targets remain ambiguous.

See [Use Waypoint through MCP](MCP_GUIDE.md) for client examples, concrete calls, lifecycle behavior, and the complete 19-tool reference.

## Use Design Actions when you want guided design work

Design Actions add an Impeccable design discipline—such as Polish, Layout, Typeset, or Animate—to the normal Annotation brief.

Impeccable must be installed for the coding agent. Waypoint does not install it or guess whether the agent can load it. If you do not use Impeccable, disable **Show Design Actions** in settings to remove those controls from new Annotation authoring. Existing saved Design Intent remains visible when its Annotation is reopened.

See [Use Design Actions](DESIGN_ACTIONS.md) for setup requirements, the action catalog, Variants, Work Notices, and retained outcomes.

## Settings that change everyday behavior

- **Appearance** cycles between System, Day Chart, and Night Watch.
- **Pin color** changes the Annotation marker color.
- **Clear on copy** removes copied route work after a successful copy.
- **Screenshots** controls automatic Target capture for new Annotations.
- **Show Design Actions** controls whether Impeccable-powered authoring appears for new work.
- **Keyboard shortcut** records a custom Annotate shortcut.
- **Site access** grants persistent annotation access on the current non-local site.
- **Import/Export** moves portable Annotation records in or out of Waypoint.

## Know what remains local

The server listens only on IPv4 loopback. Annotation data is stored locally, and captured page content is treated as untrusted evidence. Waypoint does not expose a public page automation API, install agent skills, publish changes, or send annotation content to a hosted Waypoint service.

For the complete boundary, see [Security](../SECURITY.md). For exact behavior, continue into the [documentation map](README.md) and its contracts.
