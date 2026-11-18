# Trial deployment and reproduction

Contributor: Kieu Gia Bao (2410236). Scope: reproducible full-stack trial; no public backend has been provisioned by this change.

## Actual architecture and deviations

React/Vite builds to `dist/`. In the trial stack, Nginx serves that production build on `http://127.0.0.1:8080` and proxies `/api` requests to the Express/Prisma container. The API remains directly available on loopback port 5000 for diagnostics. The current Prisma provider is **SQLite**, not the PostgreSQL proposed in September. The frontend still stores most demo state in localStorage, so service connectivity does not imply complete API/UI integration.

The repository already contains `vercel.json` for SPA fallback and documents `https://luma-english-dath.vercel.app` as its frontend deployment. That URL does not prove that this branch is deployed or that the API is integrated. Record the actual deployment commit and accessible URL after the team publishes this branch.

## Local reproduction (PowerShell)

Prerequisites: Node 22.14+ and npm; Microsoft Edge for local browser tests. Commands start at the repository root.

```powershell
npm ci
Copy-Item .env.example .env
$env:DATABASE_URL='file:./dev.db'
# Create the database file before db push (required by Prisma 5 on this Windows host).
node -e "require('node:fs').closeSync(require('node:fs').openSync('src/backend/prisma/dev.db','a'))"
npm run prisma:generate
npm run prisma:db:push
npm run prisma:seed
node --env-file=.env src/backend/server.js
```

Use a new demo database: seeding updates catalogue data and resets the shared question bank. Do not seed a database with real learner data. In a second terminal run `npm run dev` and open the URL printed by Vite. The API process health check is `http://127.0.0.1:5000/api/health`; this endpoint checks process liveness, not database readiness.

Demo accounts: `minhanh@example.com` (student), `linhtran@example.com` (instructor), `admin@example.com` (admin). The demo password is `Demo@123`. These are synthetic accounts; never reuse real passwords.

## Frontend release

1. Run `npm run test:integration`, `npm run test:e2e` and `npm run build`.
2. Deploy this branch with the team's existing Vercel project. Framework preset: Vite; build: `npm run build`; output: `dist`.
3. Verify `/login`, `/dashboard`, `/courses` and a direct reload of a nested route.
4. Verify both `/materials/foundations-worksheet.html` and `/materials/everyday-worksheet.html` return worksheet HTML rather than the SPA.
5. Record the preview URL and commit in the weekly Google Doc. Merge to main only after the team reviews the change and its preview.

## Full-stack trial with Docker Compose

Docker/Compose must be installed separately. The configuration builds both the production frontend and API, keeps the SQLite file in a named volume, waits for both service health checks, and binds both ports to loopback. Local Windows container execution remains unavailable on the contributor's machine because Docker is not installed; GitHub Actions is the required container evidence.

```powershell
docker compose build
docker compose run --rm api node -e "require('node:fs').closeSync(require('node:fs').openSync('/data/interim.db','a'))"
docker compose run --rm api npm run prisma:db:push
docker compose run --rm api npm run prisma:seed
docker compose up -d --wait
docker compose ps
npm run smoke:release
```

The smoke command verifies the frontend root page, proxied `/api/health`, and a non-empty `/api/courses` response. Open `http://127.0.0.1:8080` for the frontend; use `http://127.0.0.1:5000/api/health` only for direct API diagnosis.

The named volume retains the SQLite file. `docker compose down` stops both containers without deleting this volume. Back up the database before schema or seed changes. Do not use `down -v` on data that must be retained.

GitHub Actions repeats build, initialization, seed, `docker compose up -d --wait`, and `npm run smoke:release`. It always collects Compose logs and shuts the environment down without deleting the named volume.

The production-dependency audit currently reports zero vulnerabilities. The full development audit reports the unpatched `picomatch` advisory inherited through Vite; do not use `npm audit fix --force`, because npm proposes a breaking Vite downgrade. Recheck the advisory when a patched dependency release becomes available.

## Release blockers for an internet-facing backend

The existing authentication middleware decodes Bearer payloads without verifying their signature and accepts `x-user-id`/`x-user-role`. This is a known prototype security defect: passing role tests with synthetic headers does not establish secure authentication. Existing legacy password fallbacks, unrestricted CORS and default token secrets also require backend-team review. Newly seeded passwords are hashed, but old plaintext rows are not migrated automatically.

Before a public full-stack release: verify signed/expiring tokens, remove development identity headers, migrate legacy passwords, configure CORS/secrets, integrate frontend API state and durable uploads, choose PostgreSQL or document the approved SQLite deviation, and re-run security/E2E tests. Pino/Sentry in the proposal have not been integrated by this change.

## Rollback

Redeploy the previous known-good frontend commit. Stop the local API with Ctrl+C or `docker compose down`. No destructive database migration is introduced by this branch; restore a database backup if a seed changed demo content unexpectedly.
