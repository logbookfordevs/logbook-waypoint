import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteHeader } from '@/components/site-header';
import { ThemeBoundary } from '@/components/theme-boundary';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

function renderHeader() {
  return render(<ThemeBoundary><SiteHeader /></ThemeBoundary>);
}

describe('site navigation', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('closes the mobile navigation with Escape and restores trigger focus', () => {
    const { container } = renderHeader();
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    const navigation = container.querySelector('#primary-navigation');

    expect(navigation).toHaveAttribute('aria-hidden', 'true');
    expect(navigation).toHaveAttribute('inert');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
    expect(navigation).toHaveAttribute('aria-hidden', 'true');
    expect(navigation).toHaveAttribute('inert');
  });

  it('changes the stable appearance boundary through an accessible control', () => {
    const { container } = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

    fireEvent.click(screen.getByRole('button', { name: 'Switch to Night Watch' }));

    expect(container.querySelector('.theme-boundary')).toHaveAttribute('data-appearance', 'night');
    expect(container.querySelector('.theme-boundary')).toHaveAttribute('data-recipe', 'ocean');
    expect(screen.getByRole('button', { name: 'Switch to Day Chart' })).toBeVisible();
  });

  it('marks the current route without relying on color alone', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));

    expect(screen.getByRole('link', { name: 'Workflow' })).toHaveAttribute('aria-current', 'page');
  });
});
