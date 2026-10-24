// Automated API tests for Module 4.6: Admin Management & Course Statistics
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/backend/app.js';
import prisma from '../src/backend/db/prisma.js';

let server;
let baseUrl;
let rootUrl;

const adminHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': 'admin-test-id',
  'x-user-role': 'admin',
};

const studentHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': 'student-test-id',
  'x-user-role': 'student',
};

test.before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      rootUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) server.close();
  await prisma.$disconnect();
});

test('1. 🚨 ROLE AUTHORIZATION: GET /admin/courses/stats rejects unauthenticated and student requests', async () => {
  // Without authentication
  const noAuthRes = await fetch(`${baseUrl}/admin/courses/stats`);
  assert.equal(noAuthRes.status, 401, 'Guest must receive 401 Unauthorized');

  // With student role
  const studentRes = await fetch(`${baseUrl}/admin/courses/stats`, {
    headers: studentHeaders,
  });
  assert.equal(studentRes.status, 403, 'Student must receive 403 Forbidden');
});

test('2. GET /admin/courses/stats - Admin successfully fetches comprehensive platform statistics', async () => {
  const res = await fetch(`${baseUrl}/admin/courses/stats`, {
    headers: adminHeaders,
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.data.overview, 'Must contain overview metrics');

  const { overview, courses, categories, levels } = json.data;

  // Overview metrics verification
  assert.ok(typeof overview.totalCourses === 'number');
  assert.ok(typeof overview.totalLessons === 'number');
  assert.ok(typeof overview.totalUsers === 'number');
  assert.ok(overview.enrollments, 'Must contain enrollment statistics');
  assert.ok(typeof overview.enrollments.total === 'number');
  assert.ok(typeof overview.enrollments.completionRate === 'number');
  assert.ok(typeof overview.enrollments.averageProgress === 'number');

  // Learning outcomes verification
  assert.ok(overview.learningOutcomes, 'Must contain learning outcomes');
  assert.ok(typeof overview.learningOutcomes.totalQuizAttempts === 'number');
  assert.ok(typeof overview.learningOutcomes.averageQuizScore === 'number');

  // Course breakdown verification
  assert.ok(Array.isArray(courses));
  assert.ok(courses.length > 0);
  const sampleCourse = courses[0];
  assert.ok(sampleCourse.id);
  assert.ok(sampleCourse.title);
  assert.ok(typeof sampleCourse.enrolledCount === 'number');
  assert.ok(typeof sampleCourse.completedLearnersCount === 'number');
  assert.ok(typeof sampleCourse.completionRate === 'number');
  assert.ok(typeof sampleCourse.averageProgress === 'number');

  // Distribution breakdowns
  assert.ok(Array.isArray(categories));
  assert.ok(Array.isArray(levels));
});

test('3. 📊 STATS ACCURACY: Verification of course enrollment and completion calculations', async () => {
  const testCourseId = `admin-metric-course-${Date.now()}`;
  const testStudentId = `test-student-${Date.now()}`;

  // Create user
  await prisma.user.create({
    data: {
      id: testStudentId,
      name: 'Admin Metric Test Student',
      email: `${testStudentId}@example.com`,
      role: 'student',
    },
  });

  // Create course with 2 lessons
  await prisma.course.create({
    data: {
      id: testCourseId,
      title: 'Admin Stats Test Course',
      description: 'Test description',
      level: 'Cơ bản',
      category: 'Giao tiếp',
      teacher: 'Giảng viên Test',
      status: 'published',
      lessons: {
        create: [
          { id: 1, title: 'Lesson 1', minutes: 15, orderIndex: 1 },
          { id: 2, title: 'Lesson 2', minutes: 15, orderIndex: 2 },
        ],
      },
    },
  });

  // Enroll student
  await prisma.enrollment.create({
    data: {
      userId: testStudentId,
      courseId: testCourseId,
    },
  });

  // Complete lesson 1 -> 50% progress
  await prisma.lessonProgress.create({
    data: {
      userId: testStudentId,
      courseId: testCourseId,
      lessonId: 1,
    },
  });

  let res = await fetch(`${baseUrl}/admin/courses/stats`, { headers: adminHeaders });
  let json = await res.json();
  let courseStat = json.data.courses.find((c) => c.id === testCourseId);

  assert.ok(courseStat);
  assert.equal(courseStat.enrolledCount, 1);
  assert.equal(courseStat.completedLearnersCount, 0, 'Course not 100% completed yet');
  assert.equal(courseStat.averageProgress, 50, 'Progress should be 50%');
  assert.equal(courseStat.completionRate, 0);

  // Complete lesson 2 -> 100% progress
  await prisma.lessonProgress.create({
    data: {
      userId: testStudentId,
      courseId: testCourseId,
      lessonId: 2,
    },
  });

  res = await fetch(`${baseUrl}/admin/courses/stats`, { headers: adminHeaders });
  json = await res.json();
  courseStat = json.data.courses.find((c) => c.id === testCourseId);

  assert.equal(courseStat.completedLearnersCount, 1, 'Learner has finished 100% of lessons');
  assert.equal(courseStat.completionRate, 100, 'Completion rate should be 100%');
  assert.equal(courseStat.averageProgress, 100);

  // Clean up
  await prisma.course.delete({ where: { id: testCourseId } });
  await prisma.user.delete({ where: { id: testStudentId } });
});

test('4. GET /admin/courses - Admin retrieves list of all courses with stats', async () => {
  const res = await fetch(`${baseUrl}/admin/courses`, { headers: adminHeaders });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(typeof json.count === 'number');
  assert.ok(Array.isArray(json.courses));
});

test('5. PUT /admin/courses/:id/status - Admin toggles course visibility', async () => {
  const toggleCourseId = `admin-toggle-${Date.now()}`;
  await prisma.course.create({
    data: {
      id: toggleCourseId,
      title: 'Course to Toggle Status',
      description: 'Test visibility toggle',
      level: 'Cơ bản',
      category: 'Ngữ pháp',
      teacher: 'Admin Test',
      status: 'published',
      lessonsCount: 1,
    },
  });

  // Admin hides course
  const hideRes = await fetch(`${baseUrl}/admin/courses/${toggleCourseId}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'hidden' }),
  });
  const hideJson = await hideRes.json();
  assert.equal(hideRes.status, 200);
  assert.equal(hideJson.course.status, 'hidden');

  // Verify course is hidden from public list
  const publicRes = await fetch(`${baseUrl}/courses`);
  const publicJson = await publicRes.json();
  assert.equal(publicJson.data.some((c) => c.id === toggleCourseId), false);

  // Admin restores course to published
  const restoreRes = await fetch(`${baseUrl}/admin/courses/${toggleCourseId}/status`, {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ status: 'published' }),
  });
  const restoreJson = await restoreRes.json();
  assert.equal(restoreRes.status, 200);
  assert.equal(restoreJson.course.status, 'published');

  // Clean up
  await prisma.course.deleteMany({ where: { id: toggleCourseId } });
});

test('6. Root URL compatibility: /admin/courses/stats without /api prefix works', async () => {
  const res = await fetch(`${rootUrl}/admin/courses/stats`, { headers: adminHeaders });
  const json = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(json.data.overview);
});
