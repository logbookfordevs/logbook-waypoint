import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteJourney } from '@/components/route-journey';

describe('Waypoint route journey', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the complete product story available without motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<RouteJourney />);

    expect(screen.getByRole('heading', { name: 'A field note your agent can follow.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Mark the rendered target.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Keep the field note intact.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Turn context into action.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Return with evidence.' })).toBeVisible();
  });
});
