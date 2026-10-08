import {
  SAMPLE_RATE,
  applyRoom,
  bandpass,
  brownNoise,
  clamp,
  createBuffer,
  createRandom,
  fadeEdges,
  highpass,
  lerp,
  lowpass,
  makeLoop,
  mixInto,
  modalStrike,
  normalize,
  pan,
  pinkNoise,
  pluckEnvelope,
  removeDc,
  removeDcLoop,
  whiteNoise,
} from './dsp.mjs';

const TAU = Math.PI * 2;
const smoothstep = (t) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Sine with an exponential frequency sweep and exponential amplitude decay. */
function chirp(seconds, from, to, decaySeconds, gain = 1) {
  const length = Math.round(seconds * SAMPLE_RATE);
  const out = new Float32Array(length);
  let phase = 0;

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const frequency = from * (to / from) ** (t / seconds);
    phase += (TAU * frequency) / SAMPLE_RATE;
    out[i] = Math.sin(phase) * Math.exp(-t / decaySeconds) * Math.min(t / 0.0008, 1) * gain;
  }

  return out;
}

/** Short filtered noise burst with an exponential tail. */
function noiseBurst(random, seconds, decaySeconds, low, high, gain = 1) {
  const length = Math.round(seconds * SAMPLE_RATE);
  const noise = whiteNoise(random, length);
  const shaped = lowpass(highpass(noise, low, 0.7), high, 0.7);

  for (let i = 0; i < length; i += 1) shaped[i] *= Math.exp(-i / SAMPLE_RATE / decaySeconds) * gain;

  return shaped;
}

function mono(buffer) {
  return [buffer, Float32Array.from(buffer)];
}

/**
 * Water-drop bubble: a damped sine whose pitch rises as the air cavity closes.
 * This is what makes a drop read as "bloop" rather than as a click or a thud.
 */
function bubble(random, frequency, rise, decaySeconds) {
  const seconds = decaySeconds * 7;
  const length = Math.round(seconds * SAMPLE_RATE);
  const out = new Float32Array(length);
  const tuned = frequency * (1 + (random() - 0.5) * 0.06);
  let phase = 0;

  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    phase += (TAU * tuned * (1 + (rise * t) / (decaySeconds * 4))) / SAMPLE_RATE;
    out[i] = Math.sin(phase) * Math.exp(-t / decaySeconds) * smoothstep(t / 0.003);
  }

  return out;
}

function stereoMixer(seconds) {
  const left = createBuffer(seconds, 1)[0];
  const right = createBuffer(seconds, 1)[0];
  const add = (source, offset, gain, position = 0) => {
    const [l, r] = pan(source, position);
    mixInto(left, l, offset, gain);
    mixInto(right, r, offset, gain);
  };

  return { left, right, add };
}

/** The bead of ink letting go of the nib. The fall itself is silent. */
export function inkDrip() {
  const random = createRandom(101);
  const buffer = createBuffer(0.3, 1)[0];
  mixInto(buffer, bubble(random, 1500, 0.3, 0.012), 0, 0.5);
  mixInto(buffer, bubble(random, 2300, 0.4, 0.008), 0.022, 0.2);
  return normalize(fadeEdges(removeDc(mono(buffer)), 0, 0.05), -16);
}

/**
 * A drop of thin ink landing: one short liquid "plip" whose pitch slides up,
 * with a faint smaller bubble behind it. No low body and no tail.
 */
export function inkBlob() {
  const random = createRandom(202);
  const { left, right, add } = stereoMixer(0.6);

  add(noiseBurst(random, 0.006, 0.0012, 1500, 9000, 1), 0, 0.12);
  add(bubble(random, 640, 3.2, 0.011), 0.001, 1);
  add(bubble(random, 980, 2.4, 0.007), 0.012, 0.25, 0.1);
  add(bubble(random, 760, 2.6, 0.008), 0.2, 0.14, -0.2);
  add(bubble(random, 1250, 2.2, 0.006), 0.27, 0.06, 0.25);

  const room = applyRoom([left, right], random, { wet: 0.06, seconds: 0.25, decaySeconds: 0.06, brightness: 3500 });
  return normalize(fadeEdges(removeDc(room), 0, 0.1), -5);
}

