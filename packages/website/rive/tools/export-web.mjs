import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const website = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(resolve(website, 'package.json'));
const runtimeRequire = createRequire(require.resolve('@rive-app/react-canvas'));
const runtime = dirname(runtimeRequire.resolve('@rive-app/canvas'));
const destination = resolve(website, 'public/labs/rive');
mkdirSync(destination, { recursive: true });
for (const file of ['rive.wasm', 'rive_fallback.wasm']) {
  copyFileSync(resolve(runtime, file), resolve(destination, file));
}
copyFileSync(resolve(website, 'rive/field-guide/build/field-guide.riv'), resolve(destination, 'field-guide.riv'));
console.log('Copied the authored asset and matching Rive runtime WASM into public/labs/rive.');
