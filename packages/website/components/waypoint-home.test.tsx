import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';
import type { InkMapJourneyProps } from '@/components/ink-map-journey';
import { WaypointHome } from '@/components/waypoint-home';

const map = vi.hoisted(() => ({ mount: vi.fn(), dispose: vi.fn() }));
vi.mock('next/dynamic', () => ({
  default: () => function TestMap({ onContinue, onExit, inline }: InkMapJourneyProps) {
    useEffect(() => { map.mount(inline); return () => { map.dispose(); }; }, [inline]);
    return <div><button onClick={onContinue}>More details</button><button onClick={onExit}>Skip to details</button></div>;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('journey-first Waypoint homepage', () => {
  it('starts the inline map before the hero, Editorial and local-first content', () => {
    render(<WaypointHome />);
    expect(map.mount).toHaveBeenCalledWith(true);
    const mapRegion = screen.getByRole('region', { name: 'Waypoint Ink Map Journey' });
    const hero = screen.getByRole('region', { name: 'Pin the point. Chart the change.' });
    const editorial = screen.getByRole('region', { name: 'A small mark. A clear direction.' });
    const local = screen.getByRole('region', { name: 'Local by default. Useful after the work.' });
    expect(mapRegion.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(hero.compareDocumentPosition(editorial) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(editorial.compareDocumentPosition(local) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Get the extension' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Or try a field note' })).toHaveAttribute('href', '#try-waypoint');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('continues into the hero without disposing the chart or resetting a custom Editorial note', async () => {
    render(<WaypointHome />);
    fireEvent.click(screen.getByRole('button', { name: 'Make your mark' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'My own field note' } });
    await screen.findByRole('heading', { name: 'Less explaining. More pointing.' });
    fireEvent.click(screen.getByRole('button', { name: 'More details' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pin the point. Chart the change.' })).toHaveFocus());
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });
    expect(map.dispose).not.toHaveBeenCalled();
    expect(map.mount).toHaveBeenCalledOnce();
    expect(screen.getByRole('textbox')).toHaveValue('My own field note');
  });

  it('lets returning visitors skip directly to details and releases the renderer on page unmount', async () => {
    const view = render(<WaypointHome />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip to details' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Pin the point. Chart the change.' })).toHaveFocus());
    expect(within(screen.getByRole('navigation', { name: 'Homepage' })).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs');
    expect(map.dispose).not.toHaveBeenCalled();
    view.unmount();
    expect(map.dispose).toHaveBeenCalledOnce();
  });
});