/**
 * Seamless quill-on-parchment texture: soft, dark paper friction shaped into
 * unhurried strokes, with no hard clicks. Drive `gain` from pen velocity and
 * leave `playbackRate` alone; pitch-shifting noise reads as a machine.
 */
export function penDrawLoop() {
  const random = createRandom(303);
  const loopSeconds = 4.8;
  const fadeSeconds = 0.5;
  const length = Math.round((loopSeconds + fadeSeconds) * SAMPLE_RATE);
  const strokes = [0.9, 0.6, 1.0, 0.7, 0.9, 0.7];
  const strokeAt = (time) => {
    let local = time % loopSeconds;
    for (const stroke of strokes) {
      if (local < stroke) return 0.45 + 0.55 * Math.sin((Math.PI * local) / stroke) ** 0.6;
      local -= stroke;
    }
    return 0.45;
  };

  const tooth = lowpass(highpass(pinkNoise(random, length), 700, 0.7), 4200, 0.7);
  const voice = bandpass(tooth, 1500, 2.5);
  const feather = bandpass(whiteNoise(random, length), 2400, 0.9);
  const body = lowpass(brownNoise(random, length), 300, 0.7);
  const flutter = lowpass(whiteNoise(random, length), 14, 0.7);
  const flutterPeak = flutter.reduce((max, v) => Math.max(max, Math.abs(v)), 0.0001);
  const out = new Float32Array(length);

  for (let i = 0; i < length; i += 1) {
    const stroke = strokeAt(i / SAMPLE_RATE);
    const grain = 0.6 + 0.4 * Math.abs(flutter[i] / flutterPeak);
    out[i] = (tooth[i] * 0.8 + voice[i] * 0.4 + feather[i] * 0.06) * grain * stroke + body[i] * 0.3 * stroke;
  }

  return normalize(removeDcLoop(mono(makeLoop(out, loopSeconds, fadeSeconds))), -8);
}

const midiToHz = (note) => 440 * 2 ** ((note - 69) / 12);

/**
 * Karplus-Strong plucked string: a noise burst circulating in a damped delay
 * line. It behaves like a real string, so it avoids the glassy ring of sines.
 */
function pluck(random, note, seconds, { brightness = 0.5, damping = 0.996 } = {}) {
  const period = Math.round(SAMPLE_RATE / midiToHz(note));
  const length = Math.round(seconds * SAMPLE_RATE);
  const line = new Float32Array(period);
  const out = new Float32Array(length);
  let previous = 0;

  for (let i = 0; i < period; i += 1) {
    previous = lerp(previous, random() * 2 - 1, brightness);
    line[i] = previous;
  }

  for (let i = 0; i < length; i += 1) {
    const index = i % period;
    const next = line[(index + 1) % period];
    out[i] = line[index];
    line[index] = (line[index] + next) * 0.5 * damping;
  }

  const tail = Math.round(0.08 * SAMPLE_RATE);
  for (let i = 0; i < tail; i += 1) out[length - 1 - i] *= i / tail;

  return out;
}

/** A handful of light liquid plips, like a pebble skipping into shallow water. */
function plips(random, add, start, count, spreadSeconds, gain) {
  for (let i = 0; i < count; i += 1) {
    const f = i / count;
    add(bubble(random, 550 + random() * 900, 2.6, 0.006 + random() * 0.006), start + f ** 1.3 * spreadSeconds + random() * 0.02, gain * (1 - f * 0.7), random() * 1.4 - 0.7);
  }
}

