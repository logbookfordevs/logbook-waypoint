import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
});
