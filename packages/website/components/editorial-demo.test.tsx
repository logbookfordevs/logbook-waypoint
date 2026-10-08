import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EditorialDemo } from '@/components/editorial-demo';

describe('official Editorial field note', () => {
  it('retains the visitor’s note and target through pinning and the demo Queue, then resets', async () => {
    render(<EditorialDemo />);
    expect(screen.getByText('Interactive demo. Nothing is saved or sent to an agent.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Make your mark' }));
    const input = screen.getByRole('textbox', { name: 'What should change?' });
    await waitFor(() => expect(input).toHaveFocus());
    const customNote = 'Keep the heading, but give its second line more breathing room. '.repeat(3).trim();
    fireEvent.change(input, { target: { value: customNote } });
    fireEvent.click(screen.getByRole('button', { name: 'Pin Annotation' }));
    const pinnedNote = screen.getByRole('article', { name: 'Retained demo Annotation' });
    await waitFor(() => expect(within(pinnedNote).getByText(customNote)).toBeVisible());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send to the Queue' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Send to the Queue' }));
    const queuedNote = screen.getByRole('article', { name: 'Retained demo Annotation' });
    expect(queuedNote).toBe(pinnedNote);
    await waitFor(() => expect(queuedNote).toHaveFocus());
    expect(within(queuedNote).getByText(customNote)).toBeVisible();
    expect(within(queuedNote).getByText('h1')).toBeVisible();
    expect(within(queuedNote).getByText('/studio')).toBeVisible();
    expect(within(queuedNote).getByText('Pending', { exact: false })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('No work was sent to an agent.');
    fireEvent.click(screen.getByRole('button', { name: 'Replay example' }));
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Make your mark' })).toHaveFocus());
    fireEvent.click(screen.getByRole('button', { name: 'Annotate the sample heading' }));
    expect(screen.getByRole('textbox')).toHaveValue('Give this heading a little more room to breathe.');
  });

  it('cancels a pending form focus transfer when replay interrupts the entrance', async () => {
    render(<EditorialDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Make your mark' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replay example' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Make your mark' })).toHaveFocus());
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('rejects blank notes and leaves ordinary scrolling outside its interaction', () => {
    render(<EditorialDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Annotate the sample heading' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' \n ' } });
    expect(screen.getByRole('button', { name: 'Pin Annotation' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('form', { name: 'Demo Annotation' }));
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    const wheel = new WheelEvent('wheel', { deltaY: 100, cancelable: true });
    window.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });
});