/**
 * Dropping anchor in a sunny cove: a small splash and two warm plucked notes
 * stepping up. Deliberately light; no chain, no thud.
 */
export function checkpointArrive() {
  const random = createRandom(404);
  const { left, right, add } = stereoMixer(1.9);

  add(bubble(random, 520, 2.8, 0.014), 0, 0.5);
  plips(random, add, 0.03, 7, 0.4, 0.3);

  const washLength = Math.round(1.1 * SAMPLE_RATE);
  for (const target of [left, right]) {
    const wash = bandpass(pinkNoise(random, washLength), 1700, 0.6);
    for (let i = 0; i < washLength; i += 1) wash[i] *= pluckEnvelope(i / SAMPLE_RATE, 0.12, 0.28) * 0.5;
    mixInto(target, wash, 0.02);
  }

  add(pluck(random, 69, 1.2), 0.06, 0.55, -0.15);
  add(pluck(random, 74, 1.5), 0.2, 0.6, 0.15);

  const room = applyRoom([left, right], random, { wet: 0.16, seconds: 0.5, decaySeconds: 0.16, brightness: 3200 });
  return normalize(fadeEdges(removeDc(room), 0, 0.4), -7);
}

/** End of the route: a rising plucked flourish that lands on a bright chord. */
export function routeComplete() {
  const random = createRandom(505);
  const { left, right, add } = stereoMixer(3.6);

  [62, 66, 69, 74, 78].forEach((note, index) => {
    add(pluck(random, note, 1.6), index * 0.085, 0.45, -0.4 + index * 0.2);
  });

  [50, 62, 66, 69, 74, 81].forEach((note, index) => {
    add(pluck(random, note, 2.8, { damping: 0.997 }), 0.56 + index * 0.014, 0.5, -0.5 + index * 0.2);
  });

  plips(random, add, 0.58, 6, 0.5, 0.14);

  const room = applyRoom([left, right], random, { wet: 0.2, seconds: 0.7, decaySeconds: 0.22, brightness: 3200 });
  return normalize(fadeEdges(removeDc(room), 0, 0.6), -6);
}

/** A page turning: a swell of fibre crackle with no single dominant click. */
export function paperRustle() {
  const random = createRandom(606);
  const seconds = 0.75;
  const length = Math.round(seconds * SAMPLE_RATE);
  const buildChannel = () => {
    const sparks = new Float32Array(length);

    for (let time = 0; time < seconds; ) {
      const bell = Math.sin(Math.PI * clamp(time / seconds, 0, 1)) ** 1.4;
      time += -Math.log(1 - random()) / (14 + 120 * bell);
      const index = Math.round(time * SAMPLE_RATE);
      if (index >= length - 24) break;
      const amplitude = (0.15 + random() ** 2) * (random() > 0.5 ? 1 : -1);
      for (let k = 0; k < 24; k += 1) sparks[index + k] += amplitude * Math.exp(-k / 3.5);
    }

    const crackle = lowpass(bandpass(sparks, 3600, 0.5), 8500, 0.7);
    const swell = bandpass(whiteNoise(random, length), 2300, 0.6);
    for (let i = 0; i < length; i += 1) swell[i] *= Math.sin((Math.PI * i) / length) ** 2 * 0.1;
    return crackle.map((v, i) => v + swell[i]);
  };

  return normalize(fadeEdges(removeDc([buildChannel(), buildChannel()]), 0.012, 0.12), -9);
}

/** Small wood-and-brass tick for buttons and checkpoint dots. */
export function uiTick() {
  const random = createRandom(707);
  const buffer = createBuffer(0.2, 1)[0];
  mixInto(buffer, modalStrike(1450, [[1, 1, 0.014], [2.4, 0.4, 0.009], [3.7, 0.2, 0.006]], 0.18), 0, 0.5);
  mixInto(buffer, chirp(0.05, 230, 120, 0.011, 1), 0, 0.35);
  mixInto(buffer, noiseBurst(random, 0.01, 0.002, 2200, 7000, 1), 0, 0.2);
  return normalize(fadeEdges(removeDc(mono(buffer)), 0, 0.03), -10);
}

