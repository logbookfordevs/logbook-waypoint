import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DocsNavigation } from '@/components/docs-navigation';

vi.mock('next/navigation', () => ({ usePathname: () => '/docs/security' }));

describe('documentation navigation', () => {
  it('exposes the current field-guide route', () => {
    render(<DocsNavigation />);

    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Documentation' })).not.toHaveAttribute('aria-current');
  });
});
