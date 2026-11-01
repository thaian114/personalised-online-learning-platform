import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { initialCourses, getLessons } from '../src/data.js';
import { interimLessons, getLessonContent } from '../src/course-content.js';

test('interim lessons have valid course/lesson identities and complete English teaching content', () => {
  assert.equal(Object.keys(interimLessons).length, 6);
  for (const [key, content] of Object.entries(interimLessons)) {
    const [courseId, lessonId] = key.split(':');
    const course = initialCourses.find((c) => c.id === courseId);
    assert.ok(course);
    assert.ok(getLessons(course).some((l) => l.id === Number(lessonId)));
    assert.ok(content.objectives.length >= 2);
    assert.ok(content.examples.length >= 3);
    assert.ok(content.body.length > 100);
    assert.ok(content.practice.length > 20);
    assert.ok(content.summary.length > 20);
    assert.match(content.worksheet, /^\/materials\/[a-z-]+\.html$/);
    assert.ok(existsSync(new URL('../public' + content.worksheet, import.meta.url)));
    assert.equal(getLessonContent(courseId, Number(lessonId)), content);
  }
});

test('interim lesson quiz answers, explanations and ids are valid', () => {
  for (const content of Object.values(interimLessons)) {
    assert.ok(content.questions.length >= 3);
    assert.equal(new Set(content.questions.map((q) => q.id)).size, content.questions.length);
    for (const q of content.questions) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
      assert.ok(q.prompt && q.explanation);
    }
  }
});

test('lesson lookup does not leak content between courses or invent unsupported lessons', () => {
  assert.notEqual(getLessonContent('foundations', 1), getLessonContent('everyday', 1));
  assert.equal(getLessonContent('missing', 1), null);
  assert.equal(getLessonContent('everyday', 99), null);
});

test('catalogue prerequisites reference existing courses and contain no cycles', () => {
  const courses = new Map(initialCourses.map((c) => [c.id, c]));
  for (const course of initialCourses) {
    const visited = new Set();
    let cursor = course;
    while (cursor) {
      assert.ok(!visited.has(cursor.id), 'Cycle at ' + cursor.id);
      visited.add(cursor.id);
      if (!cursor.prerequisite) break;
      assert.ok(courses.has(cursor.prerequisite));
      cursor = courses.get(cursor.prerequisite);
    }
  }
});
