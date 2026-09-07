import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LaunchStatus } from '@/components/launch-status';

describe('launch posture', () => {
  it('links the available extension to its official store listing', () => {
    render(<LaunchStatus />);

    fireEvent.click(screen.getByRole('button', { name: 'Available now' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Install the browser extension from the Chrome Web Store.',
    );
    expect(screen.getByRole('link', { name: /Chrome Web Store/i })).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/logbook-waypoint/fgondknhkpekdhbbkgodokmpnpadfedo',
    );
  });
});
