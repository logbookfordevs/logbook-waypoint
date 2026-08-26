import '@fontsource-variable/besley';
import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Logbook Waypoint — Pin the point. Chart the change.',
    template: '%s — Logbook Waypoint',
  },
  description: 'Local-first visual feedback your coding agent can Watch, Claim, and Resolve.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Logbook Waypoint',
    description: 'Visual feedback your coding agent can act on.',
    type: 'website',
    url: '/',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-recipe="ocean" data-appearance="day">
      <body>
        <template
          data-design-contract
          dangerouslySetInnerHTML={{
            __html: `<!-- impeccable:direction-contract
THESIS: Feedback travels as one visible route from rendered Target to retained Resolution; reject the detached screenshot-and-feature-card developer-tool default.
OWN-WORLD: Atlantic Chartroom Ocean and Walnut; cool chart paper, Deep Ocean instruments, Verdigris bearings, Signal Rust annotations, and restrained brass coordinates.
STORY: Understand the Annotation to Queue to agent mechanism, trust the local boundary, then enter honest early-stage documentation.
FIRST VIEWPORT: Paper navigation and promise lead immediately into one dense horizontal operational field; the mechanism is larger than mascot or marketing copy.
FORM: User-pinned Living Route from the verified prototype handoff, production-refined rather than copied; concept-roll seed not applicable because the approved direction predates the roll.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`,
          }}
        />
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
