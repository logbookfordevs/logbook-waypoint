export interface DocumentationSection {
  heading: string;
  paragraphs: string[];
  code?: string;
  note?: string;
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
    summary: 'Prepare a development build while public distribution is still coming soon.',
    sections: [
      {
        heading: 'Current availability',
        paragraphs: [
          'Logbook Waypoint is not yet published to the Chrome Web Store or npm. The steps below are for repository development and should not be presented as a supported public installer.',
          'When a supported channel exists, this page will keep the same route and distinguish store installation from source development.',
        ],
        note: 'Early-development path: expect to rebuild and reload the unpacked extension as the project changes.',
      },
      {
        heading: 'Build from source',
        paragraphs: ['Clone the repository, install the pnpm workspace, and build the extension.'],
        code: 'git clone https://github.com/logbookfordevs/logbook-waypoint.git\ncd logbook-waypoint\npnpm install\npnpm build',
      },
      {
        heading: 'Load the extension',
        paragraphs: [
          'Open chrome://extensions, enable Developer mode, choose Load unpacked, and select packages/extension/.output/chrome-mv3.',
          'Start the local server separately before expecting an MCP-compatible agent to see the Queue.',
        ],
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
        heading: 'Start the development server',
        paragraphs: ['Run the local Waypoint server from the workspace while public npm distribution remains unavailable.'],
        code: 'pnpm --filter @logbookfordevs/waypoint start',
      },
      {
        heading: 'Configure an MCP client',
        paragraphs: [
          'Point your agent to the local Waypoint server using that client’s MCP configuration. Keep the connection on loopback; LAN exposure is not part of the supported security boundary.',
          'The exact configuration format belongs to the chosen agent. Waypoint’s tools and lifecycle remain provider-neutral.',
        ],
        note: 'Codex, Pi, OpenCode, and other MCP-compatible agents may expose different configuration surfaces. Follow the client’s own documentation for registering a local MCP server.',
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
    summary: 'Attach optional structured design direction without replacing the Annotation lifecycle.',
    sections: [
      {
        heading: 'Optional Design Intent',
        paragraphs: [
          'A Design Intent adds a guided operation such as Polish, Layout, Typeset, or Animate to an ordinary Annotation. The request stays provider-neutral when no workflow is selected.',
          'Design Actions require the Impeccable skill, but Impeccable contributes discipline rather than owning Queue state, Claim, Watch, or resolution.',
        ],
      },
      {
        heading: 'One primary action',
        paragraphs: [
          'Each Annotation carries at most one primary Design Action. The freeform brief can still add constraints, and a freeform Impeccable direction is valid without choosing a predefined action.',
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
    summary: 'Track availability without mistaking source development for a published channel.',
    sections: [
      {
        heading: 'Coming soon',
        paragraphs: [
          'Waypoint has no supported public extension or npm release yet. Repository history is development evidence, not a store availability claim.',
          'This page will become the canonical release index when signed extension builds and a supported server package are available.',
        ],
      },
      {
        heading: 'Follow development',
        paragraphs: ['Use the repository to inspect current work, licenses, and source-level setup.'],
        code: 'https://github.com/logbookfordevs/logbook-waypoint',
      },
    ],
  },
];

export function getDocumentationPage(slug: string) {
  return documentationPages.find((page) => page.slug === slug);
}