/**
 * Sunny shoreline bed: small bright waves lapping with foam and stray plips,
 * under a light breeze. No rumble and no groaning timber. Beds crossfade at the
 * seam; events wrap.
 */
export function harbourAmbience() {
  const random = createRandom(808);
  const loopSeconds = 40;
  const fadeSeconds = 3;
  const bedLength = Math.round((loopSeconds + fadeSeconds) * SAMPLE_RATE);
  const loopLength = Math.round(loopSeconds * SAMPLE_RATE);
  const waveSizes = Array.from({ length: 10 }, () => 0.45 + random() * 0.55);
  const crest = (f) => smoothstep(f / 0.22) * (1 - smoothstep((f - 0.22) / 0.78)) ** 1.6;
  const waveAt = (seconds, phase) => {
    const position = ((((seconds * 10) / loopSeconds + phase) % 10) + 10) % 10;
    const minor = (((seconds * 7) / loopSeconds + phase * 1.7) % 1 + 1) % 1;
    return clamp(crest(position % 1) * waveSizes[Math.floor(position)] * 0.85 + crest(minor) * 0.3, 0, 1);
  };

  const buildBed = (channelIndex) => {
    const phase = channelIndex * 0.08;
    const envelope = new Float32Array(bedLength);
    for (let i = 0; i < bedLength; i += 1) envelope[i] = waveAt(i / SAMPLE_RATE, phase);

    const water = bandpass(pinkNoise(random, bedLength), (i) => 650 + 900 * envelope[i], 0.5);
    const foam = highpass(whiteNoise(random, bedLength), 2600, 0.7);
    const breeze = bandpass(pinkNoise(random, bedLength), (i) => 900 + 300 * Math.sin((TAU * 3 * i) / SAMPLE_RATE / loopSeconds + channelIndex), 0.4);
    const out = new Float32Array(bedLength);

    for (let i = 0; i < bedLength; i += 1) {
      out[i] = water[i] * (0.12 + 0.88 * envelope[i]) + foam[i] * envelope[i] ** 2 * 0.07 + breeze[i] * 0.1;
    }

    return makeLoop(highpass(out, 160, 0.7), loopSeconds, fadeSeconds);
  };

  const bed = [buildBed(0), buildBed(1)];
  const events = [new Float32Array(loopLength), new Float32Array(loopLength)];

  for (let time = 0; time < loopSeconds; ) {
    time += -Math.log(1 - random()) / (0.4 + 5 * waveAt(time - 0.6, 0));
    const [l, r] = pan(bubble(random, 600 + random() * 1500, 2.4, 0.005 + random() * 0.007), random() * 1.8 - 0.9);
    const gain = 0.02 + random() * 0.035;
    mixInto(events[0], l, time, gain, true);
    mixInto(events[1], r, time, gain, true);
  }

  const mixed = bed.map((channel, index) => channel.map((v, i) => v + events[index][i]));
  return normalize(removeDcLoop(mixed), -20);
}

/**
 * Original 16-bar jig in D on plucked strings, as an optional music bed. The
 * melody is written here, not transcribed from any existing tune.
 */
