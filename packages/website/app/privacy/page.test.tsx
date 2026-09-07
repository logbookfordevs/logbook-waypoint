import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrivacyPage from '@/app/privacy/page';

describe('PrivacyPage', () => {
  it('publishes the local-first data boundary and Chrome Limited Use disclosure', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByText(/Chrome Web Store User Data Policy/)).toBeInTheDocument();
    expect(screen.getByText(/127\.0\.0\.1:3846/)).toBeInTheDocument();
    expect(screen.getByText(/does not require a Logbook account/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /security policy/i })).toHaveAttribute(
      'href',
      'https://github.com/logbookfordevs/logbook-waypoint/blob/main/SECURITY.md',
    );
  });
});
