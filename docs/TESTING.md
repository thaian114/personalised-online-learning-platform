# Test strategy and evidence

Contributor: Kieu Gia Bao (2410236). Updated: 18 November 2026 (UTC+7).
Environment: Windows, Node 24.21.0, npm, Microsoft Edge; SQLite/Prisma 5.22.0.

## Reproduction

```powershell
npm ci
npm test
npm run test:content
npm run test:integration
npm run test:e2e
npm run build
npm audit --omit=dev --audit-level=high
```

`test:integration` generates Prisma Client and creates a fresh, separately seeded temporary SQLite database for **each** Node test file. It never uses the developer's DATABASE_URL. Databases are cleaned up when the runner exits normally or fails. A hard process kill can leave a `luma-interim-tests-*` temporary directory. The older `test:all` command is retained for compatibility, but requires an existing seeded database and can produce cross-suite interference; use the isolated runner for release evidence.

## Traceability

| Requirement | Evidence | Type |
| --- | --- | --- |
| Accounts, validation, profiles and notifications | `tests/users.test.js` | API |
| Course search, publishing and lesson management | `tests/courses.test.js` | API |
| Prerequisites, enrolment, progress and resumption | `tests/domain.test.js`, `tests/enrollment.test.js` | Domain/API |
| Quiz scoring, answer stripping, placement and grading | `tests/assessments.test.js` | API |
| Admin roles, visibility and statistics | `tests/admin.test.js` | API |
| Recommendation score, baseline and prerequisite ordering | `tests/path.test.js` | Synthetic algorithm/API |
| English content and course-specific lookup | `tests/content.test.js` | Content |
| Seeded material, hashed demo password and repeat seed | `tests/seed-content.test.js` | SQLite integration |
| Frontend/API/course release endpoints | `tests/release-smoke.test.js` | HTTP smoke |
| Docker, Nginx, Compose and CI release wiring | `tests/deployment-config.test.js` | Deployment configuration |
| Learner, instructor, admin workflows and responsive routes | `tests/e2e/app.spec.js` | Browser demo |
| New English lesson, worksheet, quiz and reload persistence | `tests/e2e/content.spec.js` | Browser demo |
| Feedback, mute and reduced motion | `tests/e2e/feedback.spec.js` | Browser demo |

## Changes and findings

- Completed 22 flagship lessons and expanded validation to 67 Node/domain/API/content/deployment tests across 11 files.
- Added two final-lesson browser cases, bringing the Playwright suite to 11 cases pending CI execution.
- Fixed a calendar-dependent assignment test: it now sets an explicit past deadline before asserting that a submission is late.
- The Windows Prisma engine failed when creating an absent SQLite file; the runner now creates each empty file before schema push.
- CI now runs isolated API/domain/content tests, Chromium E2E, production build and uploads browser evidence for 14 days. Pushes on `codex/**`, main, and PRs to main trigger CI.
- The initial browser run overlapped live source edits and encountered a Vite hot-reload/context error. Final evidence must come from a subsequent run with source edits stopped.
- Production-dependency audit (`npm audit --omit=dev --audit-level=high`) reports zero vulnerabilities. The full development audit currently reports five high findings inherited through Vite 8.3.5 and `picomatch` 4.0.7 (GHSA-fc5q-39xc-vjpf). No patched `picomatch` release is available as of 18 November 2026; `npm audit fix --force` proposes a breaking Vite downgrade, so the issue is documented rather than hidden or force-fixed.

## Limits

Browser tests exercise the localStorage prototype rather than a fully integrated API deployment. API role tests use the existing development identity mechanism; they do not prove resistance to token forgery. Recommendation tests use synthetic data and an existing popularity baseline; no real-user effectiveness claim is made. Placement CEFR thresholds are unvalidated. No load test or real-user usability study was completed. Container runtime must be verified on the Linux CI runner because Docker and sandbox-compatible Edge execution are unavailable locally.

Final measured results are listed in `INTERIM_CONTRIBUTION.md`. CI run URLs and the branch diff provide independently inspectable evidence after push.
