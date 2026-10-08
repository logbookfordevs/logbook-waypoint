import { access, cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const standaloneRoot = join(packageRoot, '.next/standalone/packages/website');
const serverPath = join(standaloneRoot, 'server.js');
const { values } = parseArgs({
  options: {
    hostname: { type: 'string', default: '127.0.0.1' },
    port: { type: 'string', default: '3000' },
  },
});

try {
  await access(serverPath);
} catch {
  console.error('Build the website first: pnpm --filter @logbookfordevs/waypoint-website build');
  process.exit(1);
}

// Next's standalone output excludes assets that a CDN would normally serve.
await mkdir(join(standaloneRoot, '.next'), { recursive: true });
await cp(join(packageRoot, 'public'), join(standaloneRoot, 'public'), { recursive: true });
await cp(join(packageRoot, '.next/static'), join(standaloneRoot, '.next/static'), { recursive: true });

process.env.HOSTNAME = values.hostname;
process.env.PORT = values.port;
await import(pathToFileURL(serverPath).href);
