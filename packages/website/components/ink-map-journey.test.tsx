import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InkMapAudio } from '@/components/ink-map-audio';
import { InkMapJourney } from '@/components/ink-map-journey';

const gpu = vi.hoisted(() => ({
  fails: false,
  dispose: vi.fn(),
  render: vi.fn(),
}));

vi.mock('three', async importOriginal => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    WebGLRenderer: class {
      capabilities = { getMaxAnisotropy: () => 1 };
      setClearColor() {}
      setPixelRatio() {}
      setSize() {}
      render = gpu.render;
      dispose = gpu.dispose;
      constructor() {
        if (gpu.fails) throw new Error('WebGL unavailable');
      }
    },
  };
});

let time = 0;
let nextFrame: FrameRequestCallback | undefined;
let reducedMotion = false;

function frame(ms: number) {
  time = ms;
  const callback = nextFrame;
  nextFrame = undefined;
  act(() => callback?.(time));
}

beforeEach(() => {
  time = 0;
  reducedMotion = false;
  gpu.fails = false;
  vi.clearAllMocks();
  vi.spyOn(performance, 'now').mockImplementation(() => time);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    nextFrame = callback;
    return 1;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn(() => { nextFrame = undefined; }));
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: reducedMotion,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  Object.defineProperty(document, 'fonts', { configurable: true, value: {
    load: () => new Promise(() => {}), ready: new Promise(() => {}),
  } });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('OpenDesign ink map journey', () => {
  it('releases native scrolling at the inline overview and never captures input below the map', () => {
    reducedMotion = true;
    const onContinue = vi.fn();
    const view = render(<InkMapJourney inline onContinue={onContinue} onExit={vi.fn()} />);
    const root = view.container.firstElementChild as HTMLElement;
    let top = 0;
    vi.spyOn(root, 'getBoundingClientRect').mockImplementation(() => ({ top } as DOMRect));
    frame(0);
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(within(screen.getByLabelText('Journey controls')).getByRole('button', { name: 'More details' })).toBeVisible();
    const momentum = new WheelEvent('wheel', { deltaY: 100, cancelable: true });
    window.dispatchEvent(momentum);
    expect(momentum.defaultPrevented).toBe(true);
    time = 1000;
    const onward = new WheelEvent('wheel', { deltaY: 100, cancelable: true });
    window.dispatchEvent(onward);
    expect(onward.defaultPrevented).toBe(false);
    expect(onContinue).not.toHaveBeenCalled();
    top = -1000;
    const ordinary = new WheelEvent('wheel', { deltaY: -100, cancelable: true });
    window.dispatchEvent(ordinary);
    expect(ordinary.defaultPrevented).toBe(false);
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(screen.getByRole('heading', { name: 'The route, charted.' })).toBeVisible();
    top = 0;
    fireEvent.keyDown(document.body, { key: 'ArrowUp' });
    expect(screen.getByRole('heading', { name: 'Check the work against the note.' })).toBeVisible();
  });

  it('pauses at zero visible area even while intersecting and resumes the same unfinished leg', () => {
    let intersectionChanged: ((ratio: number) => void) | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionChanged = ratio => callback([{ isIntersecting: true, intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      disconnect = disconnect;
    });
    const view = render(<InkMapJourney inline onContinue={vi.fn()} />);
    frame(3000);
    fireEvent.click(screen.getByRole('button', { name: 'Set course' }));
    time = 3500;
    intersectionChanged?.(0);
    const renders = gpu.render.mock.calls.length;
    frame(10000);
    expect(gpu.render).toHaveBeenCalledTimes(renders);
    intersectionChanged?.(0.001);
    frame(11000);
    expect(screen.getByRole('button', { name: 'Charting…' })).toBeVisible();
    frame(18000);
    expect(screen.getByRole('heading', { name: 'Pin the note where the problem lives.' })).toBeVisible();
    view.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(gpu.dispose).toHaveBeenCalledOnce();
  });

  it('continues into the homepage at the overview, with Replay kept as a secondary choice', () => {
    reducedMotion = true;
    const onContinue = vi.fn();
    render(<InkMapJourney onContinue={onContinue} />);
    frame(0);
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(screen.getByRole('heading', { name: 'The route, charted.' })).toBeVisible();
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Replay the journey' }));
    frame(0);
    expect(screen.getByRole('button', { name: 'Set course' })).toBeVisible();
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.click(within(screen.getByLabelText('Journey controls')).getByRole('button', { name: 'Make your own mark' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('allows a fresh scroll to continue past the overview, but not leftover wheel momentum', () => {
    reducedMotion = true;
    const onContinue = vi.fn();
    render(<InkMapJourney onContinue={onContinue} />);
    frame(0);
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowDown' });
    fireEvent.wheel(window, { deltaY: 100 });
    expect(onContinue).not.toHaveBeenCalled();
    time = 1000;
    fireEvent.wheel(window, { deltaY: 100 });
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('holds at each destination, goes back, and replays from departure', () => {
    render(<InkMapJourney />);
    frame(3000);
    expect(screen.getByRole('heading', { name: 'Chart the route before the build.' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Set course' }));
    expect(screen.getByRole('button', { name: 'Charting…' })).toHaveAttribute('aria-disabled', 'true');
    frame(10000);
    expect(screen.getByRole('heading', { name: 'Pin the note where the problem lives.' })).toBeVisible();
    frame(30000);
    expect(screen.getByRole('heading', { name: 'Pin the note where the problem lives.' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    frame(40000);
    expect(screen.getByRole('button', { name: 'Set course' })).toBeVisible();

    for (let i = 1; i <= 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: i === 1 ? 'Set course' : i === 5 ? 'Full route' : 'Next checkpoint' }));
      frame(40000 + i * 10000);
    }
    expect(screen.getByRole('heading', { name: 'The route, charted.' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    frame(100000);
    expect(screen.getByRole('button', { name: 'Set course' })).toBeVisible();
  });

  it('supports direct checkpoint navigation and keyboard travel with reduced motion', () => {
    reducedMotion = true;
    render(<InkMapJourney />);
    frame(0);
    fireEvent.click(screen.getByRole('button', { name: 'Checkpoint 3: Agent pick' }));
    expect(screen.getByRole('heading', { name: 'An agent claims the next bearing.' })).toBeVisible();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: 'Check the work against the note.' })).toBeVisible();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByRole('button', { name: 'Checkpoint 3: Agent pick, current' })).toHaveAttribute('aria-current', 'step');
  });

  it('keeps sound off until asked, cues the journey, and silences it when the map is left', () => {
    let intersectionChanged: ((ratio: number) => void) | undefined;
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionChanged = ratio => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      disconnect() {}
    });
    vi.stubGlobal('AudioContext', class {});
    const cue = vi.spyOn(InkMapAudio.prototype, 'cue').mockImplementation(() => {});
    const setEnabled = vi.spyOn(InkMapAudio.prototype, 'setEnabled').mockImplementation(() => {});
    const setActive = vi.spyOn(InkMapAudio.prototype, 'setActive');
    const onExit = vi.fn();
    render(<InkMapJourney inline onContinue={vi.fn()} onExit={onExit} />);

    expect(screen.getByRole('button', { name: 'Sound off' })).toHaveAttribute('aria-pressed', 'false');
    expect(setEnabled).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Sound off' }));
    expect(setEnabled).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true');

    frame(0);
    frame(400);
    frame(1400);
    frame(3000);
    expect(cue.mock.calls.map(([name]) => name).filter(name => name !== 'tick')).toEqual(['drip', 'blob', 'card']);
    fireEvent.click(screen.getByRole('button', { name: 'Set course' }));
    frame(3100);
    frame(10000);
    expect(cue).toHaveBeenCalledWith('checkpoint');

    intersectionChanged?.(0.4);
    expect(setActive).toHaveBeenLastCalledWith(false);
    intersectionChanged?.(0.9);
    expect(setActive).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Skip to details' }));
    expect(setActive).toHaveBeenLastCalledWith(false);
    expect(onExit).toHaveBeenCalledOnce();
  });

  it('removes input listeners and disposes the GPU when unmounted', () => {
    const view = render(<InkMapJourney />);
    frame(3000);
    view.unmount();
    expect(gpu.dispose).toHaveBeenCalledOnce();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    const wheel = new WheelEvent('wheel', { deltaY: 100, cancelable: true });
    window.dispatchEvent(wheel);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('keeps all field notes readable when WebGL is unavailable or lost', () => {
    gpu.fails = true;
    const fallback = render(<InkMapJourney />);
    expect(fallback.container.firstChild).toHaveClass('no-webgl');
    expect(screen.getAllByRole('heading')).toHaveLength(6);
    fallback.unmount();

    gpu.fails = false;
    const active = render(<InkMapJourney />);
    frame(3000);
    fireEvent(active.container.querySelector('canvas')!, new Event('webglcontextlost', { cancelable: true }));
    expect(active.container.firstChild).toHaveClass('no-webgl');
    expect(screen.getAllByRole('heading')).toHaveLength(6);
    expect(gpu.dispose).toHaveBeenCalledOnce();
  });

  describe('Let the ink fall entrance', () => {
    function stubAudio() {
      vi.stubGlobal('AudioContext', class {});
      return {
        cue: vi.spyOn(InkMapAudio.prototype, 'cue').mockImplementation(() => {}),
        setEnabled: vi.spyOn(InkMapAudio.prototype, 'setEnabled').mockImplementation(() => {}),
        preload: vi.spyOn(InkMapAudio.prototype, 'preload').mockImplementation(() => {}),
      };
    }
    const cues = (cue: ReturnType<typeof stubAudio>['cue']) => cue.mock.calls.map(([name]) => name).filter(name => name !== 'tick');

    it('holds the ink and the sound until the visitor presses', () => {
      const audio = stubAudio();
      const view = render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      const root = view.container.firstElementChild as HTMLElement;

      frame(0);
      frame(5000);
      expect(root).toHaveClass('is-poised');
      expect(screen.getByRole('button', { name: 'Let the ink fall' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Begin without sound' })).toBeVisible();
      expect(screen.queryByRole('heading', { name: 'Chart the route before the build.' })).toBeNull();
      expect(audio.preload).toHaveBeenCalled();
      expect(audio.setEnabled).not.toHaveBeenCalled();
      expect(cues(audio.cue)).toEqual([]);
    });

    it('hands keyboard focus to the journey control when the entrance is pressed', async () => {
      stubAudio();
      render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      frame(0);
      const press = screen.getByRole('button', { name: 'Let the ink fall' });
      press.focus();
      fireEvent.click(press);
      await act(async () => {});
      expect(screen.queryByRole('button', { name: 'Let the ink fall' })).toBeNull();
      expect(document.activeElement).toHaveAttribute('id', 'next');
    });

    it('turns sound on within the press and cues the drip and the blob', () => {
      const audio = stubAudio();
      const view = render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      const root = view.container.firstElementChild as HTMLElement;

      frame(0);
      fireEvent.click(screen.getByRole('button', { name: 'Let the ink fall' }));
      expect(audio.setEnabled).toHaveBeenCalledWith(true);
      expect(screen.getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true');
      expect(root).not.toHaveClass('is-poised');
      expect(screen.queryByRole('button', { name: 'Let the ink fall' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Begin without sound' })).toBeNull();

      frame(400);
      frame(1400);
      frame(3000);
      expect(cues(audio.cue)).toEqual(['drip', 'blob', 'card']);
      expect(screen.getByRole('heading', { name: 'Chart the route before the build.' })).toBeVisible();
    });

    it.each([
      ['Begin without sound', () => fireEvent.click(screen.getByRole('button', { name: 'Begin without sound' }))],
      ['a wheel scroll', () => fireEvent.wheel(window, { deltaY: 100 })],
      ['a navigation key', () => fireEvent.keyDown(window, { key: 'ArrowDown' })],
    ])('begins silently with %s', (_label, begin) => {
      const audio = stubAudio();
      render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      frame(0);
      begin();
      expect(audio.setEnabled).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Sound off' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Let the ink fall' })).toBeNull();
      frame(100);
      frame(3200);
      expect(screen.getByRole('heading', { name: 'Chart the route before the build.' })).toBeVisible();
    });

    it('begins silently after eight seconds of engine time, not while paused', () => {
      let intersectionChanged: ((ratio: number) => void) | undefined;
      vi.stubGlobal('IntersectionObserver', class {
        constructor(callback: IntersectionObserverCallback) {
          intersectionChanged = ratio => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        }
        observe() {}
        disconnect() {}
      });
      const audio = stubAudio();
      const view = render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      const root = view.container.firstElementChild as HTMLElement;

      frame(0);
      frame(5000);
      time = 5000;
      intersectionChanged?.(0);
      frame(60000);
      time = 60000;
      intersectionChanged?.(1);
      frame(62000);
      expect(root).toHaveClass('is-poised');

      frame(66000);
      expect(root).not.toHaveClass('is-poised');
      expect(screen.queryByRole('button', { name: 'Let the ink fall' })).toBeNull();
      expect(audio.setEnabled).not.toHaveBeenCalled();
    });

    it('goes straight to the first card with reduced motion, and replays without the entrance', () => {
      reducedMotion = true;
      const audio = stubAudio();
      render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      frame(0);
      expect(screen.getByRole('button', { name: 'Let the ink fall' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Let the ink fall' }));
      frame(100);
      expect(screen.getByRole('heading', { name: 'Chart the route before the build.' })).toBeVisible();
      expect(audio.setEnabled).toHaveBeenCalledWith(true);

      for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowDown' });
      fireEvent.click(screen.getByRole('button', { name: 'Replay the journey' }));
      frame(200);
      expect(screen.getByRole('button', { name: 'Set course' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Let the ink fall' })).toBeNull();
    });

    it('lets the visitor skip to details while the ink is poised', () => {
      stubAudio();
      const onExit = vi.fn();
      render(<InkMapJourney inline entrance onContinue={vi.fn()} onExit={onExit} />);
      frame(0);
      fireEvent.click(screen.getByRole('button', { name: 'Skip to details' }));
      expect(onExit).toHaveBeenCalledOnce();
    });

    it('shows no entrance, and loads no sound, when WebGL is unavailable', () => {
      gpu.fails = true;
      const audio = stubAudio();
      const view = render(<InkMapJourney inline entrance onContinue={vi.fn()} />);
      expect(view.container.firstChild).toHaveClass('no-webgl');
      expect(screen.queryByRole('button', { name: 'Let the ink fall' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Begin without sound' })).toBeNull();
      expect(audio.preload).not.toHaveBeenCalled();
    });
  });
});
