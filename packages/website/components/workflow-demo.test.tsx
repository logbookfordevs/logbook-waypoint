import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkflowDemo } from '@/components/workflow-demo';

describe('Waypoint workflow demonstration', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('filters the Queue through visible lifecycle controls', () => {
    render(<WorkflowDemo />);

    fireEvent.change(screen.getByLabelText('Filter Queue by lifecycle'), {
      target: { value: 'claimed' },
    });

    const queue = screen.getByRole('region', { name: 'Annotation Queue' });
    expect(within(queue).getByText('No Claimed Annotations yet.')).toBeVisible();
    expect(within(queue).queryByText('Tighten the empty state')).not.toBeInTheDocument();
  });

  it('shows agent progress and announces a retained resolution', async () => {
    vi.useFakeTimers();
    render(<WorkflowDemo />);

    fireEvent.click(screen.getByRole('button', { name: 'Resolve Annotation #1842' }));

    expect(screen.getByRole('button', { name: 'Resolving Annotation #1842' })).toBeDisabled();
    expect(screen.getByText('Running checks…')).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(screen.getByRole('button', { name: 'Annotation #1842 resolved' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Annotation #1842 resolved with a retained Resolution Record.',
    );
  });

  it('keeps the complete workflow available when motion is reduced', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));

    render(<WorkflowDemo />);

    expect(screen.getByText('Annotate')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Annotation Queue' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Resolve Annotation #1842' })).toBeVisible();
  });
});
