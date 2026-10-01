import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, Compass, Route } from 'lucide-react';

import { documentationPages } from '@/lib/docs-content';
import { chromeWebStoreUrl, createSocialMetadata, signalChartUrl } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'The Logbook Waypoint field guide for local Annotations, personal journals, and agent workflows.',
  alternates: { canonical: '/docs' },
  ...createSocialMetadata({
    title: 'Documentation — Logbook Waypoint',
    description: 'The Logbook Waypoint field guide for local Annotations, personal journals, and agent workflows.',
    url: '/docs',
  }),
};

export default function DocumentationIndex() {
  return (
    <article className="docs-index">
      <h1>Waypoint field guide</h1>
      <p className="docs-lede">
        Point to something in your interface, explain what should change, and hand the feedback to
        your coding agent, or keep personal thoughts on the page in Journal mode. Start with Installation,
        then choose Core Workflow or Journal Mode for the way you want to work.
      </p>
      <div className="docs-notice">
        <Compass aria-hidden="true" />
        <div><strong>Waypoint is available now</strong><p>Install the extension from the <a href={chromeWebStoreUrl} target="_blank" rel="noreferrer">Chrome Web Store</a>. Add the local server separately through npm or a checksummed GitHub Release for agent workflows.</p></div>
      </div>
      <a className="docs-signal-chart" href={signalChartUrl} target="_blank" rel="noreferrer">
        <Route aria-hidden="true" />
        <span>
          <small>Visual route map</small>
          <strong>Explore the Waypoint Signal Chart</strong>
          <p>See how work travels from Annotation → Queue → MCP → agent, alongside all 19 MCP tools.</p>
        </span>
        <ArrowUpRight aria-hidden="true" />
      </a>
      <div className="docs-index__routes">
        {documentationPages.map((page) => (
          <Link key={page.slug} href={`/docs/${page.slug}`}>
            <BookOpen aria-hidden="true" />
            <span><strong>{page.title}</strong><small>{page.summary}</small></span>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </article>
  );
}
