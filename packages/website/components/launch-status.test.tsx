import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LaunchStatus } from '@/components/launch-status';

describe('launch posture', () => {
  it('distinguishes the available CLI from the source-built extension', () => {
    render(<LaunchStatus />);

    fireEvent.click(screen.getByRole('button', { name: 'Available now' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Install the CLI from npm or a checksummed GitHub Release.',
    );
    expect(screen.queryByRole('link', { name: /install/i })).not.toBeInTheDocument();
  });
});
