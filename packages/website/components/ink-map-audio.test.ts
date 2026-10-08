import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InkMapAudio } from '@/components/ink-map-audio';

interface FakeSource { buffer: { file: string } | null; loop: boolean; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }

const sources: FakeSource[] = [];
const contexts: FakeContext[] = [];

function fakeParam() {
  return { value: 0, setTargetAtTime: vi.fn(), cancelScheduledValues: vi.fn() };
}

class FakeContext {
  currentTime = 0;
  destination = {};
  resume = vi.fn(async () => {});
  suspend = vi.fn(async () => {});
  close = vi.fn(async () => {});
  constructor() { contexts.push(this); }
  createGain() { return { gain: fakeParam(), connect: (node: unknown) => node, disconnect: vi.fn() }; }
  createBufferSource() {
    const source = { buffer: null, loop: false, onended: null, start: vi.fn(), stop: vi.fn(), connect: (node: unknown) => node, disconnect: vi.fn() };
    sources.push(source);
    return source;
  }
  decodeAudioData = vi.fn(async (bytes: { file: string }) => bytes);
}

const started = (file: string) => sources.filter(source => source.buffer?.file === file && source.start.mock.calls.length > 0);

async function enabledAudio() {
  const audio = new InkMapAudio();
  audio.setEnabled(true);
  await vi.waitFor(() => expect(started('harbour-ambience')).toHaveLength(1));
  return audio;
}

beforeEach(() => {
  sources.length = 0;
  contexts.length = 0;
  vi.stubGlobal('AudioContext', FakeContext);
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    arrayBuffer: async () => ({ file: url.replace('/sfx/', '').replace('.mp3', '') }),
  })));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('ink map audio', () => {
  it('stays silent and loads nothing until sound is switched on', () => {
    const audio = new InkMapAudio();
    audio.cue('blob');
    audio.setPen(1);
    audio.setActive(true);
    expect(contexts).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('plays cues and loops once enabled', async () => {
    const audio = await enabledAudio();
    expect(started('shanty-loop')[0].loop).toBe(true);
    audio.cue('blob');
    audio.cue('checkpoint');
    expect(started('ink-blob')).toHaveLength(1);
    expect(started('checkpoint-arrive')).toHaveLength(1);
  });

  it('stops every sound when the visitor leaves the map and resumes on return', async () => {
    const audio = await enabledAudio();
    audio.cue('complete');
    vi.useFakeTimers();
    audio.setActive(false);
    audio.cue('blob');
    expect(started('ink-blob')).toHaveLength(0);
    vi.advanceTimersByTime(300);
    expect(started('route-complete')[0].stop).toHaveBeenCalledOnce();
    expect(contexts[0].suspend).toHaveBeenCalledOnce();

    audio.setActive(true);
    expect(contexts[0].resume).toHaveBeenCalled();
    audio.cue('blob');
    expect(started('ink-blob')).toHaveLength(1);
  });

  it('does not suspend when the visitor returns before the fade ends', async () => {
    const audio = await enabledAudio();
    vi.useFakeTimers();
    audio.setActive(false);
    audio.setActive(true);
    vi.advanceTimersByTime(300);
    expect(contexts[0].suspend).not.toHaveBeenCalled();
  });

  it('switching sound off silences it even on the map', async () => {
    const audio = await enabledAudio();
    vi.useFakeTimers();
    audio.setEnabled(false);
    vi.advanceTimersByTime(300);
    expect(contexts[0].suspend).toHaveBeenCalledOnce();
    audio.cue('tick');
    expect(started('ui-tick')).toHaveLength(0);
  });

  it('fetches ahead of the gesture without creating a context, then decodes the fetched files', async () => {
    const audio = new InkMapAudio();
    audio.preload();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(9));
    expect(contexts).toHaveLength(0);

    audio.setEnabled(true);
    await vi.waitFor(() => expect(started('harbour-ambience')).toHaveLength(1));
    expect(contexts).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(9);
    audio.cue('drip');
    expect(started('ink-drip')).toHaveLength(1);
  });
});
