import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canEnroll,
  createInitialState,
  initialCourses,
  normalizeSearch,
  placementQuestions,
  progressOf,
  quizQuestions,
  scoreAnswers,
  validateUpload,
} from '../src/data.js';

test('prerequisites stay locked until the entire prerequisite is complete', () => {
  const course = initialCourses.find((c) => c.id === 'reading');
  const partial = { foundations: Array.from({ length: 11 }, (_, i) => i + 1) };
  assert.equal(canEnroll(course, initialCourses, partial), false);
  const finished = { foundations: Array.from({ length: 12 }, (_, i) => i + 1) };
  assert.equal(canEnroll(course, initialCourses, finished), true);
  assert.equal(canEnroll({ ...course, status: 'hidden' }, initialCourses, finished), false);
  assert.equal(canEnroll({ ...course, prerequisite: 'missing' }, initialCourses, finished), false);
  assert.equal(progressOf(initialCourses[0], {}), 0);
});

test('quiz scoring uses the selected option, and unanswered questions receive no credit', () => {
  assert.equal(quizQuestions.length, 10);
  assert.equal(placementQuestions.length, 20);
  const allCorrect = Object.fromEntries(placementQuestions.map((q) => [q.id, q.answer]));
  assert.equal(scoreAnswers(placementQuestions, allCorrect), 20);
  assert.equal(scoreAnswers(quizQuestions, {}), 0);
  assert.equal(scoreAnswers(quizQuestions, { q1: 1, q2: 0 }), 1);
  for (const q of placementQuestions) assert.ok(q.options[q.answer] && q.explanation);
});

test('uploads reject unsupported, empty and oversized files before submission', () => {
  assert.ok(validateUpload(null));
  assert.ok(validateUpload({ name: 'homework.exe', size: 100 }));
  assert.ok(validateUpload({ name: 'homework.pdf', size: 0 }));
  assert.ok(validateUpload({ name: 'homework.pdf', size: 10 * 1024 * 1024 + 1 }));
  assert.equal(validateUpload({ name: 'HOMEWORK.PDF', size: 10 * 1024 * 1024 }), '');
  assert.equal(validateUpload({ name: 'homework.docx', size: 1000 }), '');
});

test('Vietnamese search and initial data are consistent', () => {
  assert.equal(normalizeSearch('  Đọc Hiểu  '), 'doc hieu');
  const state = createInitialState();
  assert.equal(state.session, null);
  assert.equal(Object.values(state.completed).flat().length, 7);
  assert.ok(state.enrolled.every((id) => state.courses.some((c) => c.id === id)));
  assert.ok(state.submissions.every((s) => state.users.some((u) => u.id === s.userId)));
});
