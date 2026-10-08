import { describe, expect, it, vi } from 'vitest';

import { InkRouteRenderer } from '@/components/ink-route-renderer';

describe('InkRouteRenderer', () => {
  it('reports the static fallback when WebGL is unavailable', () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    const onStatus = vi.fn();

    const renderer = InkRouteRenderer.create(canvas, onStatus);

    expect(renderer).toBeNull();
    expect(onStatus).toHaveBeenCalledWith('unavailable');
  });
});
