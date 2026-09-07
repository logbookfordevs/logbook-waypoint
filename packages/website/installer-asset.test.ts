import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('public installer asset', () => {
  it('publishes the canonical repository installer unchanged', () => {
    const canonicalInstaller = readFileSync(resolve(process.cwd(), '../../scripts/install.sh'), 'utf8');
    const publicInstaller = readFileSync(resolve(process.cwd(), 'public/install.sh'), 'utf8');

    expect(publicInstaller).toBe(canonicalInstaller);
  });
});
