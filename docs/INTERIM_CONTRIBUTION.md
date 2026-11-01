# Interim contribution: Testing, Deployment and Course Contents

**Student:** Kieu Gia Bao - 2410236, Group 1, CO3103, semester 261.
**Milestone:** Interim report due 23:59, 1 November 2026 (UTC+7).

This note supports the team's English report. Integrate the key results into the report's main body; the course specification limits the interim submission to ten pages including the cover and contents. This Markdown file is supporting evidence, not the complete team report.

## Report-ready contribution

For the first interim milestone, we prepared six English teaching units across English Foundations and Everyday English. Each unit includes learning objectives, explanations, examples, practice, a summary and a three-question quiz. Two printable worksheets with answer keys provide supplementary learning materials. The shared content module is consumed by the lesson interface and by the database seed, reducing inconsistencies between demo notes and stored lesson content.

The quality workflow was extended with content validation, seed consistency checks and browser tests for lesson-specific quizzes and worksheet delivery. Existing API tests cover accounts, courses, enrolment, assessment, administration and personalised learning paths. An isolated runner provisions a separately seeded SQLite database for each test file to avoid changing developer data or coupling suites through shared state. GitHub Actions now runs these checks, browser tests and the production build, retaining browser evidence as downloadable artifacts.

Deployment preparation includes an environment example, a reproduction guide, backend container/Compose configuration and a release checklist for the existing Vercel frontend. The actual database remains SQLite, which deviates from the PostgreSQL architecture in the proposal. The API is currently a local prototype: authentication hardening and full frontend/backend integration remain required before public deployment. Docker build, seed and health checks passed on GitHub-hosted Linux; Docker is not installed on the local Windows machine.

## Measured verification

| Check | Measured local result |
| --- | --- |
| Isolated Node/domain/API/content tests | 58 passed, 0 failed across 9 files |
| Playwright browser tests | 9 passed, 0 failed (about 1.8 minutes) |
| Responsive route checks | Existing main-route suite passed at 375, 768, 1024 and 1440 px |
| Production build | Passed with Vite 8.3.5; warning: main JS chunk exceeds 500 kB |
| Dependency audit after compatible updates | 0 reported vulnerabilities |
| Local seeded backend | `/api/health` returned status ok; `/api/courses` returned success true |
| Docker | Linux CI build, schema initialization, seed, startup and health check passed; not installed locally |
| Hosted deployment | Existing Vercel URL is documented; this branch has not been newly deployed to the team's cloud project |

Evidence commands and coverage are in `TESTING.md`; browser HTML reports are generated locally under ignored `playwright-report/`. [GitHub Actions run 41055345233](https://github.com/thaian114/personalised-online-learning-platform/actions/runs/41055345233) passed both test/build and container jobs for implementation commit `ec4866a`. It contains browser evidence and the deployable `frontend-dist` artifact, retained for 14 days. These results cover the implementation based on commit `894b807`; the follow-up documentation commit records the measured CI evidence without changing runtime code.

## Demo script (English narration)

1. "We prepared English teaching content for two beginner courses. This lesson has objectives, examples and a practice task."
2. "The learner can open a supplementary worksheet and check answers independently."
3. "Each of the six interim lessons has its own three-question quiz. Here we submit the answers, reload the result and confirm that progress persists in this browser."
4. "These browser checks validate the frontend demo. API tests run separately against disposable seeded databases. Full server-backed UI integration remains in progress."
5. "The learning-path module already has synthetic prerequisite and baseline tests. These are initial engineering checks, not evidence of learning gains on real users."

## Risks and remaining plan

| Risk / gap | Next action | Coordination |
| --- | --- | --- |
| Unsigned token payloads and trusted development role headers | Verify tokens, remove test identities from public runtime; add negative security tests | Backend team + Testing |
| Frontend localStorage vs backend data | Integrate authenticated API state, then run full-stack E2E | Frontend + Backend |
| SQLite vs proposed PostgreSQL | Agree and document the database decision; migrate and retest if required | Database + Deployment |
| Six completed units; remaining lessons are outlines | Expand validated English material after interim | Course contents |
| Lesson-specific frontend quizzes vs shared API bank | Store/link per-lesson questions and unify grading | Backend + Course contents |
| No new hosted API; container verified only in Linux CI | Reproduce locally and publish after authentication hardening | Deployment |
| Unvalidated placement/recommendation effectiveness | Expand synthetic profiles, agree metrics and collect tester feedback | Advanced component + Testing |
| Partly Vietnamese UI | Prepare an English presentation; complete localization for final | Frontend |

Retain issue/PR/commit and Actions links in the weekly Google Doc to demonstrate individual contribution. No user study, cloud deployment or test result should be reported as completed without corresponding evidence.
