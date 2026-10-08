export const SAMPLE_RATE = 44100;

export function createRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createBuffer(seconds, channels = 2) {
  const length = Math.round(seconds * SAMPLE_RATE);
  return Array.from({ length: channels }, () => new Float32Array(length));
}

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;
export const dbToGain = (db) => 10 ** (db / 20);

export function whiteNoise(random, length) {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) out[i] = random() * 2 - 1;
  return out;
}

export function pinkNoise(random, length) {
  const out = new Float32Array(length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < length; i += 1) {
    const white = random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }

  return out;
}

export function brownNoise(random, length) {
  const out = new Float32Array(length);
  let last = 0;

  for (let i = 0; i < length; i += 1) {
    last = (last + (random() * 2 - 1) * 0.02) / 1.0004;
    out[i] = last * 3.2;
  }

  return out;
}

/**
 * RBJ biquad with optional per-sample modulation. `freq` and `q` may be numbers
 * or functions of the sample index so sweeps and resonant glides stay cheap.
 */
export function biquad(input, type, freq, q = 0.707) {
  const out = new Float32Array(input.length);
  const freqAt = typeof freq === 'function' ? freq : () => freq;
  const qAt = typeof q === 'function' ? q : () => q;
  const refreshEvery = 16;
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let a1 = 0;
  let a2 = 0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;

  for (let i = 0; i < input.length; i += 1) {
    if (i % refreshEvery === 0) {
      const f = clamp(freqAt(i), 20, SAMPLE_RATE * 0.45);
      const w0 = (2 * Math.PI * f) / SAMPLE_RATE;
      const cos = Math.cos(w0);
      const alpha = Math.sin(w0) / (2 * Math.max(qAt(i), 0.05));
      let nb0;
      let nb1;
      let nb2;

      if (type === 'lowpass') {
        nb0 = (1 - cos) / 2;
        nb1 = 1 - cos;
        nb2 = (1 - cos) / 2;
      } else if (type === 'highpass') {
        nb0 = (1 + cos) / 2;
        nb1 = -(1 + cos);
        nb2 = (1 + cos) / 2;
      } else {
        // Constant 0 dB peak gain band-pass.
        nb0 = alpha;
        nb1 = 0;
        nb2 = -alpha;
      }

      const a0 = 1 + alpha;
      b0 = nb0 / a0;
      b1 = nb1 / a0;
      b2 = nb2 / a0;
      a1 = (-2 * cos) / a0;
      a2 = (1 - alpha) / a0;
    }

    const x0 = input[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    out[i] = y0;
  }

  return out;
}

export const lowpass = (input, freq, q) => biquad(input, 'lowpass', freq, q);
export const highpass = (input, freq, q) => biquad(input, 'highpass', freq, q);
export const bandpass = (input, freq, q) => biquad(input, 'bandpass', freq, q);

/** Exponential-decay envelope value for an event that started at `start`. */
export function decay(time, start, seconds) {
  if (time < start) return 0;
  return Math.exp(-(time - start) / seconds);
}

/** Smooth attack, exponential release; peak is 1. */
export function pluckEnvelope(time, attack, release) {
  if (time < 0) return 0;
  const rise = attack > 0 ? Math.min(time / attack, 1) : 1;
  return rise * rise * (3 - 2 * rise) * Math.exp(-time / release);
}

/** Adds `source` into `target` at `offsetSeconds`, optionally wrapping circularly. */
export function mixInto(target, source, offsetSeconds, gain = 1, wrap = false) {
  const offset = Math.round(offsetSeconds * SAMPLE_RATE);

  for (let i = 0; i < source.length; i += 1) {
    let index = offset + i;
    if (wrap) index = ((index % target.length) + target.length) % target.length;
    else if (index < 0 || index >= target.length) continue;
    target[index] += source[i] * gain;
  }
}

/**
 * Modal strike: a bank of damped sines. `modes` is [ratio, gain, decaySeconds].
 */
export function modalStrike(base, modes, seconds, { attack = 0.0008, brightness = 1 } = {}) {
  const length = Math.round(seconds * SAMPLE_RATE);
  const out = new Float32Array(length);

  modes.forEach(([ratio, gain, decaySeconds], modeIndex) => {
    const frequency = base * ratio;
    const phase = modeIndex * 1.7;
    const modeGain = gain * (modeIndex === 0 ? 1 : brightness);

    for (let i = 0; i < length; i += 1) {
      const t = i / SAMPLE_RATE;
      const rise = Math.min(t / attack, 1);
      out[i] += modeGain * rise * Math.exp(-t / decaySeconds) * Math.sin(2 * Math.PI * frequency * t + phase);
    }
  });

  return out;
}

function fft(re, im, inverse) {
  const n = re.length;

  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  for (let size = 2; size <= n; size <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / size;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);

    for (let start = 0; start < n; start += size) {
      let cr = 1;
      let ci = 0;

      for (let k = 0; k < size / 2; k += 1) {
        const a = start + k;
        const b = a + size / 2;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i += 1) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

/** Linear convolution via FFT. */
export function convolve(signal, impulse) {
  const outLength = signal.length + impulse.length - 1;
  let size = 1;
  while (size < outLength) size <<= 1;

  const ar = new Float64Array(size);
  const ai = new Float64Array(size);
  const br = new Float64Array(size);
  const bi = new Float64Array(size);
  ar.set(signal);
  br.set(impulse);
  fft(ar, ai, false);
  fft(br, bi, false);

  for (let i = 0; i < size; i += 1) {
    const re = ar[i] * br[i] - ai[i] * bi[i];
    ai[i] = ar[i] * bi[i] + ai[i] * br[i];
    ar[i] = re;
  }

  fft(ar, ai, true);
  return Float32Array.from(ar.subarray(0, outLength));
}

/**
 * Synthetic small-room impulse response: a dense, darkening noise tail with a
 * few early reflections, tuned for a wood-panelled cabin rather than a hall.
 */
export function roomImpulse(random, { seconds = 0.55, decaySeconds = 0.16, brightness = 3200, earlyTaps = 5 } = {}) {
  const length = Math.round(seconds * SAMPLE_RATE);
  const tail = whiteNoise(random, length);

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    tail[i] *= Math.exp(-t / decaySeconds) * Math.min(t / 0.004, 1);
  }

  const darkened = lowpass(tail, (i) => lerp(brightness, 700, clamp(i / length, 0, 1)), 0.6);

  for (let tap = 0; tap < earlyTaps; tap += 1) {
    const index = Math.round((0.006 + random() * 0.03) * SAMPLE_RATE);
    darkened[index] += (random() > 0.5 ? 1 : -1) * (0.5 - tap * 0.07);
  }

  return darkened;
}

/**
 * Wet/dry room reverb on a stereo buffer. With `wrap`, the tail folds back onto
 * the start so a loop stays seamless.
 */
export function applyRoom(channels, random, { wet = 0.25, wrap = false, ...room } = {}) {
  return channels.map((channel) => {
    const impulse = roomImpulse(random, room);
    const full = convolve(channel, impulse);
    const out = new Float32Array(channel.length);

    for (let i = 0; i < channel.length; i += 1) out[i] = channel[i];

    for (let i = 0; i < full.length; i += 1) {
      const index = wrap ? i % channel.length : i;
      if (index >= out.length) break;
      out[index] += full[i] * wet;
    }

    return out;
  });
}

/** Equal-power crossfade so the last `fadeSeconds` blend into the start. */
export function makeLoop(source, loopSeconds, fadeSeconds) {
  const loopLength = Math.round(loopSeconds * SAMPLE_RATE);
  const fadeLength = Math.round(fadeSeconds * SAMPLE_RATE);
  const out = new Float32Array(loopLength);

  for (let i = 0; i < loopLength; i += 1) out[i] = source[i];

  for (let i = 0; i < fadeLength; i += 1) {
    const t = i / fadeLength;
    out[i] = source[i] * Math.sin((t * Math.PI) / 2) + source[loopLength + i] * Math.cos((t * Math.PI) / 2);
  }

  return out;
}

export function pan(mono, position) {
  const angle = ((clamp(position, -1, 1) + 1) * Math.PI) / 4;
  return [mono.map((v) => v * Math.cos(angle)), mono.map((v) => v * Math.sin(angle))];
}

export function peak(channels) {
  let max = 0;
  for (const channel of channels) for (let i = 0; i < channel.length; i += 1) max = Math.max(max, Math.abs(channel[i]));
  return max;
}

export function normalize(channels, targetPeakDb) {
  const current = peak(channels);
  if (current === 0) return channels;
  const gain = dbToGain(targetPeakDb) / current;
  return channels.map((channel) => channel.map((v) => v * gain));
}

export function fadeEdges(channels, inSeconds, outSeconds) {
  const inLength = Math.round(inSeconds * SAMPLE_RATE);
  const outLength = Math.round(outSeconds * SAMPLE_RATE);

  for (const channel of channels) {
    for (let i = 0; i < inLength; i += 1) channel[i] *= i / inLength;
    for (let i = 0; i < outLength; i += 1) channel[channel.length - 1 - i] *= i / outLength;
  }

  return channels;
}

/** Removes sub-audible drift so loops and tails do not thump on playback. */
export function removeDc(channels) {
  return channels.map((channel) => highpass(channel, 24, 0.6));
}

/** DC removal for loops: filters three repeats and keeps the middle one so the seam has no start-up transient. */
export function removeDcLoop(channels) {
  return channels.map((channel) => {
    const length = channel.length;
    const tripled = new Float32Array(length * 3);
    for (let i = 0; i < 3; i += 1) tripled.set(channel, i * length);
    return highpass(tripled, 24, 0.6).slice(length, length * 2);
  });
}

export function toWav(channels) {
  const frames = channels[0].length;
  const dataBytes = frames * channels.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels.length, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * channels.length * 2, 28);
  buffer.writeUInt16LE(channels.length * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);

  let offset = 44;
  for (let i = 0; i < frames; i += 1) {
    for (const channel of channels) {
      buffer.writeInt16LE(Math.round(clamp(channel[i], -1, 1) * 32767), offset);
      offset += 2;
    }
  }

  return buffer;
}
