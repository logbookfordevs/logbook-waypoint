import { chromeWebStoreUrl, signalChartUrl } from '@/lib/site-config';

export interface DocumentationSection {
  heading: string;
  paragraphs: string[];
  code?: string;
  prerequisite?: string;
  note?: string;
  resource?: {
    href: string;
    label: string;
  };
}

export interface DocumentationPage {
  slug: string;
  title: string;
  summary: string;
  sections: DocumentationSection[];
}

export const documentationPages: DocumentationPage[] = [
  {
    slug: 'installation',
    title: 'Installation',
    summary: 'Install the extension, add the optional local server, and open your first enabled route.',
    sections: [
      {
        heading: 'Choose how you want to work',
        paragraphs: [
          'For occasional feedback, install the browser extension, annotate your page, and copy the feedback into your coding-agent chat. You do not need the local server or MCP for this path.',
          'For an ongoing feedback loop, also install the Waypoint CLI, start its local server, and connect your agent through MCP. The agent can then read and update the Queue directly. The recommended Waypoint skill teaches it how to handle that work.',
        ],
      },
      {
        heading: 'Current availability',
        paragraphs: [
          'Install Logbook Waypoint from the Chrome Web Store for the supported browser-extension experience.',
          'The separate Waypoint CLI is published through npm and as a checksummed GitHub Release. Both CLI channels install the same waypoint command and optional local MCP server.',
        ],
        resource: {
          href: chromeWebStoreUrl,
          label: 'Install Logbook Waypoint from the Chrome Web Store',
        },
      },
      {
        heading: 'Install from a GitHub Release',
        paragraphs: [
          'Run the public installer to download and verify the latest Waypoint CLI release. It includes Waypoint’s agent workflow skill by default, installing globally for the universal agent target without prompting. It uses AFK when available and otherwise runs the Skills CLI through npx.',
          'To opt out, pipe the installer into bash -s -- --skip-skill. The installer remembers that choice for future updates. Re-run with --yes to enable skill installation again. If the skill step fails, the CLI still installs and prints a retry command.',
        ],
        code: 'curl -fsSL https://waypoint.logbookfordevs.com/install.sh | bash\nwaypoint start',
      },
      {
        heading: 'Install through npm',
        prerequisite: 'Node.js 22.12+ required. GitHub installs to ~/.local/bin and flags missing PATH setup.',
        paragraphs: [
          'Install the published package globally, or use npx for a temporary first look. Start runs the local server in the background by default.',
        ],
        code: 'npm install --global @logbookfordevs/waypoint\nwaypoint start',
        note: 'Use waypoint status to check the server, waypoint logs to inspect it, waypoint stop when finished, or waypoint start --foreground for a terminal-attached session.',
      },
      {
        heading: 'Install the agent workflow skill',
        prerequisite: 'Recommended for agent workflows. The skill is not required when you use Waypoint only for visual annotation and copy.',
        paragraphs: [
          'The Waypoint skill teaches a coding agent how to find the current local project, begin with compact Queue context, Claim before editing, and interpret lifecycle and Variant decisions correctly. MCP provides access to Waypoint’s tools; the skill provides the working method.',
          'The GitHub installer includes a global universal-target installation automatically. If you installed through npm, opted out, or need a specific harness, run the command below to choose the agent harnesses where you use Waypoint.',
        ],
        code: 'npx skills@latest add logbookfordevs/logbook-waypoint --skill waypoint --global',
        resource: {
          href: 'https://github.com/vercel-labs/skills',
          label: 'Review the Skills CLI and supported agents',
        },
      },
      {
        heading: 'Enable your first page',
        paragraphs: [
          'Open the page you want to work on, then open Waypoint from your browser’s extensions menu. Local development sites are supported automatically; other sites offer Enable for this site. Show the toolbar using the extension’s toggle. If you see Reload to activate, reload the page first.',
          'Choose Annotate in the toolbar and select an element. Write a small request, such as “Change this button label to Save changes,” then save it. Open the Queue and check that your comment is there. This verifies the browser workflow before you add an agent.',
          'Continue with Core Workflow for copy and paste, or Agent Setup to connect the Queue directly to your coding agent.',
        ],
      },
      {
        heading: 'Build the extension from source',
        paragraphs: [
          'Clone the repository, install the workspace, and build the browser extension with pnpm.',
          'Open chrome://extensions, enable Developer mode, choose Load unpacked, and select packages/extension/.output/chrome-mv3.',
        ],
        code: 'git clone https://github.com/logbookfordevs/logbook-waypoint.git\ncd logbook-waypoint\npnpm install\npnpm build',
        note: 'This developer route is optional. For ordinary use, install the supported release from the Chrome Web Store. The extension can annotate and copy without MCP; keep the server running for Queue synchronization and agent workflows.',
      },
    ],
  },
  {
    slug: 'core-workflow',
    title: 'Core Workflow',
    summary: 'Move from rendered feedback to retained agent work without translating context by hand.',
    sections: [
      {
        heading: 'Annotate the rendered interface',
        paragraphs: [
          'Start with a small, visible change. Choose Annotate in the Waypoint toolbar, then select the button, heading, or other element that needs attention. That selected element is the Annotation’s Target.',
          'Write the outcome you want: “Change this button label to Save changes. Keep its current size and position.” Save the Annotation, then open the Queue to find it. You do not need Design Actions or Variants for an ordinary request.',
        ],
      },
      {
        heading: 'Let the Queue retain the work',
        paragraphs: [
          'Saving creates a Pending Annotation in the local Queue. Watch can deliver that activity without Claiming or removing it. The record remains inspectable as an agent Claims and resolves the request.',
        ],
      },
      {
        heading: 'Hand the request to your agent',
        paragraphs: [
          'Without MCP, select the work in the Queue, choose Copy, and paste it into your coding-agent chat. Ask the agent to implement the request in the project. Copying provides context; it does not itself change your source code or complete the work.',
          'With MCP connected, ask the agent to read Waypoint for your app’s URL. Include the actual host and port, especially when you run more than one project. Ask it to implement the saved request and verify the result.',
        ],
        code: 'Read my Waypoint annotations for http://localhost:3000/ and implement the button-label request. Verify the change before resolving it.',
        note: 'Replace the example URL with your app’s address. If Clear on copy is enabled in settings, copying can delete Annotations; leave it off when you want to retain them.',
      },
      {
        heading: 'Resolve with evidence',
        paragraphs: [
          'In the MCP workflow, the agent Claims the Annotation before editing, implements the request, verifies it, and marks it Resolved. Open your app and check the result yourself. A Resolved status records completion; it does not replace your review.',
          'Design Actions require a structured Resolution Record describing the result and verification. Ordinary Annotations resolve without that record. Resolved and Discarded Annotations remain history until explicit Deletion.',
        ],
      },
      {
        heading: 'Preview an edit without changing source',
        paragraphs: [
          'For a single Target, Element Edits let you describe changes to text, styles, or CSS and preview them in the page. Use this to make your request concrete before handing it to the agent.',
          'A browser preview is not a saved source-code change. The agent still needs to locate the implementation in your project and apply the change there. Verify the resulting app after implementation.',
        ],
      },
      {
        heading: 'Give several elements one shared brief',
        paragraphs: [
          'Enter annotation mode and hold Shift while selecting the first Target. Release Shift, then select or deselect other Targets. With two to eight selected, choose Annotate, write the shared brief, and save.',
          'All Targets must be on the same exact page URL. Use Edit selection to adjust them without losing your draft. Multiple Targets share one Annotation and lifecycle; text, style, and CSS edits are available only for single-Target Annotations.',
        ],
      },
    ],
  },
  {
    slug: 'agent-setup',
    title: 'Agent Setup',
    summary: 'Connect the development server to Codex or another MCP-compatible coding agent.',
    sections: [
      {
        heading: 'Start the installed server',
        paragraphs: ['Start Waypoint after installing it from a GitHub Release or npm. The local server listens on IPv4 loopback.'],
        code: 'waypoint start',
      },
      {
        heading: 'Give your agent the Waypoint workflow',
        paragraphs: [
          'Install the recommended Waypoint skill in each coding-agent harness that will handle Annotations. The Skills CLI detects supported agents and lets you choose the destinations. This gives the agent Waypoint’s workflow guidance; connect MCP next so it can reach the local Queue.',
        ],
        code: 'npx skills@latest add logbookfordevs/logbook-waypoint --skill waypoint --global',
        note: 'The GitHub installer uses the global universal target without a selection menu, preferring AFK when installed. Run this command yourself to select a specific coding-agent harness.',
      },
      {
        heading: 'Add Waypoint to supported agents',
        paragraphs: [
          'Add MCP can detect supported coding agents and guide you through the configuration it will update. It configures the connection but does not install or start Waypoint.',
        ],
        code: 'npx add-mcp http://127.0.0.1:3846/mcp --name logbook-waypoint --global',
      },
      {
        heading: 'Verify the connection with one request',
        paragraphs: [
          'After configuring MCP, reload or reconnect your agent’s MCP tools if your client requires it. Run waypoint status to check the local server, then ask the agent to read Waypoint for the URL open in your browser.',
          'A successful connection returns your saved Annotations, or an empty result when that URL has no work yet. An empty Queue is not a connection failure. Save a test Annotation on that page and ask again; the agent should be able to report your comment.',
          'Your app’s port and Waypoint’s port serve different purposes: use your app URL to identify the work, and http://127.0.0.1:3846/mcp to configure the tool connection.',
          'Use the project root, such as http://localhost:3000/, to read across the project. A path such as /account narrows the request to that page; including a query or hash narrows it to that captured view, such as a particular filter or tab.',
        ],
        code: 'Read my Waypoint annotations for http://localhost:3000/. Tell me what is pending before changing anything.',
      },
      {
        heading: 'Keep a foreground Watch',
        paragraphs: [
          'Agent harnesses that surface background command output can keep a foreground Waypoint consumer running while implementation continues. Structured mode emits one complete untrusted MCP result envelope per line and reconnects through the existing durable Watch journal.',
          'The command retrieves activity without creating or renewing Claims. It cannot guarantee that an idle agent wakes up: scheduling attention remains the responsibility of the coding-agent harness.',
        ],
        code: 'waypoint watch http://localhost:3000/ --json',
        note: 'Use --once for one bounded result. Resume a restarted consumer with --cursor only after the agent has processed the envelope carrying that cursor.',
      },
      {
        heading: 'Connect Codex',
        paragraphs: [
          'Add the local streamable HTTP endpoint to Codex configuration. The server remains on IPv4 loopback and does not require a LAN binding.',
        ],
        code: '[mcp_servers.logbook-waypoint]\nurl = "http://127.0.0.1:3846/mcp"',
      },
      {
        heading: 'Connect another MCP client',
        paragraphs: [
          'JSON-based clients can register the same provider-neutral endpoint. Pi, OpenCode, and other MCP-compatible agents may present the setting in different places, but Waypoint’s tools and lifecycle do not change.',
        ],
        code: '{\n  "mcpServers": {\n    "logbook-waypoint": {\n      "url": "http://127.0.0.1:3846/mcp"\n    }\n  }\n}',
        note: 'Use http://127.0.0.1:3846/mcp for streamable HTTP. The legacy SSE endpoint remains available at http://127.0.0.1:3846/sse.',
      },
      {
        heading: 'Explore the MCP tool surface',
        paragraphs: [
          'Open the Signal Chart for a visual explanation of how work travels from Annotation → Queue → MCP → agent, including lifecycle transitions and all 19 Waypoint MCP tools.',
        ],
        resource: {
          href: signalChartUrl,
          label: 'Open the Waypoint Signal Chart',
        },
      },
    ],
  },
  {
    slug: 'queue-and-lifecycle',
    title: 'Queue and Lifecycle',
    summary: 'Understand Pending, Claim, Work Notice, Resolved, Discarded, and Deletion.',
    sections: [
      {
        heading: 'Queue is retained work state',
        paragraphs: [
          'The Queue contains Annotations available to agents and history retained from completed work. It is not a disposable clipboard and it does not remove work merely because Watch delivered it.',
        ],
      },
      {
        heading: 'Lifecycle authority',
        paragraphs: [
          'Pending means an Annotation is available to Claim. Claim gives one agent temporary ownership. A Work Notice explains why an attempt could not proceed without inventing a separate blocked lifecycle state.',
          'Resolved retains completed work; a Design Action also retains its required Resolution Record. Discarded intentionally closes work without implementation. Deletion is the separate, permanent removal action.',
        ],
      },
      {
        heading: 'Read the state before taking action',
        paragraphs: [
          'Open the Queue to inspect saved feedback and its status. Pending means the work is available; Claimed means an agent has temporary ownership. Reading or watching the Queue does not Claim the work, and a Claim alone does not mean the source has changed.',
          'When work returns to Pending with a Work Notice, read the explanation before retrying. Repair the missing prerequisite or clarify the request, then ask the agent to claim it again. If a session was interrupted, have the next agent inspect both the Annotation and the current source before continuing.',
        ],
      },
      {
        heading: 'Close work or remove its history',
        paragraphs: [
          'Discard an Annotation when you no longer want its request implemented. Delete it when you want the retained record removed permanently. Neither action is a source-code undo; ask your agent separately if an implementation also needs to be reverted.',
          'In Settings → Data & Storage, review stored projects and choose Delete project data, Delete old history when available, or Clear all Waypoint data. Read the confirmation before clicking again. When unfinished Variants are present, the confirmation explicitly includes discarding them.',
          'Deleting stored Variant data does not clean temporary code out of your repository. If an agent created a Scaffold, arrange source cleanup before deleting the records it needs to understand that work.',
        ],
      },
    ],
  },
  {
    slug: 'variants',
    title: 'Variants',
    summary: 'Explore named candidates while Waypoint owns evaluation and final cleanup.',
    sections: [
      {
        heading: 'Request named candidates',
        paragraphs: [
          'Use Variants when you want to compare approaches before committing to one. In your Annotation, turn on Request Variants and describe meaningful differences: “Compare a compact inline alert with a more prominent banner. Keep the wording the same.” Ask your connected agent to implement the request.',
          'The request is Variant Intent; the generated candidates form a Variant Set. Requesting candidates does not itself generate them—the coding agent must do that work. Variants do not require a Design Action or Impeccable.',
        ],
      },
      {
        heading: 'Compare before you Keep',
        paragraphs: [
          'Open the Annotation’s generated Variants and activate a named candidate to see it on the page. Switching the Active Variant changes the presentation for evaluation; it does not resolve the Annotation or commit to that choice.',
          'Close and reopen the Annotation to continue the same comparison. To discard the Active Variant, activate another candidate first. An unresolved comparison must retain at least two candidates, so individual discard is unavailable when it would leave only one.',
        ],
      },
      {
        heading: 'Finalize cleanly',
        paragraphs: [
          'When you have decided, use Keep for the chosen candidate. This is the decision to preserve that implementation and finish the comparison. Ask the agent to reconcile the decision in source and verify the final result before resolving the Annotation.',
          'Some comparisons need temporary source code, called a Scaffold, so candidates can coexist. Waypoint records your decision; the coding agent removes that temporary structure and the unwanted implementations. A Keep decision is not proof that source cleanup has finished.',
        ],
      },
      {
        heading: 'Cancel a comparison or request another attempt',
        paragraphs: [
          'Cancel the Variant Set when you want to end the comparison without keeping a candidate. Cancellation removes its stored candidates and preview while preserving the Annotation as Pending. It is different from discarding the Annotation itself.',
          'Tell the agent to clean up any temporary source Scaffold after cancellation. The cancellation event represents your decision, not lost work to recreate. Author new Variant Intent if you want another comparison.',
          'While a Variant Set is unresolved, the brief and Design Intent are read-only. For revisions to an existing comparison, discuss the changes with the agent so it can replace the candidate set. If cleanup fails, inspect the remaining work with the agent before trying to resolve the Annotation.',
        ],
      },
    ],
  },
  {
    slug: 'design-actions',
    title: 'Design Actions',
    summary: 'Use Impeccable design disciplines from an Annotation while Waypoint keeps one trustworthy workflow.',
    sections: [
      {
        heading: 'Install Impeccable first',
        prerequisite: 'Required only for Design Actions. Ordinary Waypoint Annotations do not require Impeccable.',
        paragraphs: [
          'Design Actions are powered by the external Impeccable skill. Install Impeccable for the coding agent that will claim the Annotation, following its current agent-specific instructions.',
          'Waypoint does not install Impeccable or detect whether an agent can load it. Waypoint does not currently certify a particular agent installation path, so confirm the skill is available in the same environment where the agent connects to Waypoint through MCP.',
        ],
        resource: {
          href: 'https://github.com/pbakaus/impeccable',
          label: 'Open Impeccable installation and setup instructions',
        },
      },
      {
        heading: 'Write one brief, then choose the discipline',
        paragraphs: [
          'Describe the desired outcome in the normal Annotation comment, then turn on Design Actions. Leave the action unselected for Design Actions · Freeform, or choose one named discipline: Bolder, Quieter, Distill, Polish, Typeset, Colorize, Layout, Animate, Delight, or Overdrive.',
          'Each Annotation carries at most one primary Design Action. The comment remains the only brief, so constraints and context stay together instead of drifting across two prompt fields.',
        ],
      },
      {
        heading: 'Choose a discipline by the result you want',
        paragraphs: [
          'Use a brief such as “Make the main action easier to notice without adding more color,” then choose the discipline that matches your goal. Bolder asks for stronger expression; Quieter asks for restraint; Typeset focuses on typography; Layout focuses on arrangement. Freeform lets the brief guide the approach without naming a discipline.',
          'Include constraints the agent cannot infer from a screenshot: preserve the wording, keep the mobile layout, or avoid changing shared components. After implementation, inspect the result and the Resolution Record, which captures the Design Action’s completion summary and verification evidence.',
        ],
      },
      {
        heading: 'Request Variants separately',
        paragraphs: [
          'A Design Action describes how the agent should approach the interface. Request Variants asks for multiple named candidates. You can use either feature alone or combine them on the same Annotation.',
          'When Variants are requested, Waypoint owns the Active Variant, discard and Keep decisions, and final cleanup. Finalize the chosen candidate before resolving the Annotation so the coding agent can reconcile temporary source Scaffold safely.',
        ],
      },
      {
        heading: 'Recover when the skill is unavailable',
        paragraphs: [
          'If the executing agent cannot load Impeccable, it should not silently replace the requested discipline with generic design work. The Annotation returns to Pending with a workflow_unavailable Work Notice.',
          'Install or repair Impeccable in that agent environment, then claim the same Annotation again. The original brief and Design Intent remain in the Queue for the next attempt.',
        ],
        note: 'If you do not use Impeccable, turn off Show Design Actions in extension settings. Existing saved Design Intent remains visible when you reopen its Annotation.',
      },
      {
        heading: 'Keep one workflow authority',
        paragraphs: [
          'Impeccable supplies the design methodology. Waypoint remains responsible for the Annotation, Queue, Claim and Watch state, Work Notices, retained results, Variant selection, and cleanup decisions. The coding agent remains responsible for source changes.',
          'Waypoint does not embed Impeccable Live or adopt its separate picker, polling, preview, or acceptance workflow. That boundary keeps one authoritative lifecycle and makes interrupted work recoverable through the normal Queue.',
        ],
      },
    ],
  },
  {
    slug: 'security',
    title: 'Security',
    summary: 'Inspect the local boundary that keeps Annotation work on the developer machine.',
    sections: [
      {
        heading: 'Loopback by default',
        paragraphs: [
          'The Waypoint server binds to IPv4 loopback by default. Annotation data and local JSON persistence remain on the developer machine, and the website never attempts to discover or connect to a visitor’s local server.',
        ],
      },
      {
        heading: 'Decide what context to share',
        paragraphs: [
          'An Annotation can include your comment, page URL, selected element text and context, captured styles, and optional screenshots or attachments. Review the page and request for sensitive information before sharing them with a coding agent.',
          'Use the screenshot setting to control capture, and grant site access only where you want to annotate. Copied feedback goes wherever you paste it. MCP makes context available to your connected agent, whose provider and data policies still apply; local storage does not mean the agent processes everything locally.',
        ],
      },
      {
        heading: 'Find and remove retained data',
        paragraphs: [
          'The extension keeps browser-side data, and the local server persists Annotation records in ~/.logbook-waypoint/annotations.json. Stopping the server does not erase those records.',
          'Use Settings → Data & Storage to inspect projects and permanently remove stored Annotations. Review unfinished Variant work before deletion so your agent can clean up any temporary source code. Removing the browser extension or CLI is a separate operation from managing retained server data.',
        ],
      },
      {
        heading: 'Narrow browser boundary',
        paragraphs: [
          'Waypoint exposes no public page-world Annotation CRUD bridge. A narrow read-only probe may assist React Source Identity, but Source Identity is untrusted context rather than guaranteed source mapping.',
          'Host validation, bounded payloads, explicit site permission, and local-only defaults are part of the active boundary rather than optional deployment advice.',
        ],
        note: 'Treat Source Identity as a lead to verify, never as authority to modify a file without inspection.',
      },
    ],
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    summary: 'Check the local server, route enablement, and rebuilt extension before deeper diagnosis.',
    sections: [
      {
        heading: 'The toolbar is unavailable',
        paragraphs: [
          'Confirm the page route is enabled, the extension has site permission, and the page was refreshed after loading a new extension build. Browser-extension content scripts cannot always update an already-open page without a reload.',
        ],
      },
      {
        heading: 'The agent cannot see the Queue',
        paragraphs: [
          'Confirm the local server is running and the MCP client points to the expected loopback endpoint. Check the extension compatibility notice if server and extension builds come from different revisions.',
          'Run waypoint status first. If the server is stopped, run waypoint start and check again. If it fails to start, inspect waypoint logs for the reported error. Reconnect your agent’s MCP tools after correcting its configuration.',
          'If tools connect but return no Annotations, compare the requested URL with the browser address, especially its port and path. A page or view filter can exclude work elsewhere in the project; try the project root. Save a small test Annotation at the intended URL and read again.',
        ],
        code: 'waypoint status\nwaypoint logs',
      },
      {
        heading: 'The agent stopped noticing new feedback',
        paragraphs: [
          'Ask the agent to read the Queue again for the explicit app URL. Watch delivers activity, but it cannot guarantee that your coding-agent harness wakes an idle agent or keeps scheduling reads while the agent edits.',
          'If you use waypoint watch, keep its terminal process running and inspect any reported connection error. See Agent Setup for the foreground consumer and resumption options. A quiet Watch does not by itself mean an Annotation was deleted.',
        ],
      },
      {
        heading: 'A preview is gone or the source looks unchanged',
        paragraphs: [
          'Element Edits and Active Variants are browser presentations, not proof of a permanent source change. Ask the agent whether it implemented and verified the request in your repository.',
          'For Variants, inspect the Queue for a Keep or cancellation decision before asking the agent to restore anything. Cancellation intentionally removes the comparison; recreating it would reverse that decision. If the original Target no longer exists, open the Annotation from the Queue and ask the agent to inspect the changed page structure.',
        ],
      },
      {
        heading: 'A screenshot misses image pixels',
        paragraphs: [
          'Image capture can be affected by resource decoding, cross-origin rules, canvas restrictions, or unsupported source types. Preserve the Annotation and report the capture context; do not assume a retrieved crop contains every resource merely because metadata exists.',
        ],
      },
    ],
  },
  {
    slug: 'releases',
    title: 'Releases',
    summary: 'Choose the supported extension and CLI channels that fit your workflow.',
    sections: [
      {
        heading: 'CLI releases',
        paragraphs: [
          'Tagged Waypoint releases publish the local server and CLI through npm and as a checksummed GitHub Release archive. The public install script resolves and verifies the latest archive before installing it.',
          'Use npm when you prefer registry-managed global packages. Use the GitHub installer when you prefer the release archive under ~/.local/share/logbook-waypoint with a launcher in ~/.local/bin.',
        ],
        code: 'curl -fsSL https://waypoint.logbookfordevs.com/install.sh | bash\n# or\nnpm install --global @logbookfordevs/waypoint',
      },
      {
        heading: 'Update the installation you already use',
        paragraphs: [
          'For an npm installation, rerun npm install --global @logbookfordevs/waypoint. For a GitHub Release installation, rerun the public installer. Then run waypoint restart and waypoint status so the running server uses the updated installation.',
          'Manage the store extension through Chrome’s extension updates. For an unpacked source build, rebuild, reload it in chrome://extensions, and refresh your app tab. If Waypoint reports a compatibility mismatch, update the server and extension before retrying the workflow.',
        ],
      },
      {
        heading: 'Stop using Waypoint',
        paragraphs: [
          'Run waypoint stop to stop the local server. Remove its MCP entry from each agent where you configured it, and remove the browser extension through Chrome when you no longer need annotation tools.',
          'For npm installations, use npm uninstall --global @logbookfordevs/waypoint. The GitHub installer’s --unlink option removes its managed launcher; it is not a full data wipe. Review and delete unwanted Annotation history through Data & Storage before removing the tools you use to access it.',
        ],
      },
      {
        heading: 'Browser extension availability',
        paragraphs: [
          'The supported browser extension is available from the Chrome Web Store. Source builds remain available for contributors and local extension development.',
          'Follow GitHub Releases for CLI versions and the repository documentation for development builds.',
        ],
        resource: {
          href: chromeWebStoreUrl,
          label: 'Open Logbook Waypoint in the Chrome Web Store',
        },
      },
    ],
  },
];

export function getDocumentationPage(slug: string) {
  return documentationPages.find((page) => page.slug === slug);
}
