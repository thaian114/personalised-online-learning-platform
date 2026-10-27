// Automated API tests for Module 3: Assessments & Quizzes
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/backend/app.js';
import prisma from '../src/backend/db/prisma.js';

let server;
let baseUrl;

const testStudentId = 'test-student-m3-' + Date.now();
const testInstructorId = 'test-instructor-m3-' + Date.now();

const studentHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': testStudentId,
  'x-user-role': 'student',
};

const instructorHeaders = {
  'Content-Type': 'application/json',
  'x-user-id': testInstructorId,
  'x-user-role': 'instructor',
};

test.before(async () => {
  return new Promise((resolve) => {
    server = app.listen(0, async () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;

      // Create test users
      await prisma.user.upsert({
        where: { id: testStudentId },
        update: {},
        create: {
          id: testStudentId,
          email: `${testStudentId}@example.com`,
          name: 'Học sinh kiểm thử M3',
          role: 'student',
        },
      });

      await prisma.user.upsert({
        where: { id: testInstructorId },
        update: {},
        create: {
          id: testInstructorId,
          email: `${testInstructorId}@example.com`,
          name: 'Giảng viên kiểm thử M3',
          role: 'instructor',
        },
      });

      resolve();
    });
  });
});

test.after(async () => {
  try {
    await prisma.quizResult.deleteMany({ where: { userId: testStudentId } });
    await prisma.lessonProgress.deleteMany({ where: { userId: testStudentId } });
    await prisma.placementResult.deleteMany({ where: { userId: testStudentId } });
    await prisma.submission.deleteMany({ where: { userId: testStudentId } });
    await prisma.user.deleteMany({
      where: { id: { in: [testStudentId, testInstructorId] } },
    });
  } catch (e) {
    // Ignore cleanup errors
  }

  if (server) server.close();
  await prisma.$disconnect();
});

// ==================== LESSON QUIZ TESTS ====================

test('1. 🚨 SECURITY: GET /courses/:id/lessons/:lessonId/quiz strips answer and explanation', async () => {
  const res = await fetch(`${baseUrl}/courses/foundations/lessons/1/quiz`);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.questions));
  assert.ok(json.data.questions.length > 0);

  // CRITICAL CHECK: Neither answer nor explanation must be present in any question
  for (const q of json.data.questions) {
    assert.equal(q.answer, undefined, `Question ${q.id} leaks 'answer'!`);
    assert.equal(q.explanation, undefined, `Question ${q.id} leaks 'explanation'!`);
    assert.ok(q.prompt, 'Prompt must exist');
    assert.ok(Array.isArray(q.options), 'Options must be an array');
  }
});

test('2. POST /courses/:id/lessons/:lessonId/quiz/submit - Grade quiz and return explanations', async () => {
  // Ground truth: q1 answer is 1, q2 is 2, q3 is 1, q4 is 2, q5 is 1, q6 is 2, q7 is 1, q8 is 2, q9 is 2, q10 is 1
  const answers = {
    q1: 1, // correct
    q2: 2, // correct
    q3: 1, // correct
    q4: 2, // correct
    q5: 1, // correct
    q6: 2, // correct
    q7: 1, // correct
    q8: 2, // correct
    q9: 0, // wrong (correct is 2)
    q10: 0, // wrong (correct is 1)
  }; // 8 correct out of 10 = 80%, score 8, passed

  const res = await fetch(`${baseUrl}/courses/foundations/lessons/1/quiz/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ answers }),
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.correctCount, 8);
  assert.equal(json.data.totalQuestions, 10);
  assert.equal(json.data.percentage, 80);
  assert.equal(json.data.score, 8);
  assert.equal(json.data.passed, true);

  // Verify details now include explanation and correct answer
  const detailQ1 = json.data.details.find((d) => d.questionId === 'q1');
  assert.equal(detailQ1.isCorrect, true);
  assert.equal(detailQ1.correctAnswer, 1);
  assert.ok(detailQ1.explanation.length > 0);

  // Verify saved in QuizResult table
  const saved = await prisma.quizResult.findUnique({
    where: {
      userId_courseId_lessonId: {
        userId: testStudentId,
        courseId: 'foundations',
        lessonId: 1,
      },
    },
  });
  assert.ok(saved);
  assert.equal(saved.score, 8);
});

// ==================== PLACEMENT TEST TESTS ====================

test('3. 🚨 SECURITY: GET /placement/test strips answer and explanation from 20 questions', async () => {
  const res = await fetch(`${baseUrl}/placement/test`);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.totalQuestions, 20);
  assert.equal(json.data.questions.length, 20);

  for (const q of json.data.questions) {
    assert.equal(q.answer, undefined, `Placement question ${q.id} leaks answer!`);
    assert.equal(q.explanation, undefined, `Placement question ${q.id} leaks explanation!`);
  }
});

test('4. POST /placement/submit - Score > 80% classifies student as B2 and updates User table', async () => {
  // Submit 18 correct answers (90% > 80% => B2)
  const answers = {
    q1: 1, q2: 2, q3: 1, q4: 2, q5: 1, q6: 2, q7: 1, q8: 2, q9: 2, q10: 1,
    p11: 2, p12: 1, p13: 3, p14: 0, p15: 1, p16: 2, p17: 2, p18: 1,
    p19: 0, // wrong
    p20: 0, // wrong
  }; // 18/20 = 90%

  const res = await fetch(`${baseUrl}/placement/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ answers }),
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.percentage, 90);
  assert.equal(json.data.level, 'B2');

  // Verify User table was updated with level 'B2'
  const user = await prisma.user.findUnique({ where: { id: testStudentId } });
  assert.equal(user.level, 'B2');
});

