import { describe, expect, it } from 'vitest';

import { getDocumentationPage } from '@/lib/docs-content';

describe('agent workflow skill documentation', () => {
  it('places skill installation before MCP connection and explains their different jobs', () => {
    const installation = getDocumentationPage('installation');
    const agentSetup = getDocumentationPage('agent-setup');
    const skillSection = installation?.sections.find((section) => section.heading === 'Install the agent workflow skill');
    const skillIndex = agentSetup?.sections.findIndex((section) => section.heading === 'Give your agent the Waypoint workflow');
    const mcpIndex = agentSetup?.sections.findIndex((section) => section.heading === 'Add Waypoint to supported agents');

    expect(skillSection?.code).toBe(
      'npx skills@latest add logbookfordevs/logbook-waypoint --skill waypoint --global',
    );
    expect(skillSection?.paragraphs.join(' ')).toMatch(/MCP provides access.*skill provides the working method/i);
    expect(skillIndex).toBeGreaterThanOrEqual(0);
    expect(mcpIndex).toBeGreaterThan(skillIndex ?? -1);
  });
});

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
