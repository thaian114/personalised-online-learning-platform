# Interim test strategy and evidence

Contributor: Kieu Gia Bao (2410236). Date: 30 October 2026 (UTC+7).
Base commit: `894b80721c6fcf64953724b2a2a9fed2ece35ca6`.
Environment: Windows, Node 24.21.0, npm, Microsoft Edge; SQLite/Prisma 5.22.0.

## Reproduction

```powershell
npm ci
npm test
npm run test:content
npm run test:integration
npm run test:e2e
npm run build
npm audit
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
| Learner, instructor, admin workflows and responsive routes | `tests/e2e/app.spec.js` | Browser demo |
| New English lesson, worksheet, quiz and reload persistence | `tests/e2e/content.spec.js` | Browser demo |
| Feedback, mute and reduced motion | `tests/e2e/feedback.spec.js` | Browser demo |

## Changes and findings

- Added four content tests, one seed integration test and two browser tests.
- Fixed a calendar-dependent assignment test: it now sets an explicit past deadline before asserting that a submission is late.
- The Windows Prisma engine failed when creating an absent SQLite file; the runner now creates each empty file before schema push.
- CI now runs isolated API/domain/content tests, Chromium E2E, production build and uploads browser evidence for 14 days. Pushes on `codex/**`, main, and PRs to main trigger CI.
- The initial browser run overlapped live source edits and encountered a Vite hot-reload/context error. Final evidence must come from a subsequent run with source edits stopped.
- `npm audit` initially reported three high-severity dependency issues. Compatible dependency updates were applied via npm; final audit and test results are recorded below.

## Limits

Browser tests exercise the localStorage prototype rather than a fully integrated API deployment. API role tests use the existing development identity mechanism; they do not prove resistance to token forgery. Recommendation tests use synthetic data and an existing popularity baseline; no real-user effectiveness claim is made. Placement CEFR thresholds are unvalidated. No load test, real-user usability study or container runtime test was completed in this environment.

Final measured results are listed in `INTERIM_CONTRIBUTION.md`. CI run URLs and the branch diff provide independently inspectable evidence after push.
