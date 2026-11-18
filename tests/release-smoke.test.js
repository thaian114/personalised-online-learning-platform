import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { checkRelease } from '../scripts/smoke-release.mjs';

async function withServer(responses, run) {
  const server = createServer((request, response) => {
    const item = responses[request.url] || { status: 404, body: 'not found' };
    response.writeHead(item.status || 200, {
      'content-type': item.type || 'application/json',
    });
    response.end(typeof item.body === 'string' ? item.body : JSON.stringify(item.body));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('release smoke accepts frontend, health and seeded course responses', async () => {
  await withServer(
    {
      '/': { type: 'text/html', body: '<!doctype html><div id="root"></div>' },
      '/api/health': { body: { status: 'ok' } },
      '/api/courses': { body: { success: true, data: [{ id: 'foundations' }] } },
    },
    async (baseUrl) => {
      const results = await checkRelease(baseUrl);
      assert.deepEqual(
        results.map(({ name, status }) => ({ name, status })),
        [
          { name: 'frontend', status: 200 },
          { name: 'api-health', status: 200 },
          { name: 'seeded-courses', status: 200 },
        ],
      );
    },
  );
});

test('release smoke names an invalid health endpoint', async () => {
  await withServer(
    {
      '/': { type: 'text/html', body: '<div id="root"></div>' },
      '/api/health': { body: { status: 'starting' } },
      '/api/courses': { body: { success: true, data: [{ id: 'foundations' }] } },
    },
    async (baseUrl) => {
      await assert.rejects(checkRelease(baseUrl), /\/api\/health/);
    },
  );
});
