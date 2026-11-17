# Final Quality, Deployment, and Course Content Design

## Purpose

Prepare Kiều Gia Bảo's Testing, Deployment, and Course Contents contribution for the next project milestone. The deliverable must be demonstrable, reproducible, and honest about the prototype's current full-stack limitations.

## Scope

### Course content

Complete the two flagship courses already used by the student demo:

- English Foundations: 12 complete lessons.
- Everyday English: 10 complete lessons.

The existing six curated lessons remain the reference format. Each of the 16 new lessons must contain:

- a title and two measurable learning objectives;
- teaching notes and at least three examples;
- a short guided-practice activity;
- a concise lesson summary;
- three lesson-specific multiple-choice questions;
- a correct answer and explanation for each question.

Content is stored in the existing `src/course-content.js` data structure and consumed by the current lesson UI and seed process. No new content framework or dependency will be introduced.

### Testing

Extend the current test suite instead of creating a second testing system. Tests will verify:

- all 22 flagship lessons have complete content;
- lesson identifiers are unique within their course and lookups do not leak content between courses;
- objectives, examples, practice, summaries, questions, answers, and explanations meet the content contract;
- seeded backend lessons match curated content;
- printable worksheets remain reachable and contain exercises and answer keys;
- the release containers expose healthy frontend and backend endpoints.

The existing isolated SQLite integration runner and Playwright configuration remain the primary test mechanisms. New production behavior is written test-first and must preserve the current 58 integration and nine browser tests.

### Deployment

Build on the existing Docker and GitHub Actions setup with the smallest reproducible full-stack trial deployment:

- serve the Vite production build from a lightweight frontend container;
- keep the Express/Prisma API container and persistent SQLite volume;
- route browser `/api` requests to the backend within Docker Compose;
- add health checks for both services;
- add a release smoke script that checks the frontend, API health endpoint, and seeded course endpoint;
- run the container smoke checks in GitHub Actions and retain useful failure output.

The trial deployment demonstrates packaging and service connectivity. It does not claim production readiness. Public hosting, PostgreSQL migration, durable object storage, hardened authentication, Pino, and Sentry remain separate work because they require team architecture decisions or external service credentials.

## Data flow

The browser loads the production frontend container. Requests under `/api` are proxied to the backend container. The backend accesses Prisma through the existing `DATABASE_URL`, with Docker Compose mounting the SQLite database in a named volume. Local development continues to use the existing Vite and Node commands.

Course content remains defined once in `src/course-content.js`. The frontend lesson view reads it directly for the demo, while `src/backend/seed.js` copies the same teaching notes and summaries into backend lesson records. Tests compare both representations to detect drift.

## Error handling

- A missing or incomplete lesson causes content validation tests to fail with the course and lesson identifier.
- Invalid quiz answers or explanations fail before content can be reported as complete.
- Container health checks fail when either frontend or backend is unavailable.
- The release smoke script exits non-zero and names the failed endpoint.
- Existing test databases remain isolated and disposable.

## Non-goals

- Completing all 60 catalogue lessons in this milestone.
- Replacing SQLite with PostgreSQL.
- Rewriting frontend state management or completing all frontend/backend integration.
- Deploying to a paid or credentialed external platform.
- Adding new testing frameworks, reverse-proxy packages, or content-management dependencies.

## Acceptance criteria

1. English Foundations contains 12 complete lessons and Everyday English contains 10 complete lessons.
2. All 22 lessons satisfy the existing content contract and use lesson-specific quizzes.
3. Seed consistency and cross-course lookup tests pass.
4. The complete isolated integration suite and Playwright suite pass without regressions.
5. The production frontend build passes.
6. Docker Compose defines healthy frontend and backend services and the release smoke script verifies both.
7. GitHub Actions runs tests, build, and container smoke checks from a clean checkout.
8. Documentation states verified evidence and remaining release blockers without claiming a public production deployment.

