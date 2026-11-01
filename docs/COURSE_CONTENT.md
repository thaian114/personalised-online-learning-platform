# Interim course content

Contributor: Kieu Gia Bao (2410236). Milestone: first interim report, 1 November 2026.

## Delivered scope

Six original English units are implemented in `src/course-content.js`:

| Course | Unit | Learning objective |
| --- | --- | --- |
| English Foundations | 1. Greetings and introductions | Introduce yourself and choose appropriate greetings |
| English Foundations | 2. Nouns and pronouns | Replace nouns with subject pronouns |
| English Foundations | 3. The verb to be | Form affirmative, negative and question sentences |
| Everyday English | 1. Saying hello | Open and close conversations politely |
| Everyday English | 2. Introducing yourself | Share hometown/interests and ask follow-up questions |
| Everyday English | 3. Talking about your day | Describe routines using present simple and clock times |

Each unit has two objectives, teaching notes, three examples, practice, a summary and three questions with answer explanations. Two printable HTML worksheets provide exercises and self-check answer keys. The lesson viewer uses slides plus text and linked worksheets; browser Print can save worksheets as PDF. No external copyrighted materials or paid media are required.

The lookup key includes both course and lesson identifiers to prevent content leakage between courses. The same curated notes and summaries are seeded into backend lesson records. New demo accounts are seeded with the existing scrypt password helper instead of plaintext passwords.

## Demonstration

Use a fresh browser profile or the application's reset-demo-data control before the demonstration: localStorage may retain older course metadata.

1. Select the student demo account at `/login`.
2. Open `/learn/foundations/1`: show the English slide, objectives, notes and practice.
3. Open the printable worksheet; expand its answer key.
4. Open the lesson quiz and answer the three questions; show explanations and reload the result.
5. Return to the lesson and show completion.
6. Enrol in Everyday English through `/courses/everyday`, then open its first lesson to demonstrate distinct content.

## Boundaries and follow-up

- This is a six-unit interim sample, not two fully finished courses. The existing catalogue still has 12 Foundations and 10 Everyday units; later units retain prototype content.
- New lesson-specific quizzes currently run in the frontend demo. The backend assessment API still uses its existing shared ten-question bank. Unify the two before claiming end-to-end server-graded course assessments.
- Existing placement questions and CEFR thresholds are prototype rules, not a validated proficiency instrument.
- The UI, categories and learning-goal labels remain partly Vietnamese because existing filters and recommendation rules depend on those values. An English demo script is provided, but full UI localization remains outstanding.
- The assignment deadline is 1 November 2026, 23:59 UTC+7. It is a fixed demo deadline; update it for later milestones.
- Content was prepared with AI assistance and requires team pedagogical review. Do not claim validation by English teachers or real learners.

## Checks

`npm run test:content` checks identities, objectives, examples, questions, worksheet paths and prerequisite cycles. `npm run test:integration` additionally checks seeded teaching material, password hashing and repeat-seed row counts. Browser coverage is in `tests/e2e/content.spec.js`.
