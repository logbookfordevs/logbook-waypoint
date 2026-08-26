'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { documentationPages } from '@/lib/docs-content';

export function DocsNavigation() {
  const pathname = usePathname();

  return (
    <aside className="docs-navigation" aria-label="Documentation navigation">
      <Link
        className="docs-navigation__home"
        href="/docs"
        aria-current={pathname === '/docs' ? 'page' : undefined}
      >
        Documentation
      </Link>
      <nav>
        {documentationPages.map((page) => {
          const href = `/docs/${page.slug}`;
          return (
            <Link key={page.slug} href={href} aria-current={pathname === href ? 'page' : undefined}>
              {page.title}
            </Link>
          );
        })}
      </nav>
      <a href="https://github.com/logbookfordevs/logbook-waypoint">View repository</a>
    </aside>
  );
}
