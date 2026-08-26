import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LaunchStatus } from '@/components/launch-status';

describe('launch posture', () => {
  it('explains unavailable distribution without presenting a fake installer', () => {
    render(<LaunchStatus />);

    fireEvent.click(screen.getByRole('button', { name: 'Coming soon' }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'The extension and npm package are not published yet.',
    );
    expect(screen.queryByRole('link', { name: /install/i })).not.toBeInTheDocument();
  });
});
