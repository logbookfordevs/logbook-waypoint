import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InkRouteTracer } from '@/components/ink-route-tracer';

const audioSpies = vi.hoisted(() => ({
  dispose: vi.fn(),
  playCheckpoint: vi.fn(),
  playImpact: vi.fn(),
  prepare: vi.fn(),
  setMuted: vi.fn(),
  setScratchVelocity: vi.fn(),
  suspend: vi.fn(),
  unlock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/components/ink-route-audio', () => ({
  InkRouteAudio: class {
    dispose = audioSpies.dispose;
    playCheckpoint = audioSpies.playCheckpoint;
    playImpact = audioSpies.playImpact;
    prepare = audioSpies.prepare;
    setMuted = audioSpies.setMuted;
    setScratchVelocity = audioSpies.setScratchVelocity;
    suspend = audioSpies.suspend;
    unlock = audioSpies.unlock;
  },
}));

function mockMotionPreference(reduced: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('Ink Route signature tracer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    window.history.replaceState(null, '', '/');
    mockMotionPreference(false);
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(performance.now());
      return 1;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('scrollTo', vi.fn());
  });

  it('keeps the bounded hero and Annotation story available as semantic content', () => {
    render(<InkRouteTracer />);

    expect(screen.getByRole('heading', { name: /Mark what matters/i })).toBeVisible();
    expect(screen.getByRole('link', { name: /Get Waypoint/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /See the journey/i })).toBeVisible();
    expect(screen.getByText('Target retained.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Queue/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Agent/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Resolution/i })).not.toBeInTheDocument();
  });

  it('carries the director-selected held-breath rhythm into the replacement tracer', () => {
    const { container } = render(<InkRouteTracer />);

    expect(container.querySelector('.ink-route')).toHaveAttribute('data-rhythm', 'held-breath');
    expect(screen.getByText(/Director's rhythm · held breath/i)).toBeVisible();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('prepares audio on contact before journey activation', () => {
    render(<InkRouteTracer />);
    const journeyButton = screen.getByRole('button', { name: /See the journey/i });

    fireEvent.pointerDown(journeyButton);

    expect(audioSpies.prepare).toHaveBeenCalledOnce();
    expect(audioSpies.unlock).not.toHaveBeenCalled();

    mockMotionPreference(true);
    fireEvent.click(journeyButton);

    expect(audioSpies.unlock).toHaveBeenCalledOnce();
  });

  it('uses the completed static destination and focus handoff for reduced motion', async () => {
    mockMotionPreference(true);
    render(<InkRouteTracer />);

    fireEvent.click(screen.getByRole('button', { name: /See the journey/i }));

    const journeyHeading = screen.getByRole('heading', { name: 'The route authors the world.' });
    await waitFor(() => expect(journeyHeading).toHaveFocus());
    expect(window.scrollTo).toHaveBeenCalled();
  });
});
