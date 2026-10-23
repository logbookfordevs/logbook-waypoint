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

test('host classes keep Agent defaults on dev servers and LAN addresses without widening automatic access', async () => {
  const page = await loadPageIdentity();
  for (const url of ['http://localhost:5173/', 'http://127.0.0.1:3000/', 'http://127.0.0.2:3000/', 'http://192.168.1.24:5173/', 'http://10.0.0.8/', 'http://172.20.4.1/', 'http://[::1]:8080/', 'https://app.test/', 'http://shop.localhost/', 'file:///Users/me/site/index.html']) {
    assert.equal(page.hostClass(url), 'dev', url);
  }
  for (const url of ['https://example.com/', 'https://staging.myapp.vercel.app/', 'http://172.32.0.1/', 'not a url']) {
    assert.equal(page.hostClass(url), 'site', url);
  }

  assert.equal(page.isLocalDevUrl('http://localhost:5173/'), true);
  assert.equal(page.isLocalDevUrl('http://192.168.1.24:5173/'), false, 'LAN addresses need explicit site access');
  assert.equal(page.isLocalDevUrl('http://127.0.0.2/'), false);
  assert.equal(page.isLocalDevUrl('file:///Users/me/report.pdf'), false);
});
