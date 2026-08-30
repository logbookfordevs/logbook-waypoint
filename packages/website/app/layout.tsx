import '@fontsource-variable/besley';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/literata/400.css';
import '@fontsource/literata/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import type { Metadata } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { ThemeBoundary } from '@/components/theme-boundary';
import { siteUrl } from '@/lib/site-config';

import '@/app/globals.css';
import '@/app/styles/hero.css';
import '@/app/styles/workflow.css';
import '@/app/styles/route-journey.css';
import '@/app/styles/journey-home.css';
import '@/app/styles/marketing.css';
import '@/app/styles/docs.css';
import '@/app/styles/motion-and-responsive.css';

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
    <html lang="en">
      <body>
        <template
          data-design-contract
          dangerouslySetInnerHTML={{
            __html: `<!-- impeccable:direction-contract
THESIS: Feedback travels as one visible route from rendered Target to retained Resolution; reject the detached screenshot-and-feature-card developer-tool default.
OWN-WORLD: Atlantic Chartroom Ocean and Walnut; cool chart paper, Deep Ocean instruments, Verdigris bearings, Signal Rust annotations, and restrained brass coordinates.
STORY: Understand the Annotation to Queue to agent mechanism, trust the local boundary, then enter honest early-stage documentation.
FIRST VIEWPORT: Paper navigation and promise lead immediately into one dense horizontal operational field; the mechanism is larger than mascot or marketing copy.
FORM: The Living Route is refined from the verified structural reference rather than copied; the implementation preserves sequence while owning its proportions, material, and behavior.
FINISH: Production work is complete only after independent visual review and design-system documentation.
-->`,
          }}
        />
        <ThemeBoundary>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ThemeBoundary>
      </body>
    </html>
  );
}
