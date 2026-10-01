import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight, Info } from 'lucide-react';
import { notFound } from 'next/navigation';

import { CodeBlock } from '@/components/code-block';
import { JournalMarginNote } from '@/components/journal-margin-note';
import { WaypointPractice } from '@/components/waypoint-practice';
import { documentationPages, getDocumentationPage } from '@/lib/docs-content';
import { createSocialMetadata } from '@/lib/site-config';

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
    ...createSocialMetadata({
      title: `${page.title} — Logbook Waypoint`,
      description: page.summary,
      url: canonicalPath,
    }),
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
  const showsPractice = slug === 'core-workflow';
  const isJournalGuide = slug === 'journal-mode';
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
        <div className="article-toc__links">
          {showsPractice && <a href="#try-waypoint">Try Waypoint</a>}
          {page.sections.map((section) => (
            <a key={section.heading} href={`#${toAnchor(section.heading)}`}>{section.heading}</a>
          ))}
        </div>
      </nav>

      {showsPractice && <WaypointPractice />}
      {isJournalGuide && <figure className="docs-journal-screenshot">
        <Image loading="eager" src="/images/journal/journal-notes.png" width={2400} height={1726} sizes="(max-width: 800px) 100vw, 650px" alt="The actual Waypoint toolbar in Journal mode, with a handwritten taped note and curved arrow pointing to a circled heading on a sample project page." />
        <figcaption>The extension in action on a sample page: the Journal switch, taped note, target circle, and connecting arrow.</figcaption>
      </figure>}

      {page.sections.map((section) => {
        const marginNote = isJournalGuide ? journalMarginNotes[section.heading] : undefined;
        const hasMarginNote = marginNote !== undefined;
        const paragraphs = section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>);

        function renderAnnotatedParagraphs() {
          if (!marginNote) return null;
          return <>
            <JournalMarginNote note={marginNote.text} number={marginNote.number}>{paragraphs[0]}</JournalMarginNote>
            {paragraphs.slice(1)}
          </>;
        }

        return <section key={section.heading} id={toAnchor(section.heading)}>
          {section.prerequisite && (
            <p className="docs-section-prerequisite">
              <Info aria-hidden="true" />
              {section.prerequisite}
            </p>
          )}
          <h2>{section.heading}</h2>
          {hasMarginNote && renderAnnotatedParagraphs()}
          {!hasMarginNote && paragraphs}
          {section.code && <CodeBlock code={section.code} />}
          {section.resource && (
            <a className="docs-resource-link" href={section.resource.href} target="_blank" rel="noreferrer">
              {section.resource.label}
              <ArrowUpRight aria-hidden="true" />
            </a>
          )}
          {section.note && (
            <aside className="field-note">
              <Info aria-hidden="true" />
              <p><strong>Field note</strong>{section.note}</p>
            </aside>
          )}
        </section>;
      })}

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

const journalMarginNotes: Record<string, { number: number; text: string }> = {
  'Edit and arrange the paper': { number: 1, text: 'Just like this! This paragraph has its own taped note. The words stay in the guide; the thought lives beside them.' },
  'Copy the visible journal': { number: 2, text: 'The screenshot keeps the paper, circles, and arrows together. It captures what you can see, so arrange your notes before copying.' },
};
