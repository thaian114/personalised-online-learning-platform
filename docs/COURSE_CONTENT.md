# Flagship course content

Contributor: Kieu Gia Bao (2410236). Updated for the post-interim milestone on 18 November 2026.

## Delivered scope

Two complete flagship courses are implemented in `src/course-content.js`:

| Course | Completed lessons | Lesson-specific questions |
| --- | ---: | ---: |
| English Foundations | 12 | 36 |
| Everyday English | 10 | 30 |
| **Total** | **22** | **66** |

Every lesson has two measurable objectives, teaching notes, at least three examples, guided practice, a summary and three multiple-choice questions with answer explanations. Two printable HTML worksheets provide exercises and self-check answer keys. The lesson viewer uses slides plus text and linked worksheets; browser Print can save the worksheets as PDF. No external copyrighted material or paid media is required.

English Foundations progresses from greetings, pronouns and the verb be through present simple forms, frequency, time prepositions, present continuous, past simple, vocabulary, integrated practice and review. Everyday English covers introductions, routines, cafés, directions, shopping, plans, workplace communication, phone calls and integrated conversation practice.

The lookup key contains both course and lesson identifiers so equal lesson numbers cannot leak content between courses. The same curated notes and summaries are copied into backend lesson records by `src/backend/seed.js`. New demo accounts use the existing scrypt password helper rather than a plaintext seed password.

## Demonstration

Use a fresh browser profile or reset demo data because localStorage may contain earlier course metadata.

1. Select the student demo account at `/login`.
2. Open `/learn/foundations/12` and show the Course review objectives, notes and practice.
3. Open the printable Foundations worksheet and expand its answer key.
4. Complete the three-question lesson quiz, reload the result and confirm lesson completion.
5. Open `/learn/everyday/10` and show the distinct Conversation practice material.
6. Open its quiz to demonstrate that course and lesson identifiers select a different question set.
7. Seed the backend and query the two final lesson records to show that stored body and summary fields match the curated source.

## Boundaries and follow-up

- The other four catalogue courses still use prototype lesson outlines; this milestone completes two courses, not all 60 catalogue lessons.
- Lesson-specific quizzes currently run in the frontend demo. The backend assessment API still uses its shared ten-question bank, so the team must unify question storage before claiming server-graded lesson quizzes end to end.
- Placement questions and CEFR thresholds are prototype rules, not a validated proficiency instrument.
- UI categories and learning-goal labels remain partly Vietnamese because existing filters and recommendation rules depend on those values.
- Content was prepared with AI assistance and requires team pedagogical review. Do not claim validation by English teachers or real learners.

## Checks

`npm run test:content` validates course/lesson identities, complete material, globally unique question IDs, answer indexes, worksheet paths and prerequisite cycles. `npm run test:integration` additionally checks seeded content, password hashing and repeat-seed row counts. Browser coverage for the first and final lessons, quizzes and worksheets is in `tests/e2e/content.spec.js`.
