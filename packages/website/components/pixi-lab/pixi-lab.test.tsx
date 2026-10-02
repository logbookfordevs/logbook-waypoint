import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PixiLab } from '@/components/pixi-lab/pixi-lab';

const renderer = vi.hoisted(() => ({ travel: vi.fn(), destroy: vi.fn(), create: vi.fn() }));
vi.mock('@/components/pixi-lab/atlas', () => ({ createAtlas: renderer.create }));

function motion(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
}

beforeEach(() => {
  vi.clearAllMocks();
  renderer.travel.mockResolvedValue(undefined);
  renderer.create.mockResolvedValue(renderer);
  window.history.replaceState(null, '', '/labs/pixi');
  motion(false);
  vi.stubGlobal('Audio', class {
    pause = vi.fn();
    play = vi.fn().mockResolvedValue(undefined);
    src = '';
    currentTime = 0;
  });
});

describe('Pixi field note', () => {
  it('requires a nonempty pinned note and carries the edited intent into Queue', async () => {
    render(<PixiLab />);
    const enter = screen.getByRole('button', { name: /Trace the first point/ });
    await waitFor(() => expect(enter).toBeEnabled());
    fireEvent.click(enter);
    await screen.findByRole('heading', { name: /precise/ });
    const carry = screen.getByRole('button', { name: /Carry it/ });
    expect(carry).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Pin an Annotation to this button/ }));
    const note = screen.getByRole('textbox');
    fireEvent.change(note, { target: { value: '   ' } });
    expect(carry).toBeDisabled();
    fireEvent.change(note, { target: { value: 'Increase the left padding.' } });
    fireEvent.click(carry);
    await screen.findByRole('heading', { name: 'The Queue' });
    expect(screen.getByText('Increase the left padding.')).toBeVisible();
    expect(screen.getByText('button · /welcome')).toBeVisible();
    expect(screen.getByText(/Demo only; no data is sent/)).toBeVisible();
  });

  it('skips an in-flight leg without allowing its late completion to undo replay', async () => {
    let finish: (() => void) | undefined;
    renderer.travel.mockImplementation((_target: number, immediate: boolean) => immediate ? Promise.resolve() : new Promise<void>((resolve) => { finish = resolve; }));
    render(<PixiLab />);
    const enter = screen.getByRole('button', { name: /Trace the first point/ });
    await waitFor(() => expect(enter).toBeEnabled());
    fireEvent.click(enter);
    fireEvent.click(screen.getByRole('button', { name: /Skip to destination/ }));
    expect(screen.getByRole('heading', { name: /precise/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    await act(async () => finish?.());
    expect(screen.getByRole('heading', { name: /Every change/ })).toBeVisible();
  });

  it('supports reduced-motion direct entry and editing without a renderer', async () => {
    motion(true);
    window.history.replaceState(null, '', '/labs/pixi#annotation');
    render(<PixiLab />);
    expect(screen.getByRole('button', { name: 'Motion off' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Pin an Annotation to this button/ }));
    fireEvent.click(screen.getByRole('button', { name: /Carry it/ }));
    await screen.findByRole('heading', { name: 'The Queue' });
    expect(screen.getByRole('link', { name: /Set up your own route/ })).toBeVisible();
    expect(renderer.create).not.toHaveBeenCalled();
  });
  it('keeps the note workflow operable after GPU startup fails', async () => {
    renderer.create.mockRejectedValue(new Error('WebGL unavailable'));
    render(<PixiLab />);
    const enter = screen.getByRole('button', { name: /Trace the first point/ });
    await waitFor(() => expect(enter).toBeEnabled());
    fireEvent.click(enter);
    await screen.findByRole('heading', { name: /precise/ });
    fireEvent.click(screen.getByRole('button', { name: /Pin an Annotation to this button/ }));
    fireEvent.click(screen.getByRole('button', { name: /Carry it/ }));
    await screen.findByRole('heading', { name: 'The Queue' });
  });

  it('reconstructs destinations on same-document hash navigation', async () => {
    render(<PixiLab />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Trace the first point/ })).toBeEnabled());
    await act(async () => {
      window.history.replaceState(null, '', '/labs/pixi#queue');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { name: 'The Queue' })).toBeVisible();
    await act(async () => {
      window.history.replaceState(null, '', '/labs/pixi#annotation');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByRole('heading', { name: /precise/ })).toBeVisible();
  });

});
