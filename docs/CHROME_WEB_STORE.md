# Chrome Web Store submission

This is the release checklist and copy source for the first Logbook Waypoint
Chrome Web Store submission. Publishing is a separate delivery action from the
CLI's npm and GitHub release workflow.

## Release boundary

- Target: Chrome Web Store, public visibility, deferred publishing.
- Package: `packages/extension/.output/logbookfordevswaypoint-extension-<version>-chrome.zip`.
- Build from a clean `main` checkout at the intended release commit.
- Do not create a product tag merely to upload the browser extension. Product
  tags continue to publish the CLI through `.github/workflows/publish.yml`.
- Chrome requires every uploaded extension version to be higher than the
  version previously uploaded for this item.

## Produce the upload package

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm package:extension
```

Before uploading, unzip the artifact into a temporary directory and confirm:

- `manifest.json` is at the ZIP root;
- the manifest name, description, version, permissions, and icons are correct;
- the ZIP contains no source maps, credentials, development notes, or unrelated
  repository files;
- loading the unpacked ZIP contents provides the same behavior as the candidate
  tested in Chrome.

## Store listing copy

### Summary

Place visual feedback directly on development interfaces and route it to coding
agents through a local MCP server.

### Detailed description

Logbook Waypoint turns visual interface feedback into structured work for coding
agents.

Place an Annotation directly on an element in a local or preview interface.
Waypoint preserves the page, selected Target, requested visual changes, and
optional screenshot, then keeps the request in a local Queue. Connect the local
Waypoint MCP server to a compatible coding agent so it can inspect, claim, and
resolve that work with the original interface context.

Waypoint includes:

- element-aware visual Annotations;
- multi-Target requests;
- optional screenshots and image attachments;
- local Queue persistence and recovery;
- explicit Pending, Claimed, Resolved, and Discarded history;
- Design Actions and requested Variants; and
- a local MCP interface for compatible coding agents.

Waypoint is local-first. Annotation data is stored in browser extension storage
and may synchronize with the Waypoint server on `127.0.0.1:3846`. It does not
require a Logbook account and includes no advertising, analytics, or telemetry.

The local Waypoint CLI/server is installed separately. Setup and documentation:
https://waypoint.logbookfordevs.com/

### Category and language

- Recommended category: Developer Tools
- Primary language: English

### URLs

- Homepage: `https://waypoint.logbookfordevs.com/`
- Support: `https://github.com/logbookfordevs/logbook-waypoint/issues`
- Privacy policy: `https://github.com/logbookfordevs/logbook-waypoint/blob/main/PRIVACY.md`

Use the marketing-site privacy URL instead when it contains the same policy and
is public before submission.

## Privacy tab

### Single purpose

Waypoint lets developers attach structured visual feedback to interfaces they
are developing and make that feedback available to a locally running coding-agent
server.

### Permission justifications

**activeTab**

Waypoint uses the active tab only when the user invokes the extension, so it can
identify the current page and enable or control the Annotation interface there.

**storage**

Waypoint stores Annotations, selected Target context, optional screenshots,
preferences, Queue synchronization state, and lifecycle history locally so work
survives page reloads, browser restarts, and temporary local-server outages.

**scripting**

When the user explicitly enables Waypoint for a non-default site, Waypoint uses
the scripting API to register and inject its packaged Annotation interface on
that origin. It does not download or execute remote code.

**Host permissions**

Waypoint runs automatically on localhost, loopback addresses, `*.local`,
`*.test`, `*.localhost`, and local files because its primary purpose is visual
feedback on interfaces under development. Access is used to render the
Annotation interface and collect context only for Targets selected by the user.

**Optional host permissions**

The optional `*://*/*` permission lets a user explicitly enable Waypoint on a
specific hosted development, preview, or staging origin. Waypoint requests this
access through a user action and does not use it to collect browsing history.

### Remote code

Select **No, I am not using remote code**. All executable extension code is
included in the uploaded package. The local HTTP API and external documentation
links do not provide executable extension code.

### Data disclosures

Complete the dashboard questionnaire against the exact candidate. Waypoint
handles website content because Annotations can contain selected element text,
attributes, page identity, visual context, screenshots, and attachments. State
that this information is stored locally and sent only to the loopback Waypoint
server or a coding agent the user separately connects. Do not describe local
processing as data received by Logbook for Devs.

Certify the limited-use statements only after comparing their current dashboard
wording with [the privacy policy](../PRIVACY.md).

## Reviewer test instructions

Waypoint does not require an account or test credentials.

1. Install the submitted extension.
2. Install the Waypoint CLI from
   `https://waypoint.logbookfordevs.com/install.sh` or run
   `npx @logbookfordevs/waypoint start`.
3. Confirm `http://127.0.0.1:3846/health` responds locally.
4. Open any HTTP page served from `localhost`.
5. Click the Waypoint toolbar icon, then start annotation mode.
6. Select a visible page element, enter a short Annotation, and save it.
7. Open the Waypoint Queue and confirm that the saved Annotation appears.
8. Reload the page and confirm the Annotation and pin remain available.

Screenshot capture is enabled by default and captures only the visible interface
around the Target selected for an Annotation. It can be disabled in Waypoint
settings. The optional all-sites permission is exercised only if the reviewer
chooses to enable Waypoint on a non-local origin.

## Listing assets

Prepare before submission:

- existing `128x128` product icon;
- one to five `1280x800` screenshots;
- required `440x280` small promotional tile;
- optional `1400x560` marquee tile;
- optional YouTube product video.

Recommended screenshot sequence:

1. selecting a Target on a realistic development interface;
2. authoring a focused Annotation with visual context;
3. reviewing Pending work in the Queue;
4. a coding agent reading or resolving the Annotation through MCP;
5. the resolved result in the interface and Queue history.

## Dashboard sequence

1. In the Developer Dashboard, choose **Add new item**.
2. Upload the validated ZIP.
3. Complete **Store Listing** using this document and the final assets.
4. Complete **Privacy** using the candidate's exact behavior.
5. Set **Distribution** to the intended countries and public visibility.
6. Add the reviewer instructions above under **Test instructions**.
7. Choose **deferred publishing**.
8. Submit for review only after the repository release checkpoint is approved.

After approval, verify the staged item and coordinate the website and
documentation before manually publishing it. A deferred submission must be
published within Chrome's current staging window or submitted for review again.
