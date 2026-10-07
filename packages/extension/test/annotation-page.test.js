import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const pageUrl = new URL('../public/annotation-page.js', import.meta.url);

async function loadPageIdentity() {
  const context = vm.createContext({ globalThis: null, URL });
  context.globalThis = context;
  vm.runInContext(await readFile(pageUrl, 'utf8'), context, { filename: 'annotation-page.js' });
  return context.WaypointAnnotationPage;
}

test('Page identity ignores query and hash while preserving origin and pathname', async () => {
  const page = await loadPageIdentity();

  assert.equal(
    page.matches('http://localhost:3001/account?active=Profile', 'http://localhost:3001/account?active=Notifications#email'),
    true,
  );
  assert.equal(page.matches('http://localhost:3001/account', 'http://localhost:3001/dashboard'), false);
  assert.equal(page.matches('http://localhost:3001/account', 'http://localhost:3002/account'), false);
  assert.equal(page.key('http://localhost:3001/account?active=Profile#details'), 'http://localhost:3001/account');
});

test('invalid captured URLs never match a Page', async () => {
  const page = await loadPageIdentity();

  assert.equal(page.matches('not a URL', 'http://localhost:3001/account'), false);
  assert.equal(page.key('not a URL'), null);
});
