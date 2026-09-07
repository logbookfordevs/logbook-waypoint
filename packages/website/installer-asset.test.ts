import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('public installer asset', () => {
  it('publishes the canonical repository installer unchanged', () => {
    const publicInstallerPath = resolve(process.cwd(), 'public/install.sh');
    const canonicalInstaller = readFileSync(resolve(process.cwd(), '../../scripts/install.sh'), 'utf8');
    const publicInstaller = readFileSync(publicInstallerPath, 'utf8');

    expect(lstatSync(publicInstallerPath).isSymbolicLink()).toBe(true);
    expect(readlinkSync(publicInstallerPath)).toBe('../../../scripts/install.sh');
    expect(publicInstaller).toBe(canonicalInstaller);
  });
});
