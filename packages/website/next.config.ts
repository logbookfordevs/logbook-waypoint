import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from 'next/constants';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_DEVELOPMENT_SERVER || phase === PHASE_PRODUCTION_BUILD) {
    copyFileSync(resolve(process.cwd(), '../../scripts/install.sh'), resolve(process.cwd(), 'public/install.sh'));
  }
  return { output: 'standalone' };
}
