// Automated API tests for Module 2: Enrollment & Progress
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/backend/app.js';
import prisma from '../src/backend/db/prisma.js';

let server;
let baseUrl;
let rootUrl;

const testStudentId = 'test-student-module2-' + Date.now();
const testHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': testStudentId,
  'x-user-role': 'student',
};

// Fixtures for testing prerequisite logic
const prereqCourseId = 'test-prereq-course-' + Date.now();
const dependentCourseId = 'test-dependent-course-' + Date.now();

test.before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, async () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      rootUrl = `http://127.0.0.1:${port}`;

      // Create test student user
      await prisma.user.upsert({
        where: { id: testStudentId },
        update: {},
        create: {
          id: testStudentId,
          email: `${testStudentId}@example.com`,
          name: 'Học sinh kiểm thử M2',
          role: 'student',
        },
      });

      // Create Prerequisite Course with 2 lessons
      await prisma.course.create({
        data: {
          id: prereqCourseId,
          title: 'Khóa học Nền tảng (Test)',
          description: 'Khóa tiên quyết mẫu',
          level: 'Cơ bản',
          category: 'Ngữ pháp',
          status: 'published',
          teacher: 'Giảng viên Test',
          lessonsCount: 2,
          lessons: {
            create: [
              { id: 1, title: 'Bài 1: Giới thiệu', minutes: 15, orderIndex: 1 },
              { id: 2, title: 'Bài 2: Thực hành', minutes: 20, orderIndex: 2 },
            ],
          },
        },
      });

      // Create Dependent Course requiring the Prerequisite Course
      await prisma.course.create({
        data: {
          id: dependentCourseId,
          title: 'Khóa học Nâng cao (Test)',
          description: 'Yêu cầu hoàn thành khóa nền tảng',
          level: 'Nâng cao',
          category: 'Ngữ pháp',
          status: 'published',
          teacher: 'Giảng viên Test',
          prerequisiteId: prereqCourseId,
          lessonsCount: 1,
          lessons: {
            create: [
              { id: 1, title: 'Bài 1: Chuyên sâu', minutes: 30, orderIndex: 1 },
            ],
          },
        },
      });

      resolve();
    });
  });
});

test.after(async () => {
  // Cleanup test data
  try {
    await prisma.lessonProgress.deleteMany({ where: { userId: testStudentId } });
    await prisma.enrollment.deleteMany({ where: { userId: testStudentId } });
    await prisma.course.deleteMany({
      where: { id: { in: [prereqCourseId, dependentCourseId] } },
    });
    await prisma.user.deleteMany({ where: { id: testStudentId } });
  } catch (e) {
    // Ignore cleanup errors
  }

  if (server) server.close();
  await prisma.$disconnect();
});

test('1. POST /courses/:id/enroll - Enroll in course without prerequisite should succeed', async () => {
  const res = await fetch(`${baseUrl}/courses/${prereqCourseId}/enroll`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.courseId, prereqCourseId);
  assert.equal(json.data.userId, testStudentId);
});

