import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SiteHeader } from '@/components/site-header';

describe('site navigation', () => {
  it('closes the mobile navigation with Escape and restores trigger focus', () => {
    render(<SiteHeader />);
    const trigger = screen.getByRole('button', { name: 'Open navigation' });

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });

  it('changes the stable appearance boundary through an accessible control', () => {
    render(<SiteHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Night Watch' }));

    expect(document.documentElement).toHaveAttribute('data-appearance', 'night');
    expect(screen.getByRole('button', { name: 'Switch to Day Chart' })).toBeVisible();
  });
});
