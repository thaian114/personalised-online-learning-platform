import { pathToFileURL } from 'node:url';

async function requireResponse(fetchImpl, baseUrl, path) {
  const response = await fetchImpl(new URL(path, baseUrl));
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return response;
}

export async function checkRelease(baseUrl, fetchImpl = fetch) {
  const frontend = await requireResponse(fetchImpl, baseUrl, '/');
  const html = await frontend.text();
  if (!/<(?:div|main)[^>]+id=["']root["']/.test(html)) {
    throw new Error('/ did not return the frontend root element');
  }

  const health = await requireResponse(fetchImpl, baseUrl, '/api/health');
  const healthBody = await health.json();
  if (healthBody.status !== 'ok') throw new Error('/api/health did not report status ok');

  const courses = await requireResponse(fetchImpl, baseUrl, '/api/courses');
  const courseBody = await courses.json();
  if (!Array.isArray(courseBody.data) || courseBody.data.length === 0) {
    throw new Error('/api/courses did not return seeded courses');
  }

  return [
    { name: 'frontend', status: frontend.status },
    { name: 'api-health', status: health.status },
    { name: 'seeded-courses', status: courses.status },
  ];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8080';
  checkRelease(baseUrl)
    .then((results) => {
      for (const result of results) console.log(`✓ ${result.name}: HTTP ${result.status}`);
    })
    .catch((error) => {
      console.error(`Release smoke failed: ${error.message}`);
      process.exitCode = 1;
    });
}
