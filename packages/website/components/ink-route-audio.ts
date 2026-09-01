const SCRATCH_BUFFER_SECONDS = 1.4;

function createNoiseBuffer(context: AudioContext, seconds: number) {
  const frameCount = Math.ceil(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  let previous = 0;
  for (let index = 0; index < frameCount; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.82 + white * 0.18;
    channel[index] = previous;
  }

  return buffer;
}

export class InkRouteAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private scratchGain: GainNode | null = null;
  private scratchSource: AudioBufferSourceNode | null = null;
  private muted = false;

  prepare() {
    if (!this.context) {
      const AudioContextOwner = window.AudioContext;
      this.context = new AudioContextOwner();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.72;
      this.master.connect(this.context.destination);
      this.startScratchTexture();
    }
  }

  async unlock() {
    this.prepare();
    const context = this.context;

    if (context?.state === 'suspended') {
      await context.resume();
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.context || !this.master) {
      return;
    }

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : 0.72, now, 0.025);
  }

  playImpact() {
    if (!this.context || !this.master || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const body = this.context.createOscillator();
    const bodyGain = this.context.createGain();

    source.buffer = createNoiseBuffer(this.context, 0.24);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1850, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.44, now + 0.009);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    body.type = 'sine';
    body.frequency.setValueAtTime(118, now);
    body.frequency.exponentialRampToValueAtTime(54, now + 0.18);
    bodyGain.gain.setValueAtTime(0.18, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    source.connect(filter).connect(gain).connect(this.master);
    body.connect(bodyGain).connect(this.master);
    source.start(now);
    body.start(now);
    source.stop(now + 0.26);
    body.stop(now + 0.22);
  }

  playCheckpoint() {
    if (!this.context || !this.master || this.muted) {
      return;
    }

    const now = this.context.currentTime;
    const source = this.context.createOscillator();
    const gain = this.context.createGain();
    source.type = 'triangle';
    source.frequency.setValueAtTime(430, now);
    source.frequency.exponentialRampToValueAtTime(265, now + 0.11);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    source.connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + 0.15);
  }

  setScratchVelocity(velocity: number) {
    if (!this.context || !this.scratchGain) {
      return;
    }

    const now = this.context.currentTime;
    const gain = this.muted ? 0 : Math.min(Math.max(velocity * 0.034, 0), 0.15);
    this.scratchGain.gain.cancelScheduledValues(now);
    this.scratchGain.gain.setTargetAtTime(gain, now, gain > 0 ? 0.018 : 0.04);
  }

  async suspend() {
    this.setScratchVelocity(0);
    if (this.context?.state === 'running') {
      await this.context.suspend();
    }
  }

  dispose() {
    this.scratchSource?.stop();
    this.scratchSource = null;
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.scratchGain = null;
  }

  private startScratchTexture() {
    if (!this.context || !this.master) {
      return;
    }

    const source = this.context.createBufferSource();
    const highpass = this.context.createBiquadFilter();
    const lowpass = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = createNoiseBuffer(this.context, SCRATCH_BUFFER_SECONDS);
    source.loop = true;
    highpass.type = 'highpass';
    highpass.frequency.value = 780;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3600;
    gain.gain.value = 0;

    source.connect(highpass).connect(lowpass).connect(gain).connect(this.master);
    source.start();
    this.scratchSource = source;
    this.scratchGain = gain;
  }
}
