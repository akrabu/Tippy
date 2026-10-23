import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const html = (body, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });

function worker(base = 'https://tippy.example/') {
  const listeners = {};
  const entries = new Map();
  const key = request => new URL(typeof request === 'string' ? request : request.url, base).href;
  const cache = {
    async match(request) { return entries.get(key(request))?.clone(); },
    async put(request, response) { entries.set(key(request), response.clone()); },
  };
  entries.set(key('./index.html'), html('cached app'));
  let network = async () => { throw new Error('offline'); };
  runInNewContext(source, {
    self: {
      location: new URL('sw.js', base),
      registration: { scope: base },
      addEventListener(type, listener) { listeners[type] = listener; },
    },
    caches: { open: async () => cache, match: request => cache.match(request) },
    fetch: request => network(request),
    URL, Response,
  });
  return {
    cache,
    network(handler) { network = handler; },
    async request(path = './', mode = 'navigate', method = 'GET') {
      let response;
      const pending = [];
      listeners.fetch({
        request: { url: new URL(path, base).href, mode, method },
        respondWith(value) { response = Promise.resolve(value); },
        waitUntil(value) { pending.push(Promise.resolve(value)); },
      });
      const result = await response;
      await Promise.all(pending);
      return result;
    },
  };
}

test('an offline launch opens the saved app', async () => {
  assert.equal(await (await worker().request()).text(), 'cached app');
});

test('opening an icon cannot replace the saved offline app', async () => {
  const app = worker();
  app.network(async () => new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } }));
  assert.equal((await app.request('./icons/icon.svg')).headers.get('content-type'), 'image/svg+xml');
  app.network(async () => { throw new Error('offline'); });
  const launch = await app.request();
  assert.match(launch.headers.get('content-type'), /text\/html/);
  assert.equal(await launch.text(), 'cached app');
});

test('a temporary server error falls back to the saved app', async () => {
  const app = worker();
  app.network(async () => html('server error', 503));
  const launch = await app.request();
  assert.equal(launch.status, 200);
  assert.equal(await launch.text(), 'cached app');
});

test('an unexpected response cannot replace the saved app page', async () => {
  const app = worker();
  app.network(async () => new Response('{"error":"unavailable"}', { headers: { 'content-type': 'application/json' } }));
  assert.equal(await (await app.request()).text(), 'cached app');
  assert.equal(await (await app.cache.match('./index.html')).text(), 'cached app');
});

test('a successful online launch refreshes the offline app page', async () => {
  const app = worker();
  app.network(async () => html('updated app'));
  assert.equal(await (await app.request()).text(), 'updated app');
  app.network(async () => { throw new Error('offline'); });
  assert.equal(await (await app.request()).text(), 'updated app');
});

test('offline launch works from a subdirectory and an index URL with a query', async () => {
  const app = worker('https://tippy.example/tools/tippy/');
  assert.equal(await (await app.request('./index.html?launch=homescreen')).text(), 'cached app');
});

test('non-GET and other-origin requests are left to the browser', async () => {
  const app = worker();
  assert.equal(await app.request('./', 'navigate', 'POST'), undefined);
  assert.equal(await app.request('https://other.example/', 'cors'), undefined);
});
