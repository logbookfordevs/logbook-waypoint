import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { describe, expect, it } from 'vitest';
import nextConfig from './next.config';

describe('public installer asset', () => {
  it('generates the deployed installer from the canonical source during build', () => {
    nextConfig(PHASE_PRODUCTION_BUILD);
    expect(readFileSync(resolve(process.cwd(), 'public/install.sh'), 'utf8')).toBe(
      readFileSync(resolve(process.cwd(), '../../scripts/install.sh'), 'utf8'),
    );
  });
});