test('5. POST /placement/submit - Score < 40% classifies student as A1', async () => {
  // Submit only 2 correct answers (10% < 40% => A1)
  const answers = {
    q1: 1, q2: 2,
  }; // 2/20 = 10%

  const res = await fetch(`${baseUrl}/placement/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify({ answers }),
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.data.percentage, 10);
  assert.equal(json.data.level, 'A1');
});

// ==================== ASSIGNMENT & GRADING TESTS ====================

let createdSubmissionId;

test('6. POST /courses/:id/assignments/:assignmentId/submit - Student submits assignment', async () => {
  const payload = {
    title: 'My Daily Routine Exercise',
    text: 'Every morning I wake up at 6am. I study English and read books before breakfast.',
    filename: 'routine-essay.pdf',
  };

  const res = await fetch(`${baseUrl}/courses/foundations/assignments/asg-foundations-1/submit`, {
    method: 'POST',
    headers: studentHeaders,
    body: JSON.stringify(payload),
  });
  const json = await res.json();

  assert.equal(res.status, 201);
  assert.equal(json.success, true);
  assert.equal(json.data.status, 'pending');
  assert.equal(json.data.userId, testStudentId);
  // Default assignment deadline was 2026-09-28, so current submission is marked late
  assert.equal(json.data.late, true);

  createdSubmissionId = json.data.id;
});

test('7. GET /instructor/submissions - Student role forbidden, Instructor role allowed', async () => {
  // Student trying to view all submissions -> 403 Forbidden
  const studentRes = await fetch(`${baseUrl}/instructor/submissions`, {
    headers: studentHeaders,
  });
  assert.equal(studentRes.status, 403);

  // Instructor allowed -> 200 OK
  const instructorRes = await fetch(`${baseUrl}/instructor/submissions`, {
    headers: instructorHeaders,
  });
  const json = await instructorRes.json();
  assert.equal(instructorRes.status, 200);
  assert.ok(Array.isArray(json.data));
  assert.ok(json.data.some((s) => s.id === createdSubmissionId));
});

test('8. PUT /instructor/submissions/:id/grade - Instructor saves draft and publishes grade', async () => {
  // Test invalid score (> 10) -> 400 Bad Request
  const invalidRes = await fetch(`${baseUrl}/instructor/submissions/${createdSubmissionId}/grade`, {
    method: 'PUT',
    headers: instructorHeaders,
    body: JSON.stringify({ score: 15, feedback: 'Too high' }),
  });
  assert.equal(invalidRes.status, 400);

  // Save Draft Grade (status: 'draft')
  const draftRes = await fetch(`${baseUrl}/instructor/submissions/${createdSubmissionId}/grade`, {
    method: 'PUT',
    headers: instructorHeaders,
    body: JSON.stringify({ score: 8.5, feedback: 'Bản nháp nhận xét', status: 'draft' }),
  });
  const draftJson = await draftRes.json();
  assert.equal(draftRes.status, 200);
  assert.equal(draftJson.data.status, 'draft');
  assert.equal(draftJson.data.draftScore, 8.5);

  // Publish Grade (status: 'graded')
  const gradeRes = await fetch(`${baseUrl}/instructor/submissions/${createdSubmissionId}/grade`, {
    method: 'PUT',
    headers: instructorHeaders,
    body: JSON.stringify({ score: 9.0, feedback: 'Bài viết rất tốt, ngữ pháp chuẩn xác!', status: 'graded' }),
  });
  const gradeJson = await gradeRes.json();
  assert.equal(gradeRes.status, 200);
  assert.equal(gradeJson.data.status, 'graded');
  assert.equal(gradeJson.data.score, 9.0);
  assert.equal(gradeJson.data.feedback, 'Bài viết rất tốt, ngữ pháp chuẩn xác!');
});
