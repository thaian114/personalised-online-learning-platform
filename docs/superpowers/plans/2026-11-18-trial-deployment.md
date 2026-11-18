# Trial Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a reproducible Docker Compose trial deployment that serves the production frontend and proxies API requests to the seeded backend, with automated smoke evidence in CI.

**Architecture:** Add a multi-stage frontend image using the existing Vite build and Nginx, while retaining the existing Express/Prisma API image and SQLite volume. A dependency-free Node smoke script verifies the frontend, API health, and seeded course response through one public Compose endpoint.

**Tech Stack:** Docker Compose, Nginx Alpine, Node.js 22, Vite, Express, Prisma/SQLite, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-18-final-quality-content-design.md`

## Global Constraints

- Add no npm dependency or new testing framework.
- Bind trial services to loopback only.
- Preserve SQLite data in the existing named volume.
- Route `/api` through the frontend container without claiming the current UI is fully API-backed.
- Treat this as a reproducible trial deployment, not an internet-facing production release.

## Review Focus

- A backend container that starts before its database is seeded must report unhealthy rather than silently serving incomplete data.
- SPA nested routes and `/materials/*` assets must be served by Nginx without rewriting API calls to `index.html`.
- `/api` proxying must preserve the `/api/...` path expected by Express.
- Smoke checks must fail non-zero and name the endpoint when HTML, health JSON, or course JSON is invalid.
- Compose shutdown must not delete the named SQLite volume unless a user explicitly requests it.

---

### Task 1: Add the release smoke checker

**Files:**
- Create: `scripts/smoke-release.mjs`
- Create: `tests/release-smoke.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `checkRelease(baseUrl, fetchImpl = fetch): Promise<Array<{name: string, status: number}>>`.
- CLI consumes: `SMOKE_BASE_URL`, defaulting to `http://127.0.0.1:8080`.

- [ ] **Step 1: Write failing smoke tests**

Start a temporary Node HTTP server in the test. Assert that `checkRelease()` accepts valid `/`, `/api/health`, and `/api/courses` responses, and rejects an invalid health payload with an error containing `/api/health`.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/release-smoke.test.js`

Expected: FAIL because `scripts/smoke-release.mjs` does not exist.

- [ ] **Step 3: Implement the dependency-free smoke checker**

Fetch the three endpoints sequentially, require HTML containing a root element, health JSON with `status: "ok"`, and course JSON containing a non-empty `data` array. Export `checkRelease`; execute it only when the module is the CLI entry point. Add `"smoke:release": "node scripts/smoke-release.mjs"`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/release-smoke.test.js`

Expected: two tests PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/smoke-release.mjs tests/release-smoke.test.js
git commit -m "test(deploy): add release smoke checker"
```

### Task 2: Add the frontend container and service wiring

**Files:**
- Create: `Dockerfile.frontend`
- Create: `docker/nginx.conf`
- Modify: `compose.yaml`
- Create: `tests/deployment-config.test.js`

**Interfaces:**
- Consumes: API service name `api`, port `5000`, and health endpoint `/api/health`.
- Produces: frontend service on `127.0.0.1:8080`, Nginx `/api` proxy, SPA fallback, and frontend health check.

- [ ] **Step 1: Write failing deployment configuration tests**

Assert the frontend Dockerfile has a Vite build stage and Nginx runtime; Nginx proxies `/api` to `http://api:5000` before SPA fallback; Compose defines `frontend`, loopback port `8080:80`, API health dependency, and health checks for both services.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/deployment-config.test.js`

Expected: FAIL because the frontend Dockerfile and Nginx configuration are absent.

- [ ] **Step 3: Implement the minimal container configuration**

Use `node:22.14.0-bookworm-slim` to run `npm ci` and `npm run build`, then copy `dist` into `nginx:1.27-alpine`. Configure `/api/` proxying, static assets, SPA fallback, and service health checks. Keep API port 5000 bound to loopback for direct diagnostics.

- [ ] **Step 4: Verify configuration tests and production build**

Run: `node --test tests/deployment-config.test.js`

Run: `npm run build`

Expected: both PASS; the existing bundle-size warning may remain documented.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile.frontend docker/nginx.conf compose.yaml tests/deployment-config.test.js
git commit -m "feat(deploy): add full-stack trial compose"
```

### Task 3: Run the full-stack smoke check in GitHub Actions

**Files:**
- Modify: `.github/workflows/node.js.yml`
- Modify: `tests/deployment-config.test.js`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `npm run smoke:release` and Compose frontend endpoint from Tasks 1 and 2.
- Produces: CI evidence that the built frontend, proxy, seeded API, and course endpoint work together.

- [ ] **Step 1: Extend the configuration test before editing CI**

Assert the workflow initializes the database, starts Compose with `--wait`, runs `npm run smoke:release`, collects logs on every result, and stops services without `-v`.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/deployment-config.test.js`

Expected: FAIL because the workflow does not yet call the release smoke script or frontend port.

- [ ] **Step 3: Update CI and deployment documentation**

Replace the health-only curl with `npm run smoke:release`. Document the frontend URL `http://127.0.0.1:8080`, direct API diagnostics, initialization commands, evidence collected, known SQLite/auth/localStorage limitations, and safe shutdown.

- [ ] **Step 4: Verify the complete local suite**

Run: `npm run test:integration`

Run: `npm run test:e2e`

Run: `npm run build`

Run: `npm audit --audit-level=high`

Expected: all tests PASS, build exits 0, audit reports zero high-severity vulnerabilities.

- [ ] **Step 5: Validate containers where Docker is available**

Run: `docker compose config`

Run: `docker compose build`

Run the documented database initialization, then: `docker compose up -d --wait && npm run smoke:release`.

Expected: frontend, API health, and seeded courses all PASS. If Docker is unavailable locally, push the branch and use the GitHub Actions `container-smoke` job as the required container evidence.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/node.js.yml tests/deployment-config.test.js docs/DEPLOYMENT.md README.md
git commit -m "ci(deploy): verify full-stack trial release"
```