export function shantyLoop() {
  const random = createRandom(909);
  const eighth = 0.17;
  const loopSeconds = eighth * 96;
  const loopLength = Math.round(loopSeconds * SAMPLE_RATE);
  const channels = [new Float32Array(loopLength), new Float32Array(loopLength)];
  const play = (note, step, seconds, gain, position, options) => {
    const [l, r] = pan(pluck(random, note, seconds, options), position);
    const time = step * eighth + (random() - 0.5) * 0.012;
    mixInto(channels[0], l, time, gain, true);
    mixInto(channels[1], r, time, gain, true);
  };

  // [midi note, length in eighths]; six eighths per bar.
  const melody = [
    [74, 1], [78, 1], [81, 1], [78, 1], [74, 1], [78, 1],
    [76, 1], [73, 1], [69, 1], [73, 1], [76, 1], [73, 1],
    [74, 1], [78, 1], [81, 1], [83, 1], [81, 1], [78, 1],
    [76, 2], [73, 1], [69, 3],
    [79, 1], [83, 1], [79, 1], [78, 1], [81, 1], [78, 1],
    [76, 1], [73, 1], [69, 1], [71, 1], [73, 1], [76, 1],
    [78, 1], [74, 1], [78, 1], [76, 1], [73, 1], [76, 1],
    [74, 2], [69, 1], [74, 3],
    [81, 1], [78, 1], [81, 1], [83, 1], [81, 1], [78, 1],
    [79, 1], [76, 1], [79, 1], [81, 1], [79, 1], [76, 1],
    [78, 1], [74, 1], [78, 1], [79, 1], [78, 1], [74, 1],
    [76, 2], [73, 1], [69, 3],
    [71, 1], [74, 1], [79, 1], [71, 1], [74, 1], [79, 1],
    [69, 1], [74, 1], [78, 1], [69, 1], [74, 1], [78, 1],
    [76, 1], [73, 1], [69, 1], [73, 1], [76, 1], [79, 1],
    [78, 2], [76, 1], [74, 3],
  ];
  const chords = { D: [50, 62, 66, 69], A: [45, 61, 64, 69], G: [43, 62, 67, 71] };
  const bars = ['D', 'A', 'D', 'A', 'G', 'A', 'D', 'D', 'D', 'G', 'D', 'A', 'G', 'D', 'A', 'D'];

  let step = 0;
  for (const [note, eighths] of melody) {
    const onBeat = step % 3 === 0;
    play(note, step, 0.35 + eighths * 0.22, (onBeat ? 0.5 : 0.36) + random() * 0.06, 0.15, { brightness: 0.6 });
    step += eighths;
  }

  bars.forEach((name, bar) => {
    const [root, ...triad] = chords[name];
    play(root + 12, bar * 6, 1.1, 0.3, -0.25, { brightness: 0.35 });
    triad.forEach((note, index) => play(note, bar * 6 + 3 + index * 0.07, 0.8, 0.2, -0.35 + index * 0.1, { brightness: 0.45 }));
  });

  const room = applyRoom(channels, random, { wet: 0.18, wrap: true, seconds: 0.7, decaySeconds: 0.22, brightness: 3200 });
  return normalize(removeDcLoop(room), -9);
}

export const SOUNDS = [
  { name: 'ink-drip', build: inkDrip, role: 'The bead of ink letting go of the nib. The fall itself is silent.', loop: false },
  { name: 'ink-blob', build: inkBlob, role: 'A drop of thin ink landing: one short liquid plip.', loop: false },
  { name: 'pen-draw-loop', build: penDrawLoop, role: 'Quill on parchment while the route is drawn. Drive gain from pen velocity.', loop: true },
  { name: 'checkpoint-arrive', build: checkpointArrive, role: 'Dropping anchor in a sunny cove: a small splash and two plucked notes.', loop: false },
  { name: 'route-complete', build: routeComplete, role: 'A rising plucked flourish landing on a bright chord.', loop: false },
  { name: 'paper-rustle', build: paperRustle, role: 'A checkpoint card turning in.', loop: false },
  { name: 'ui-tick', build: uiTick, role: 'Small tick for buttons.', loop: false },
  { name: 'harbour-ambience', build: harbourAmbience, role: 'Sunny shoreline bed: small waves, foam and a light breeze. Seamless loop.', loop: true },
  { name: 'shanty-loop', build: shantyLoop, role: 'Optional music bed: an original cheerful jig on plucked strings. Seamless loop.', loop: true },
];
