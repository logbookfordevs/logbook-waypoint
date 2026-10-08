import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InkRouteAudio } from '@/components/ink-route-audio';

type AudioParamStub = Pick<AudioParam, 'cancelScheduledValues' | 'exponentialRampToValueAtTime' | 'setTargetAtTime' | 'setValueAtTime' | 'value'>;

function createAudioParam(): AudioParamStub {
  return {
    cancelScheduledValues: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    setValueAtTime: vi.fn(),
    value: 0,
  };
}

function createConnectable<T extends object>(properties: T) {
  return Object.assign(properties, { connect: vi.fn().mockReturnThis() });
}

describe('InkRouteAudio', () => {
  let audioContextCreations = 0;
  const resume = vi.fn().mockResolvedValue(undefined);
  const suspend = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  const scratchSource = createConnectable({ loop: false, start: vi.fn(), stop: vi.fn(), buffer: null });
  const master = createConnectable({ gain: createAudioParam() });
  const scratchGain = createConnectable({ gain: createAudioParam() });
  const highpass = createConnectable({ type: 'lowpass', frequency: createAudioParam() });
  const lowpass = createConnectable({ type: 'lowpass', frequency: createAudioParam() });
  const context = {
    close,
    createBiquadFilter: vi.fn()
      .mockReturnValueOnce(highpass)
      .mockReturnValueOnce(lowpass),
    createBuffer: vi.fn().mockReturnValue({ getChannelData: () => new Float32Array(2) }),
    createBufferSource: vi.fn().mockReturnValue(scratchSource),
    createGain: vi.fn()
      .mockReturnValueOnce(master)
      .mockReturnValueOnce(scratchGain),
    currentTime: 0,
    destination: {},
    resume,
    sampleRate: 2,
    state: 'suspended' as AudioContextState,
    suspend,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    audioContextCreations = 0;
    context.state = 'suspended';
    context.createBiquadFilter
      .mockReset()
      .mockReturnValueOnce(highpass)
      .mockReturnValueOnce(lowpass);
    context.createGain
      .mockReset()
      .mockReturnValueOnce(master)
      .mockReturnValueOnce(scratchGain);
    class AudioContextStub {
      constructor() {
        audioContextCreations += 1;
        return context;
      }
    }
    vi.stubGlobal('AudioContext', AudioContextStub);
  });

  it('unlocks once and can resume the same prepared graph after foreground return', async () => {
    const audio = new InkRouteAudio();

    await audio.unlock();
    await audio.resume();

    expect(audioContextCreations).toBe(1);
    expect(resume).toHaveBeenCalledTimes(2);
    expect(scratchSource.start).toHaveBeenCalledOnce();
  });

  it('silences scratch before suspending and disposes its owned graph', async () => {
    const audio = new InkRouteAudio();
    audio.prepare();
    context.state = 'running';

    await audio.suspend();
    audio.dispose();

    expect(scratchGain.gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, 0.04);
    expect(suspend).toHaveBeenCalledOnce();
    expect(scratchSource.stop).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});
