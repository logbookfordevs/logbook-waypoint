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
        paragraphs: ['Run the public installer to download and verify the latest Waypoint CLI release.'],
        code: 'curl -fsSL https://waypoint.logbookfordevs.com/install.sh | bash\nwaypoint start',
      },
      {
        heading: 'Install through npm',
        prerequisite: 'Node.js 18+ required. GitHub installs to ~/.local/bin and flags missing PATH setup.',
        paragraphs: [
          'Install the published package globally, or use npx for a temporary first look. Start runs the local server in the background by default.',
        ],
        code: 'npm install --global @logbookfordevs/waypoint\nwaypoint start',
        note: 'Use waypoint status to check the server, waypoint logs to inspect it, waypoint stop when finished, or waypoint start --foreground for a terminal-attached session.',
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
          'Enable Waypoint for the route you are working on, enter annotation mode, and select the page or Target that needs attention. Add a concise brief; screenshots, attachments, Element Edits, Design Intent, and Variant Intent are optional context.',
        ],
      },
      {
        heading: 'Let the Queue retain the work',
        paragraphs: [
          'Saving creates a Pending Annotation in the local Queue. Watch can deliver that activity without Claiming or removing it. The record remains inspectable as an agent Claims and resolves the request.',
        ],
      },
      {
        heading: 'Resolve with evidence',
        paragraphs: [
          'An agent Claims temporary ownership, completes the requested change, and records a provider-neutral Resolution Record. Resolved and Discarded Annotations remain history until explicit Deletion.',
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
        heading: 'Add Waypoint to supported agents',
        paragraphs: [
          'Add MCP can detect supported coding agents and guide you through the configuration it will update. It configures the connection but does not install or start Waypoint.',
        ],
        code: 'npx add-mcp http://127.0.0.1:3846/mcp --name logbook-waypoint --global',
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
          'Resolved retains completed work and its Resolution Record. Discarded intentionally closes work without implementation. Deletion is the separate, permanent removal action.',
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
          'Variant Intent asks an agent to produce multiple named Variants for one Annotation. Waypoint owns the resulting Variant Set, the Active Variant shown for evaluation, and the selection workflow.',
        ],
      },
      {
        heading: 'Finalize cleanly',
        paragraphs: [
          'A temporary Scaffold allows candidates to coexist. Finalization preserves the chosen implementation and removes the Scaffold plus every discarded Variant. Candidate generation never creates a parallel lifecycle outside the Annotation.',
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
