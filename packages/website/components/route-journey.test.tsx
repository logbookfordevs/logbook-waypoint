import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clampProgress,
  getChapterIndex,
  getChapterVisibility,
  RouteJourney,
} from '@/components/route-journey';

describe('Waypoint route journey', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(16);
      return 1;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps the complete product story available without motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<RouteJourney />);

    expect(screen.getByRole('heading', { name: 'Pin the point. Chart the change.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'The route begins exactly where the thought happened.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'A field note becomes retained work.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Your agent receives a route, not a riddle.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'The route closes where it began.' })).toBeVisible();
    expect(screen.getAllByRole('link', { name: /Get Waypoint/i })[0]).toHaveAttribute(
      'href',
      'https://chromewebstore.google.com/detail/logbook-waypoint/fgondknhkpekdhbbkgodokmpnpadfedo',
    );
  });

  it('maps scroll progress deterministically into the journey chapters', () => {
    expect(clampProgress(-0.2)).toBe(0);
    expect(clampProgress(1.2)).toBe(1);
    expect(getChapterIndex(0)).toBe(0);
    expect(getChapterIndex(0.249)).toBe(0);
    expect(getChapterIndex(0.25)).toBe(1);
    expect(getChapterIndex(1)).toBe(3);
    expect(getChapterVisibility(0, 0)).toBe(1);
    expect(getChapterVisibility(0.125, 0)).toBe(1);
    expect(getChapterVisibility(0.5, 2)).toBe(0);
  });

  it('hands keyboard focus to the static journey without enabling sound for reduced motion', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    render(<RouteJourney />);
    fireEvent.click(screen.getByRole('button', { name: 'See the journey' }));
    vi.runAllTimers();

    expect(screen.getByRole('region', { name: 'The Waypoint journey from Annotation to Resolution' })).toHaveFocus();
    expect(document.querySelector('.ink-route-home')).toHaveAttribute('data-sound', 'off');
  });
});
