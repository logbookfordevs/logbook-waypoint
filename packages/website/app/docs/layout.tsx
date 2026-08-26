import Link from 'next/link';

import { documentationPages } from '@/lib/docs-content';

export default function DocumentationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main-content" className="docs-shell" data-recipe="walnut">
      <aside className="docs-navigation" aria-label="Documentation navigation">
        <Link className="docs-navigation__home" href="/docs">Documentation</Link>
        <nav>
          {documentationPages.map((page) => (
            <Link key={page.slug} href={`/docs/${page.slug}`}>{page.title}</Link>
          ))}
        </nav>
        <a href="https://github.com/logbookfordevs/logbook-waypoint">View repository</a>
      </aside>
      <div className="docs-reading-surface">{children}</div>
    </main>
  );
}
