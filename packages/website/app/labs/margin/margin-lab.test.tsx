import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { MarginLab } from '@/app/labs/margin/margin-lab';

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'), media: query,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(), onchange: null,
  }));
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

describe('margin lab handoff', () => {
  it('retains visitor text and context through the Queue and resets on replay', async () => {
    render(<MarginLab />);
    fireEvent.click(screen.getByRole('button', { name: 'Make your mark' }));
    const input = screen.getByRole('textbox', { name: 'What should change?' });
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.change(input, { target: { value: 'Keep this title on two lines.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pin Annotation' }));
    const send = screen.getByRole('button', { name: 'Send to the Queue' });
    await waitFor(() => expect(send).toHaveFocus());
    fireEvent.click(send);
    const retained = screen.getByRole('article', { name: 'Retained Annotation' });
    expect(retained).toHaveTextContent('Keep this title on two lines.');
    expect(retained).toHaveTextContent('/studio');
    await waitFor(() => expect(retained).toHaveFocus());
    expect(screen.getByRole('status')).toHaveTextContent('demo Queue');
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    await waitFor(() => expect(screen.queryByRole('article')).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Make your mark' })).toHaveFocus());
  });

  it('rejects empty notes and provides a complete readable alternative', () => {
    render(<MarginLab />);
    expect(screen.getByRole('link', { name: 'Get Waypoint' })).toHaveAttribute('href', '/docs/installation');
    fireEvent.click(screen.getByRole('button', { name: 'Make your mark' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Pin Annotation' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Readable mode' }));
    expect(screen.getByText(/An MCP-compatible coding agent/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Narration off' })).toHaveAttribute('aria-pressed', 'false');
  });
});
