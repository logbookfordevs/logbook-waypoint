import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';

import { documentationPages } from '@/lib/docs-content';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'The Logbook Waypoint field guide for local Annotation and agent workflows.',
  alternates: { canonical: '/docs' },
  openGraph: { url: '/docs' },
};

export default function DocumentationIndex() {
  return (
    <article className="docs-index">
      <h1>Waypoint field guide</h1>
      <p className="docs-lede">
        Learn how a rendered Target becomes retained Queue activity, then connect an MCP-compatible
        coding agent without widening the local boundary.
      </p>
      <div className="docs-notice">
        <Compass aria-hidden="true" />
        <div><strong>CLI available now</strong><p>Install the local server from npm or a checksummed GitHub Release. Build and load the browser extension from source.</p></div>
      </div>
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
