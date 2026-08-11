import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { PRODUCT_IDENTITY, validateProductIdentity } from '../lib/product-identity.js';

test('server package exposes the canonical package and CLI identifiers', async () => {
  const source = await readFile(new URL('../package.json', import.meta.url), 'utf8');
  const packageManifest = JSON.parse(source);

  validateProductIdentity(PRODUCT_IDENTITY);
  assert.equal(packageManifest.name, PRODUCT_IDENTITY.npmPackage);
  assert.equal(packageManifest.bin[PRODUCT_IDENTITY.cliCommand], './bin/cli.js');
  assert.equal(packageManifest.repository.url, `git+${PRODUCT_IDENTITY.repositoryUrl}.git`);
  assert.equal(packageManifest.homepage, PRODUCT_IDENTITY.homepageUrl);
  assert.equal(packageManifest.bugs.url, PRODUCT_IDENTITY.supportUrl);
});
