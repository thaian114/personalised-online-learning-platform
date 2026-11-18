import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('trial deployment builds and serves the frontend through nginx', () => {
  const dockerfile = read('Dockerfile.frontend');
  const nginx = read('docker/nginx.conf');
  assert.match(dockerfile, /FROM node:22\.14\.0-bookworm-slim AS build/);
  assert.match(dockerfile, /RUN npm run build/);
  assert.match(dockerfile, /FROM nginx:1\.27-alpine/);
  assert.match(dockerfile, /COPY --from=build \/app\/dist \/usr\/share\/nginx\/html/);
  assert.match(nginx, /location \/api\//);
  assert.match(nginx, /proxy_pass http:\/\/api:5000/);
  assert.match(nginx, /try_files \$uri \$uri\/ \/index\.html/);
});

test('compose exposes healthy frontend and api services on loopback', () => {
  const compose = read('compose.yaml');
  assert.match(compose, /frontend:/);
  assert.match(compose, /127\.0\.0\.1:8080:80/);
  assert.match(compose, /condition: service_healthy/);
  assert.equal((compose.match(/healthcheck:/g) || []).length, 2);
  assert.match(compose, /127\.0\.0\.1:5000:5000/);
  assert.match(compose, /interim-data:\/data/);
});
