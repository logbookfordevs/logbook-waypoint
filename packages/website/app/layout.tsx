import '@fontsource-variable/besley';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/literata/400.css';
import '@fontsource/literata/500.css';
import '@fontsource/literata/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import type { Metadata } from 'next';

import { SiteChrome } from '@/components/site-chrome';
import { ThemeBoundary } from '@/components/theme-boundary';
import { siteUrl } from '@/lib/site-config';

import '@/app/globals.css';
import '@/app/styles/hero.css';
import '@/app/styles/workflow.css';
import '@/app/styles/route-journey.css';
import '@/app/styles/journey-home.css';
import '@/app/styles/ink-route.css';
import '@/app/styles/marketing.css';
import '@/app/styles/docs.css';
import '@/app/styles/motion-and-responsive.css';
import '@/app/styles/ink-map.css';

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
        <ThemeBoundary>
          <SiteChrome>{children}</SiteChrome>
        </ThemeBoundary>
      </body>
    </html>
  );
}
