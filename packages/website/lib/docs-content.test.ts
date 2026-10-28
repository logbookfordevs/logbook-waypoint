import { describe, expect, it } from 'vitest';

import { getDocumentationPage } from '@/lib/docs-content';

describe('agent workflow skill documentation', () => {
  it('recommends the curl installer and gives npm users a separate skill command', () => {
    const installation = getDocumentationPage('installation');
    const recommended = installation?.sections.find((section) => section.heading === 'Recommended: install from a GitHub Release');
    const npm = installation?.sections.find((section) => section.heading === 'Alternative: install through npm');
    const releases = getDocumentationPage('releases');
    const update = releases?.sections.find((section) => section.heading === 'Update the installation you already use');

    expect(recommended?.code).toMatch(/^curl -fsSL /);
    expect(npm?.code).toContain('npx skills@latest add logbookfordevs/logbook-waypoint --skill waypoint --global');
    expect(update?.code).toContain('waypoint update');
  });

  it('describes the skill as the working method for the CLI', () => {
    const installation = getDocumentationPage('installation');
    const skillSection = installation?.sections.find((section) => section.heading === 'Install the agent workflow skill');

    expect(skillSection?.code).toBe(
      'npx skills@latest add logbookfordevs/logbook-waypoint --skill waypoint --global',
    );
    expect(skillSection?.paragraphs.join(' ')).toMatch(/CLI provides access.*skill provides the working method/i);
  });

  it('puts the skill before verification and documents reading on request instead of Watch', () => {
    const agentSetup = getDocumentationPage('agent-setup');
    const headings = agentSetup?.sections.map((section) => section.heading) ?? [];
    const readSection = agentSetup?.sections.find((section) => section.heading === 'Ask the agent to read after you annotate');

    expect(headings.indexOf('Give your agent the Waypoint workflow')).toBeGreaterThanOrEqual(0);
    expect(headings.indexOf('Verify the connection with one request')).toBeGreaterThan(
      headings.indexOf('Give your agent the Waypoint workflow'),
    );
    expect(readSection?.code).toBe('waypoint read http://localhost:3000/');
    expect(readSection?.paragraphs.join(' ')).toMatch(/does not watch for new work/i);
  });

  it('documents MCP migration and no longer teaches MCP setup or Watch', () => {
    const agentSetup = getDocumentationPage('agent-setup');
    const migration = agentSetup?.sections.find((section) => section.heading === 'Migrating from MCP');
    const text = JSON.stringify(agentSetup);

    expect(migration?.code).toBe('waypoint cleanup-mcp');
    expect(text).not.toMatch(/add-mcp|mcp_servers|mcpServers|waypoint watch --|\/mcp\b/);
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
