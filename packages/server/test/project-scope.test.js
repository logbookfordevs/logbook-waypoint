import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createProjectScope,
  matchesProjectScope,
} from '../lib/project-scope.js';

test('project scopes are restricted to loopback URLs and preserve URL components for exact matches', () => {
  const scope = createProjectScope('http://localhost:3000/app?tab=open#feedback');

  assert.equal(matchesProjectScope('http://localhost:3000/app?tab=open#feedback', scope), true);
  assert.equal(matchesProjectScope('http://localhost:3000/app?tab=closed#feedback', scope), false);
  assert.throws(() => createProjectScope('https://example.com/app'), /loopback/i);
});

test('a Page scope without view state includes query and hash variants', () => {
  const scope = createProjectScope('http://localhost:3000/account');

  assert.equal(matchesProjectScope('http://localhost:3000/account?active=Profile', scope), true);
  assert.equal(matchesProjectScope('http://localhost:3000/account?active=Notifications#email', scope), true);
  assert.equal(matchesProjectScope('http://localhost:3000/accounts', scope), false);
});

test('a scoped View State still requires its complete query and hash', () => {
  const scope = createProjectScope('http://localhost:3000/account#details');

  assert.equal(matchesProjectScope('http://localhost:3000/account#details', scope), true);
  assert.equal(matchesProjectScope('http://localhost:3000/account?active=Profile#details', scope), false);
});

test('project scope wildcards respect host, port, and path boundaries', () => {
  const scope = createProjectScope('http://127.0.0.1:3000/app/*');

  assert.equal(matchesProjectScope('http://127.0.0.1:3000/app/settings?mode=dark#panel', scope), true);
  assert.equal(matchesProjectScope('http://127.0.0.1:3000/apple', scope), false);
  assert.equal(matchesProjectScope('http://127.0.0.1:30000/app/settings', scope), false);
  assert.equal(matchesProjectScope('http://example.com/app/settings', scope), false);
});
