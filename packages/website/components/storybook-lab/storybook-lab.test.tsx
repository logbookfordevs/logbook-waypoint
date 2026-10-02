import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorybookLab } from './storybook-lab';

vi.mock('next/dynamic', () => ({ default: () => function Scene({ onArrive }: { onArrive: () => void }) { return <button onClick={onArrive}>Finish camera</button>; } }));

beforeEach(() => {
  window.history.replaceState(null, '', '/lab/storybook');
  Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }) });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function finishCamera() { fireEvent.click(screen.getByText('Finish camera')); }

describe('storybook playable cut', () => {
  it('supports a direct Queue entry with a complete sample record', () => {
    window.history.replaceState(null, '', '#queue');
    render(<StorybookLab />);
    expect(screen.getByText('WP-001')).toBeInTheDocument();
    expect(screen.getByText('QUEUED')).toBeInTheDocument();
  });

  it('retains the visitor note and record identity from Annotation to Queue', () => {
    render(<StorybookLab />);
    fireEvent.click(screen.getByRole('button', { name: /Open the atlas/ }));
    finishCamera();
    fireEvent.change(screen.getByLabelText('Try it. What would you change?'), { target: { value: 'Increase button contrast.' } });
    fireEvent.click(screen.getByRole('button', { name: /Pin annotation/ }));
    expect(screen.getByText('WP-001')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Send to Queue/ }));
    finishCamera();
    expect(screen.getByText('Increase button contrast.')).toBeInTheDocument();
    expect(screen.getByText('QUEUED')).toBeInTheDocument();
    expect(screen.getByText('WP-001')).toBeInTheDocument();
  });

  it('does not accept blank annotations and exposes skip during travel', () => {
    render(<StorybookLab />);
    fireEvent.click(screen.getByRole('button', { name: /Open the atlas/ }));
    expect(screen.queryByRole('button', { name: /Pin annotation/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /skip to destination/ }));
    fireEvent.change(screen.getByLabelText('Try it. What would you change?'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: /Pin annotation/ })).toBeDisabled();
  });

  it('keeps the complete flow available without the renderer under reduced motion', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    render(<StorybookLab />);
    expect(screen.queryByText('Finish camera')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Open the atlas/ }));
    fireEvent.click(screen.getByRole('button', { name: /Pin annotation/ }));
    fireEvent.click(screen.getByRole('button', { name: /Send to Queue/ }));
    expect(screen.getByText('QUEUED')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /skip to destination/ })).not.toBeInTheDocument();
  });

  it('requires sound opt-in and returns to a usable prologue on replay', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    render(<StorybookLab />);
    fireEvent.click(screen.getByRole('button', { name: /Open the atlas/ }));
    finishCamera();
    expect(play).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Voice off' }));
    expect(play).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    finishCamera();
    expect(screen.getByRole('button', { name: /Open the atlas/ })).toBeEnabled();
  });
});
