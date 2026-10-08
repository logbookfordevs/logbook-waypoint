import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLE_RATE, toWav } from './dsp.mjs';
import { SOUNDS } from './sounds.mjs';

const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), '../../public/sfx');
const only = process.argv.slice(2);
const workDirectory = mkdtempSync(join(tmpdir(), 'waypoint-sfx-'));

mkdirSync(outputDirectory, { recursive: true });

const manifest = [];

for (const sound of SOUNDS) {
  if (only.length > 0 && !only.includes(sound.name)) continue;

  const channels = sound.build();
  const wavPath = join(workDirectory, `${sound.name}.wav`);
  const mp3Path = join(outputDirectory, `${sound.name}.mp3`);
  const bitrate = sound.loop ? '112k' : '128k';

  writeFileSync(wavPath, toWav(channels));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wavPath, '-codec:a', 'libmp3lame', '-b:a', bitrate, '-ar', String(SAMPLE_RATE), mp3Path]);

  manifest.push({
    file: `${sound.name}.mp3`,
    role: sound.role,
    loop: sound.loop,
    channels: channels.length,
    seconds: Number((channels[0].length / SAMPLE_RATE).toFixed(3)),
    bytes: statSync(mp3Path).size,
  });
  console.log(`${sound.name}: ${manifest.at(-1).seconds}s, ${(manifest.at(-1).bytes / 1024).toFixed(0)} KB`);
}

if (only.length === 0) writeFileSync(join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
rmSync(workDirectory, { recursive: true, force: true });
