import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('release packager produces the archive consumed by the direct installer', async () => {
  const packager = await readFile(path.join(repositoryRoot, 'scripts/package-waypoint-release.sh'), 'utf8');

  assert.match(packager, /waypoint-cli\.tar\.gz/);
  assert.match(packager, /@logbookfordevs\/waypoint/);
  assert.match(packager, /deploy --prod/);
  assert.match(packager, /\.sha256/);
});

test('tagged release workflow publishes npm and GitHub assets from one validation job', async () => {
  const workflow = await readFile(path.join(repositoryRoot, '.github/workflows/publish.yml'), 'utf8');

  assert.match(workflow, /tags:\s*\n\s*- ['"]v\*['"]/);
  assert.match(workflow, /pnpm test/);
  assert.match(workflow, /pnpm --dir packages\/server pack --dry-run/);
  assert.match(workflow, /npm publish --access public --ignore-scripts/);
  assert.match(workflow, /waypoint-cli\.tar\.gz/);
  assert.match(workflow, /waypoint-cli\.tar\.gz\.sha256/);
  assert.match(workflow, /node-version: 24/);
  assert.doesNotMatch(workflow, /uses: [^\n]+@v\d/);
  assert.match(workflow, /id-token: write/);
  assert.doesNotMatch(workflow, /NPM_TOKEN/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /gitleaks git/);
  assert.match(workflow, /zizmor --offline/);
  assert.match(workflow, /pnpm audit --prod --audit-level high/);
});

test('every workflow uses immutable actions and least-privilege checkout', async () => {
  const workflowDirectory = path.join(repositoryRoot, '.github/workflows');
  const workflowNames = ['ci.yml', 'publish.yml', 'security.yml'];

  for (const workflowName of workflowNames) {
    const workflow = await readFile(path.join(workflowDirectory, workflowName), 'utf8');
    const actionReferences = [...workflow.matchAll(/uses:\s+[^@\s]+@([^\s#]+)/g)];

    assert.ok(actionReferences.length > 0, `${workflowName} must use at least one action`);
    for (const [, reference] of actionReferences) {
      assert.match(reference, /^[0-9a-f]{40}$/, `${workflowName} must pin every action to a full commit SHA`);
    }

    if (workflow.includes('actions/checkout@')) {
      assert.match(workflow, /persist-credentials: false/, `${workflowName} must disable persisted checkout credentials`);
    }
  }
});
