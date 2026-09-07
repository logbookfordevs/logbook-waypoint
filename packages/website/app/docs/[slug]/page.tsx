import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, CircleAlert } from 'lucide-react';
import { notFound } from 'next/navigation';

import { CodeBlock } from '@/components/code-block';
import { documentationPages, getDocumentationPage } from '@/lib/docs-content';

interface DocumentationRouteProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return documentationPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: DocumentationRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocumentationPage(slug);

  if (!page) {
    return {};
  }

  const canonicalPath = `/docs/${page.slug}`;
  return {
    title: page.title,
    description: page.summary,
    alternates: { canonical: canonicalPath },
    openGraph: { url: canonicalPath },
  };
}

export default async function DocumentationRoute({ params }: DocumentationRouteProps) {
  const { slug } = await params;
  const page = getDocumentationPage(slug);

  if (!page) {
    notFound();
  }

  const currentIndex = documentationPages.findIndex((item) => item.slug === slug);
  const previousPage = documentationPages[currentIndex - 1];
  const nextPage = documentationPages[currentIndex + 1];
  const previousPageLink = previousPage
    ? <Link href={`/docs/${previousPage.slug}`}><ArrowLeft /> <span>Previous<strong>{previousPage.title}</strong></span></Link>
    : <span />;

  return (
    <article className="docs-article">
      <h1>{page.title}</h1>
      <p className="docs-lede">{page.summary}</p>
      <p className="docs-article__bearing">Field guide · {String(currentIndex + 1).padStart(2, '0')}</p>
      <nav className="article-toc" aria-label="On this page">
        <strong>On this page</strong>
        {page.sections.map((section) => (
          <a key={section.heading} href={`#${toAnchor(section.heading)}`}>{section.heading}</a>
        ))}
      </nav>

      {page.sections.map((section) => (
        <section key={section.heading} id={toAnchor(section.heading)}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.code && <CodeBlock code={section.code} />}
          {section.resource && (
            <a className="docs-resource-link" href={section.resource.href} target="_blank" rel="noreferrer">
              {section.resource.label}
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          {section.note && (
            <aside className="field-note">
              <CircleAlert aria-hidden="true" />
              <p><strong>Field note</strong>{section.note}</p>
            </aside>
          )}
        </section>
      ))}

      <nav className="article-pagination" aria-label="Adjacent documentation">
        {previousPageLink}
        {nextPage && (
          <Link href={`/docs/${nextPage.slug}`}><span>Next<strong>{nextPage.title}</strong></span> <ArrowRight /></Link>
        )}
      </nav>
    </article>
  );
}

function toAnchor(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
}