test('2. GET /me/enrollments - Returns list of enrolled course IDs', async () => {
  const res = await fetch(`${baseUrl}/me/enrollments`, {
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.includes(prereqCourseId));
});

test('3. POST /courses/:id/enroll - Re-enrolling returns 200 already enrolled', async () => {
  const res = await fetch(`${baseUrl}/courses/${prereqCourseId}/enroll`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.alreadyEnrolled, true);
});

test('4. ⚠️ PREREQUISITE CHECK: Enroll in dependent course when 0% completed must return 400 Bad Request', async () => {
  const res = await fetch(`${baseUrl}/courses/${dependentCourseId}/enroll`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 400);
  assert.equal(json.success, false);
  assert.equal(json.message, 'Chưa hoàn thành khóa học tiên quyết');
  assert.equal(json.details.prerequisiteId, prereqCourseId);
  assert.equal(json.details.requiredPercentage, 100);
  assert.equal(json.details.currentPercentage, 0);
});

test('5. POST /courses/:id/lessons/:lessonId/complete - Complete lesson 1 calculates 50% progress', async () => {
  const res = await fetch(`${baseUrl}/courses/${prereqCourseId}/lessons/1/complete`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.lessonId, 1);
  assert.equal(json.data.completedLessons, 1);
  assert.equal(json.data.totalLessons, 2);
  assert.equal(json.data.percentage, 50);
});

test('6. ⚠️ IDEMPOTENT CHECK: Calling complete on lesson 1 again does not duplicate or fail', async () => {
  const res = await fetch(`${baseUrl}/courses/${prereqCourseId}/lessons/1/complete`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.data.completedLessons, 1);
  assert.equal(json.data.percentage, 50);

  // Verify directly in DB that only 1 record exists
  const count = await prisma.lessonProgress.count({
    where: {
      userId: testStudentId,
      courseId: prereqCourseId,
      lessonId: 1,
    },
  });
  assert.equal(count, 1);
});

test('7. ⚠️ PREREQUISITE CHECK: Still fails when only 50% (1/2) completed', async () => {
  const res = await fetch(`${baseUrl}/courses/${dependentCourseId}/enroll`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 400);
  assert.equal(json.message, 'Chưa hoàn thành khóa học tiên quyết');
  assert.equal(json.details.currentPercentage, 50);
});

test('8. Complete lesson 2 to reach 100% completion of prerequisite', async () => {
  const res = await fetch(`${baseUrl}/courses/${prereqCourseId}/lessons/2/complete`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.data.completedLessons, 2);
  assert.equal(json.data.totalLessons, 2);
  assert.equal(json.data.percentage, 100);
});

test('9. ⚠️ PREREQUISITE CHECK: Now 100% completed -> Enrollment in dependent course SUCCEEDS', async () => {
  const res = await fetch(`${baseUrl}/courses/${dependentCourseId}/enroll`, {
    method: 'POST',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.courseId, dependentCourseId);
});

test('10. GET /me/progress - Returns detailed progress across all courses', async () => {
  const res = await fetch(`${baseUrl}/me/progress`, {
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.data.completed[prereqCourseId]);
  assert.deepEqual(json.data.completed[prereqCourseId], [1, 2]);
  assert.equal(json.data.percentages[prereqCourseId], 100);
});

test('11. ⚠️ UNENROLL & PROGRESS PRESERVATION: DELETE /courses/:id/unenroll preserves learning history', async () => {
  // Unenroll from prereq course
  const res = await fetch(`${baseUrl}/courses/${prereqCourseId}/unenroll`, {
    method: 'DELETE',
    headers: testHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);

  // Verify enrollment is removed
  const enrollmentsRes = await fetch(`${baseUrl}/me/enrollments`, {
    headers: testHeaders,
  });
  const enrollmentsJson = await enrollmentsRes.json();
  assert.ok(!enrollmentsJson.data.includes(prereqCourseId));

  // Verify progress is STILL INTACT (preserved)
  const progressRes = await fetch(`${baseUrl}/me/progress`, {
    headers: testHeaders,
  });
  const progressJson = await progressRes.json();
  assert.deepEqual(progressJson.data.completed[prereqCourseId], [1, 2]);
  assert.equal(progressJson.data.percentages[prereqCourseId], 100);
});

test('12. Root URL compatibility: Both /courses/... and /api/courses/... work', async () => {
  // Call root without /api prefix
  const res = await fetch(`${rootUrl}/me/enrollments`, {
    headers: testHeaders,
  });
  assert.equal(res.status, 200);
});

test('13. 🎓 PLACEMENT EXEMPTION: Student with B1/B2 level bypasses prerequisite and enrolls successfully', async () => {
  const b2StudentId = `b2-student-${Date.now()}`;
  await prisma.user.create({
    data: {
      id: b2StudentId,
      name: 'Học viên B2 Nâng cao',
      email: `${b2StudentId}@example.com`,
      role: 'student',
      level: 'B2',
    },
  });

  const b2Headers = {
    'Content-Type': 'application/json',
    'x-user-id': b2StudentId,
    'x-user-role': 'student',
  };

  // Dependent course requires prereqCourseId which is 0% completed for b2Student
  const res = await fetch(`${baseUrl}/courses/${dependentCourseId}/enroll`, {
    method: 'POST',
    headers: b2Headers,
  });
  const json = await res.json();

  assert.equal(res.status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.courseId, dependentCourseId);

  // Cleanup
  await prisma.enrollment.deleteMany({ where: { userId: b2StudentId } });
  await prisma.user.deleteMany({ where: { id: b2StudentId } });
});
