# Flagship Course Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete all 22 lessons in English Foundations and Everyday English with validated teaching material and lesson-specific quizzes.

**Architecture:** Extend the existing `interimLessons` catalogue rather than adding a second content system. The frontend and backend seed continue to consume `getLessonContent(courseId, lessonId)`, while Node and Playwright tests pin completeness, identity isolation, seed consistency, and representative browser behavior.

**Tech Stack:** JavaScript ES modules, Node test runner, Playwright, React/Vite, Prisma/SQLite.

**Spec:** `docs/superpowers/specs/2026-11-18-final-quality-content-design.md`

## Global Constraints

- Complete exactly 12 English Foundations lessons and 10 Everyday English lessons.
- Every new lesson has two measurable objectives, teaching notes, at least three examples, guided practice, a summary, and three four-option questions with answers and explanations.
- Reuse `src/course-content.js`; add no content framework or dependency.
- Preserve the current course/lesson lookup key and existing six lessons.
- Content is original prototype material and must not claim teacher or learner validation.

## Review Focus

- Duplicate question IDs across different lessons must fail validation, not silently overwrite learner results.
- A valid lesson number under the wrong course must return `null`, not another course's material.
- Question answer indexes must remain integers from 0 through 3 after new content is added.
- Seeded flagship lessons must not retain the old “Prototype outline” summary.
- The final lesson in each course must render its own title, objectives, worksheet, and three-question quiz in the browser.

---

### Task 1: Complete English Foundations

**Files:**
- Modify: `tests/content.test.js`
- Modify: `tests/seed-content.test.js`
- Modify: `tests/e2e/content.spec.js`
- Modify: `src/course-content.js`

**Interfaces:**
- Consumes: `interimLessons: Record<string, LessonContent>` and `getLessonContent(courseId, lessonId)`.
- Produces: entries `foundations:4` through `foundations:12`, each matching the existing lesson content shape.

- [ ] **Step 1: Write failing Foundations acceptance tests**

Add a Node test named `English Foundations has twelve complete lessons with globally unique question ids`. Assert keys `foundations:1` through `foundations:12`, all generic content requirements, and global uniqueness of their 36 question IDs. Extend the seed test to assert all 12 records have curated summaries without `Prototype outline`. Add a Playwright case for `/learn/foundations/12` that expects heading `Course review`, a visible objective, the Foundations worksheet link, and a three-question quiz.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test --test-name-pattern="English Foundations" tests/content.test.js`

Expected: FAIL because `foundations:4` through `foundations:12` are missing.

- [ ] **Step 3: Implement lessons 4–12**

Add material for: present simple; negatives and questions; adverbs of frequency; prepositions of time; present continuous; past simple; everyday vocabulary; integrated practice; and course review. Use question IDs `f4-1` through `f12-3` and the existing Foundations worksheet.

- [ ] **Step 4: Verify Foundations tests and browser flow**

Run: `node --test --test-name-pattern="English Foundations" tests/content.test.js`

Run: `npm run test:integration`

Run: `npx playwright test tests/e2e/content.spec.js --grep "Foundations final lesson"`

Expected: all commands PASS.

- [ ] **Step 5: Commit**

```bash
git add src/course-content.js tests/content.test.js tests/seed-content.test.js tests/e2e/content.spec.js
git commit -m "feat(content): complete English Foundations course"
```

### Task 2: Complete Everyday English

**Files:**
- Modify: `tests/content.test.js`
- Modify: `tests/seed-content.test.js`
- Modify: `tests/e2e/content.spec.js`
- Modify: `src/course-content.js`

**Interfaces:**
- Consumes: the same `LessonContent` structure and worksheet behavior validated in Task 1.
- Produces: entries `everyday:4` through `everyday:10` with IDs `e4-1` through `e10-3`.

- [ ] **Step 1: Write failing Everyday English acceptance tests**

Add a Node test named `Everyday English has ten complete lessons with globally unique question ids`. Assert keys `everyday:1` through `everyday:10`, complete content, and global uniqueness of all 30 question IDs. Extend seed coverage for all 10 records. Add a Playwright case for `/learn/everyday/10` expecting heading `Conversation practice`, its objective, the Everyday worksheet, and three quiz questions.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test --test-name-pattern="Everyday English" tests/content.test.js`

Expected: FAIL because `everyday:4` through `everyday:10` are missing.

- [ ] **Step 3: Implement lessons 4–10**

Add material for: ordering at a café; asking for directions; shopping; making plans; workplace communication; phone calls; and integrated conversation practice. Keep language at practical A1–A2 level and use the existing Everyday worksheet.

- [ ] **Step 4: Verify Everyday tests and browser flow**

Run: `node --test --test-name-pattern="Everyday English" tests/content.test.js`

Run: `npm run test:integration`

Run: `npx playwright test tests/e2e/content.spec.js --grep "Everyday English final lesson"`

Expected: all commands PASS.

- [ ] **Step 5: Commit**

```bash
git add src/course-content.js tests/content.test.js tests/seed-content.test.js tests/e2e/content.spec.js
git commit -m "feat(content): complete Everyday English course"
```

### Task 3: Update course-content evidence

**Files:**
- Modify: `docs/COURSE_CONTENT.md`
- Modify: `docs/INTERIM_CONTRIBUTION.md`

**Interfaces:**
- Consumes: verified 22-lesson coverage from Tasks 1 and 2.
- Produces: accurate next-milestone documentation and a repeatable demo script.

- [ ] **Step 1: Replace interim counts and boundaries**

Document 12 completed Foundations lessons, 10 completed Everyday lessons, 66 lesson-specific questions, and the remaining four catalogue courses as prototype outlines. Retain the disclaimer about pedagogical validation and prototype CEFR thresholds.

- [ ] **Step 2: Update the demonstration path**

Add steps demonstrating `/learn/foundations/12` and `/learn/everyday/10`, their worksheets, distinct quizzes, persistence, and seeded backend content.

- [ ] **Step 3: Verify documentation and content suite**

Run: `rg -n "six-unit|Six original|first interim|1 November 2026" docs/COURSE_CONTENT.md docs/INTERIM_CONTRIBUTION.md`

Expected: no stale interim-scope claims remain in the updated sections.

Run: `npm run test:integration`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/COURSE_CONTENT.md docs/INTERIM_CONTRIBUTION.md
git commit -m "docs(content): record completed flagship courses"
```

