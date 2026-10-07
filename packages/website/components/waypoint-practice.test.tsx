import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WaypointPractice } from '@/components/waypoint-practice';

describe('Waypoint practice', () => {
  it('keeps the scripted change pending until claimed and explicitly applied, then retains history', () => {
    render(<WaypointPractice />);
    fireEvent.click(screen.getByRole('button', { name: 'Start the exercise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.change(screen.getByLabelText('What should change?'), { target: { value: 'Please use Save changes.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Annotation' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Queue' }));
    const queue = within(screen.getByRole('region', { name: 'Demo Queue' }));
    expect(queue.getByText('Please use Save changes.')).toBeInTheDocument();
    expect(queue.getByText('Pending')).toBeInTheDocument();
    fireEvent.click(queue.getByRole('button', { name: 'Simulate Claim' }));
    expect(queue.getByText('Claimed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    fireEvent.click(queue.getByRole('button', { name: 'Apply demo change & resolve' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    expect(queue.getByText('Resolved')).toBeInTheDocument();
    expect(queue.getByText('Please use Save changes.')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('region', { name: 'Demo Queue' }), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Open Queue' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Open Queue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Collapse demo toolbar' }));
    fireEvent.keyDown(screen.getByRole('region', { name: 'Demo Queue' }), { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Expand demo toolbar' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(screen.queryByRole('region', { name: 'Demo Queue' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the exercise' })).toBeInTheDocument();
  });

  it('can dismiss a draft without creating an Annotation', () => {
    render(<WaypointPractice />);
    fireEvent.click(screen.getByRole('button', { name: 'Start the exercise' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annotate' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.keyDown(screen.getByLabelText('What should change?'), { key: 'Escape' });
    expect(screen.queryByRole('form', { name: 'New Annotation' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Queue' }));
    expect(screen.getByText(/No Annotations yet/)).toBeInTheDocument();
  });
});
