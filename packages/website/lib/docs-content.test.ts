import { describe, expect, it } from 'vitest';

import { getDocumentationPage } from '@/lib/docs-content';

describe('Design Actions documentation', () => {
  it('makes the Impeccable prerequisite, setup link, and recovery path explicit', () => {
    const page = getDocumentationPage('design-actions');
    const copy = page?.sections.flatMap((section) => [
      section.heading,
      section.prerequisite,
      ...section.paragraphs,
      section.note,
    ]).filter(Boolean).join(' ');
    const resources = page?.sections.flatMap((section) => section.resource ?? []);

    expect(copy).toMatch(/Install Impeccable first/);
    expect(copy).toMatch(/workflow_unavailable Work Notice/);
    expect(copy).toMatch(/Request Variants asks for multiple named candidates/);
    expect(resources).toContainEqual({
      href: 'https://github.com/pbakaus/impeccable',
      label: 'Open Impeccable installation and setup instructions',
    });
  });
});
