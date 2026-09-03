import type { Metadata } from 'next';
import { CircleAlert, LockKeyhole, MapPin, Server, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Logbook Waypoint handles, stores, shares, and deletes local Annotation data.',
  alternates: { canonical: '/privacy' },
  openGraph: { url: '/privacy' },
};

const policySections = [
  {
    id: 'data-waypoint-handles',
    title: 'Data Waypoint handles',
    icon: MapPin,
    paragraphs: [
      'When you create an Annotation, Waypoint processes the annotated page URL, including its path, query, and fragment; the Annotation text you write; and any visual changes you select.',
      'Waypoint also records context for the selected element. This may include its text, tag, classes, stable attributes used by its selector, computed styles, dimensions and position, viewport size, parent context, selector, available component or source-file identity, and the click or pin offset used to place the Annotation.',
      'If you choose to include them, Waypoint also handles captured screenshots and image attachments. Preferences, enabled sites, Queue state, synchronization state, and retained lifecycle history are stored so the extension can preserve your workflow.',
    ],
  },
  {
    id: 'storage-and-transfer',
    title: 'Where data is stored and sent',
    icon: Server,
    paragraphs: [
      'The browser extension stores Annotations and preferences in Chrome local extension storage on your device.',
      'When you run the optional Waypoint server, the extension may synchronize Annotation data to 127.0.0.1:3846 on the same device. The server is designed to listen only on the IPv4 loopback interface and stores its Queue and file-backed media locally.',
      'Waypoint does not send Annotation data, browsing activity, screenshots, or attachments to Logbook for Devs or another Logbook-operated external server. A coding agent you separately connect to the local Waypoint server may receive Annotation data when you direct that workflow. That disclosure is governed by the terms and privacy practices of the agent and its provider.',
    ],
  },
  {
    id: 'collection-and-sale',
    title: 'What Waypoint does not collect',
    icon: ShieldCheck,
    paragraphs: [
      'Waypoint does not require a Logbook account. It does not include advertising, analytics, or telemetry, and Logbook for Devs does not remotely collect or sell Waypoint user data.',
      'Waypoint does not use its permissions to build a browsing history. Links may open external websites only when you choose them; those sites operate under their own privacy policies.',
    ],
  },
  {
    id: 'permissions',
    title: 'Browser permissions',
    icon: LockKeyhole,
    paragraphs: [
      'Waypoint uses browser permissions to access the active tab when invoked, store local data, install the Annotation interface on development pages, capture the visible tab when screenshots are enabled, and let you explicitly enable additional sites.',
      'Waypoint’s use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.',
    ],
  },
  {
    id: 'retention-and-deletion',
    title: 'Retention and deletion',
    icon: CircleAlert,
    paragraphs: [
      'Resolved and Discarded Annotations remain as lifecycle history until you delete them. Waypoint provides controls to delete individual Annotations, clean retained history, delete a project’s data, or clear all Waypoint data.',
      'You can also remove data by clearing the extension’s stored data or deleting the local server’s data. Deleting synchronized data may require the server to be running so the deletion can be reconciled across both local stores.',
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <main id="main-content" className="privacy-page">
      <article className="privacy-policy">
        <header className="privacy-policy__header">
          <h1>Privacy Policy</h1>
          <p>
            Logbook Waypoint is a local-first browser extension and coding-agent tool for placing
            structured visual annotations on interfaces under development.
          </p>
          <p className="privacy-policy__date">Last updated September 3, 2026</p>
        </header>

        <nav className="privacy-policy__contents" aria-label="Privacy policy sections">
          {policySections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>{section.title}</a>
          ))}
          <a href="#security-and-contact">Security and contact</a>
        </nav>

        <div className="privacy-policy__summary">
          <ShieldCheck aria-hidden="true" />
          <p>
            <strong>Your Annotation work stays local by default.</strong>
            No Logbook account, advertising, analytics, telemetry, sale, or external Logbook data
            collection is part of Waypoint.
          </p>
        </div>

        {policySections.map(({ id, title, icon: Icon, paragraphs }) => (
          <section key={id} id={id}>
            <Icon aria-hidden="true" />
            <div>
              <h2>{title}</h2>
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}

        <section id="security-and-contact">
          <LockKeyhole aria-hidden="true" />
          <div>
            <h2>Security and contact</h2>
            <p>
              Waypoint limits its server to the local loopback interface, validates browser origins
              and identifiers, and treats page-derived content as untrusted. Read the project’s{' '}
              <a href="https://github.com/logbookfordevs/logbook-waypoint/blob/main/SECURITY.md">
                security policy and private reporting instructions
              </a>.
            </p>
            <p>
              For privacy questions, open an issue in the{' '}
              <a href="https://github.com/logbookfordevs/logbook-waypoint/issues">
                Logbook Waypoint repository
              </a>. Do not include sensitive Annotation data in a public issue.
            </p>
            <p>
              Material changes to this policy will be published with a revised date. Chrome Web
              Store disclosures will also be updated when a release changes how Waypoint handles data.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
