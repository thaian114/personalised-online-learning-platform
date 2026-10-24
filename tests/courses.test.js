// Automated API tests for Module 1: Courses & Lessons
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/backend/app.js';
import prisma from '../src/backend/db/prisma.js';

let server;
let baseUrl;

test.before(async () => {
  return new Promise((resolve) => {
    // Listen on dynamic port
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) server.close();
  await prisma.$disconnect();
});

test('1. GET /api/health should return ok status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.status, 'ok');
});

test('2. GET /api/courses should return published courses from database', async () => {
  const res = await fetch(`${baseUrl}/courses`);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.length > 0);
  assert.equal(json.data[0].status, 'published');
});

test('3. GET /api/courses with search and filter', async () => {
  // Test search with diacritics
  const res = await fetch(`${baseUrl}/courses?search=giao tiep`);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.ok(json.data.some((c) => c.category === 'Giao tiếp' || c.title.includes('English')));

  // Test level filter
  const resLevel = await fetch(`${baseUrl}/courses?level=C%C6%A1+b%E1%BA%A3n`);
  const jsonLevel = await resLevel.json();
  assert.ok(jsonLevel.data.every((c) => c.level === 'Cơ bản'));
});

test('4. GET /api/courses/:id should return single course with lessons and prerequisite', async () => {
  const res = await fetch(`${baseUrl}/courses/foundations`);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.id, 'foundations');
  assert.ok(typeof json.data.lessons === 'number');
  assert.ok(Array.isArray(json.data.lessonList));
  assert.ok(json.data.lessonList.length > 0);
});

test('5. POST /api/instructor/courses requires instructor or admin role', async () => {
  // Unauthorized request
  const unauthRes = await fetch(`${baseUrl}/instructor/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Unauthorized' }),
  });
  assert.equal(unauthRes.status, 401);

  // Student role forbidden
  const studentRes = await fetch(`${baseUrl}/instructor/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'student-1',
      'x-user-role': 'student',
    },
    body: JSON.stringify({ title: 'Test Forbidden' }),
  });
  assert.equal(studentRes.status, 403);
});

test('6. POST & PUT /api/instructor/courses with valid instructor role', async () => {
  const testCourse = {
    id: `test-course-${Date.now()}`,
    title: 'IELTS Writing Task 2 Mastery',
    description: 'Chinh phục bài luận IELTS đạt band điểm 7.0+',
    level: 'Nâng cao',
    category: 'Luyện thi',
    hours: 6,
    prerequisiteId: 'foundations',
    outcomes: ['Viết mở bài và kết bài chuẩn', 'Phát triển ý mạch lạc'],
  };

  const createRes = await fetch(`${baseUrl}/instructor/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'linh-tran',
      'x-user-role': 'instructor',
    },
    body: JSON.stringify(testCourse),
  });

  const createJson = await createRes.json();
  assert.equal(createRes.status, 201);
  assert.equal(createJson.success, true);
  assert.equal(createJson.data.title, testCourse.title);
  assert.equal(createJson.data.prerequisiteId, 'foundations');

  // Update course
  const updateRes = await fetch(`${baseUrl}/instructor/courses/${createJson.data.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'linh-tran',
      'x-user-role': 'instructor',
    },
    body: JSON.stringify({
      title: 'IELTS Writing Task 2 Advanced',
      status: 'published',
    }),
  });

  const updateJson = await updateRes.json();
  assert.equal(updateRes.status, 200);
  assert.equal(updateJson.data.title, 'IELTS Writing Task 2 Advanced');
  assert.equal(updateJson.data.status, 'published');
});

test('7. Lesson CRUD under a course', async () => {
  const courseId = `lesson-crud-${Date.now()}`;
  await prisma.course.create({
    data: {
      id: courseId,
      title: 'Course for Lesson CRUD',
      description: 'Temporary course for lesson CRUD test',
      level: 'Cơ bản',
      category: 'Ngữ pháp',
      teacher: 'Linh Trần',
      status: 'published',
      lessonsCount: 0,
    },
  });

  // Add lesson
  const addRes = await fetch(`${baseUrl}/instructor/courses/${courseId}/lessons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'linh-tran',
      'x-user-role': 'instructor',
    },
    body: JSON.stringify({
      title: 'Modal Verbs in Context',
      minutes: 20,
      body: 'Hướng dẫn sử dụng can, could, should trong hội thoại.',
      summary: 'Tóm tắt các modal verbs thông dụng.',
    }),
  });

  const addJson = await addRes.json();
  assert.equal(addRes.status, 201);
  assert.equal(addJson.success, true);
  assert.ok(addJson.data.id > 0);

  const lessonId = addJson.data.id;

  // Update lesson
  const updateRes = await fetch(`${baseUrl}/instructor/courses/${courseId}/lessons/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'linh-tran',
      'x-user-role': 'instructor',
    },
    body: JSON.stringify({
      title: 'Modal Verbs Mastery',
      minutes: 25,
    }),
  });

  const updateJson = await updateRes.json();
  assert.equal(updateRes.status, 200);
  assert.equal(updateJson.data.title, 'Modal Verbs Mastery');

  // Delete lesson
  const delRes = await fetch(`${baseUrl}/instructor/courses/${courseId}/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': 'linh-tran',
      'x-user-role': 'instructor',
    },
  });
  const delJson = await delRes.json();
  assert.equal(delRes.status, 200);
  assert.equal(delJson.success, true);

  // Clean up
  await prisma.course.deleteMany({ where: { id: courseId } });
});
