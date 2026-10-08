export type InkMapCue = 'drip' | 'blob' | 'card' | 'checkpoint' | 'complete' | 'tick';

export interface InkMapSound {
  cue(name: InkMapCue): void;
  /** Pen speed from 0 (resting) to 1 (full stroke). */
  setPen(level: number): void;
  /** False while the visitor is away from the map; everything must fall silent. */
  setActive(active: boolean): void;
}

const CUE_FILES: Record<InkMapCue, string> = {
  drip: 'ink-drip',
  blob: 'ink-blob',
  card: 'paper-rustle',
  checkpoint: 'checkpoint-arrive',
  complete: 'route-complete',
  tick: 'ui-tick',
};
const CUE_GAIN: Record<InkMapCue, number> = { drip: 0.7, blob: 0.85, card: 0.5, checkpoint: 0.8, complete: 0.85, tick: 0.5 };
const BEDS = [
  { file: 'harbour-ambience', gain: 0.5 },
  { file: 'shanty-loop', gain: 0.2 },
];
const PEN_FILE = 'pen-draw-loop';
const PEN_GAIN = 0.5;
const MASTER_GAIN = 0.8;
const FADE_SECONDS = 0.25;

const ALL_FILES = [...new Set([...Object.values(CUE_FILES), ...BEDS.map(bed => bed.file), PEN_FILE])];

const soundUrl = (file: string) => `/sfx/${file}.mp3`;

/**
 * Sound for the ink map. It stays silent until `setEnabled(true)` runs inside a
 * user gesture, and `setActive(false)` silences everything while the visitor is
 * away from the map.
 */
export class InkMapAudio implements InkMapSound {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private penGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private bytes = new Map<string, Promise<ArrayBuffer | null>>();
  private loops: AudioBufferSourceNode[] = [];
  private shots = new Set<AudioBufferSourceNode>();
  private enabled = false;
  private active = true;
  private suspendTimer: number | undefined;

  static isSupported() {
    return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) void this.start();
    this.applyAudibility();
  }

  /**
   * Fetches the sound files ahead of the gesture. It never creates an
   * `AudioContext`, which browsers warn about before the visitor interacts.
   */
  preload() {
    if (!InkMapAudio.isSupported()) return;
    ALL_FILES.forEach(file => void this.fetchBytes(file));
  }

  setActive(active: boolean) {
    this.active = active;
    this.applyAudibility();
  }

  cue(name: InkMapCue) {
    const buffer = this.buffers.get(CUE_FILES[name]);
    if (!this.isAudible() || !this.context || !this.master || !buffer) return;

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = CUE_GAIN[name];
    source.connect(gain).connect(this.master);
    source.onended = () => {
      this.shots.delete(source);
      gain.disconnect();
    };
    this.shots.add(source);
    source.start();
  }

  setPen(level: number) {
    if (!this.context || !this.penGain) return;
    const target = this.isAudible() ? Math.min(Math.max(level, 0), 1) * PEN_GAIN : 0;
    this.penGain.gain.setTargetAtTime(target, this.context.currentTime, target > 0 ? 0.06 : 0.09);
  }

  dispose() {
    window.clearTimeout(this.suspendTimer);
    this.enabled = false;
    this.stopShots();
    this.loops.forEach(loop => loop.stop());
    this.loops = [];
    this.buffers.clear();
    this.bytes.clear();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.penGain = null;
  }

  private isAudible() {
    return this.enabled && this.active;
  }

  private async start() {
    if (this.context || !InkMapAudio.isSupported()) return;

    const context = new window.AudioContext();
    const master = context.createGain();
    const penGain = context.createGain();
    master.gain.value = 0;
    penGain.gain.value = 0;
    master.connect(context.destination);
    penGain.connect(master);
    this.context = context;
    this.master = master;
    this.penGain = penGain;
    this.applyAudibility();

    await Promise.all(ALL_FILES.map(async file => {
      try {
        const bytes = await this.fetchBytes(file);
        this.bytes.delete(file);
        if (!bytes) return;
        const buffer = await context.decodeAudioData(bytes);
        if (this.context === context) this.buffers.set(file, buffer);
      } catch {
        // A missing sound leaves that cue silent; the journey itself is unaffected.
      }
    }));

    if (this.context !== context) return;
    BEDS.forEach(bed => this.startLoop(bed.file, bed.gain, master));
    this.startLoop(PEN_FILE, 1, penGain);
  }

  private fetchBytes(file: string) {
    const known = this.bytes.get(file);
    if (known) return known;

    const pending = (async () => {
      try {
        const response = await fetch(soundUrl(file));
        return response.ok ? await response.arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
    this.bytes.set(file, pending);
    return pending;
  }

  private startLoop(file: string, level: number, destination: AudioNode) {
    const buffer = this.buffers.get(file);
    if (!this.context || !buffer) return;

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = level;
    source.connect(gain).connect(destination);
    source.start();
    this.loops.push(source);
  }

  private stopShots() {
    this.shots.forEach(shot => {
      shot.onended = null;
      shot.stop();
      shot.disconnect();
    });
    this.shots.clear();
  }

  private applyAudibility() {
    const context = this.context;
    if (!context || !this.master) return;

    window.clearTimeout(this.suspendTimer);
    const audible = this.isAudible();
    const now = context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(audible ? MASTER_GAIN : 0, now, FADE_SECONDS / 4);

    if (audible) {
      void context.resume();
      return;
    }

    this.penGain?.gain.setTargetAtTime(0, now, 0.03);
    // Suspending after the fade guarantees silence and releases the audio device.
    this.suspendTimer = window.setTimeout(() => {
      this.stopShots();
      if (!this.isAudible() && this.context === context) void context.suspend();
    }, FADE_SECONDS * 1000);
  }
}
