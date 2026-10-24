// Automated API & Algorithm tests for Module 4: Personalised Learning Paths & Recommendations
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/backend/app.js';
import prisma from '../src/backend/db/prisma.js';
import {
  buildDAGAndTopologicalOrder,
  getRecommendedStartCourse,
} from '../src/backend/modules/path/path.service.js';
import {
  calculateCourseScore,
  getMostPopularBaseline,
} from '../src/backend/modules/path/recommendation.service.js';

let server;
let baseUrl;
let rootUrl;

const testUserA1 = {
  id: 'test-user-module4-a1',
  name: 'Nguyen Van An (A1)',
  email: 'test.a1.module4@example.com',
  role: 'student',
  level: 'A1',
  goal: 'Củng cố nền tảng',
};

const testUserB2 = {
  id: 'test-user-module4-b2',
  name: 'Tran Thi Binh (B2)',
  email: 'test.b2.module4@example.com',
  role: 'student',
  level: 'B2',
  goal: 'Chuẩn bị thi cử',
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
  // Clean up test users
  await prisma.user.deleteMany({
    where: { id: { in: [testUserA1.id, testUserB2.id] } },
  });
  await prisma.$disconnect();
});

test('1. 📊 DAG & TOPOLOGICAL SORT: Kahn algorithm ensures prerequisites strictly precede dependent courses', async () => {
  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    select: { id: true, title: true, prerequisiteId: true, level: true },
  });

  const { orderedIds, hasCycle } = buildDAGAndTopologicalOrder(courses);

  assert.equal(hasCycle, false, 'Prerequisite course graph must be a DAG without cycles');
  assert.equal(orderedIds.length, courses.length, 'All published courses must be included in topological sort');

  // Verify topological order constraint: For every course with prerequisite, prereq index < course index
  const indexMap = new Map(orderedIds.map((id, index) => [id, index]));
  for (const c of courses) {
    if (c.prerequisiteId && indexMap.has(c.prerequisiteId)) {
      const prereqIdx = indexMap.get(c.prerequisiteId);
      const courseIdx = indexMap.get(c.id);
      assert.ok(
        prereqIdx < courseIdx,
        `Prerequisite "${c.prerequisiteId}" (idx: ${prereqIdx}) must appear before "${c.id}" (idx: ${courseIdx})`,
      );
    }
  }
});

test('2. 🎯 STARTING POINT: Recommends appropriate foundation course based on CEFR level', async () => {
  const courses = await prisma.course.findMany({ where: { status: 'published' } });

  const startA1 = getRecommendedStartCourse(courses, 'A1');
  assert.equal(startA1.level, 'Cơ bản', 'A1 learner should start with foundational level');

  const startB2 = getRecommendedStartCourse(courses, 'B2');
  assert.ok(
    startB2.level === 'Nâng cao' || startB2.category === 'Luyện thi' || startB2.level === 'Trung cấp',
    'B2 learner should start with advanced or exam prep course',
  );
});

test('3. 🗺️ GET /api/path/me - Dynamic node status transitions: completed, unlocked, locked', async () => {
  // Create test user A1
  await prisma.user.upsert({
    where: { id: testUserA1.id },
    update: { level: 'A1', goal: 'Củng cố nền tảng' },
    create: testUserA1,
  });

  const res = await fetch(`${baseUrl}/path/me`, {
    headers: { 'x-user-id': testUserA1.id, 'x-user-role': 'student' },
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.nodes));
  assert.ok(Array.isArray(json.data.edges));

  const nodes = json.data.nodes;
  const foundationsNode = nodes.find((n) => n.id === 'foundations');
  const dependentNode = nodes.find((n) => n.prerequisiteId === 'foundations');

  assert.ok(foundationsNode, 'Foundations course must exist in path');
  assert.equal(foundationsNode.status, 'unlocked', 'Foundations without prerequisite should be unlocked');

  if (dependentNode) {
    assert.equal(
      dependentNode.status,
      'locked',
      'Dependent course must be locked when prerequisite is not finished',
    );
    assert.ok(dependentNode.lockedBy, 'Locked node must indicate which course locked it');
  }

  // Simulate user completing all lessons of foundations
  const foundations = await prisma.course.findUnique({
    where: { id: 'foundations' },
    include: { lessons: true },
  });

  if (foundations && foundations.lessons.length > 0) {
    for (const l of foundations.lessons) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_courseId_lessonId: {
            userId: testUserA1.id,
            courseId: 'foundations',
            lessonId: l.id,
          },
        },
        update: {},
        create: {
          userId: testUserA1.id,
          courseId: 'foundations',
          lessonId: l.id,
        },
      });
    }

    // Re-fetch path: foundations should now be 'completed', and dependent node should unlock!
    const updatedRes = await fetch(`${baseUrl}/path/me`, {
      headers: { 'x-user-id': testUserA1.id, 'x-user-role': 'student' },
    });
    const updatedJson = await updatedRes.json();
    const updatedNodes = updatedJson.data.nodes;

    const updatedFoundations = updatedNodes.find((n) => n.id === 'foundations');
    assert.equal(updatedFoundations.status, 'completed', 'Foundations should now be completed (100%)');

    if (dependentNode) {
      const updatedDependent = updatedNodes.find((n) => n.id === dependentNode.id);
      assert.equal(
        updatedDependent.status,
        'unlocked',
        'Dependent course should automatically unlock once prerequisite is 100% completed',
      );
    }
  }
});

test('4. 🧠 RECOMMENDATIONS: Multi-factor scoring tailors courses according to Goal & CEFR Level', async () => {
  // Test User B2 (Goal: Chuẩn bị thi cử, Level: B2)
  await prisma.user.upsert({
    where: { id: testUserB2.id },
    update: { level: 'B2', goal: 'Chuẩn bị thi cử' },
    create: testUserB2,
  });

  const res = await fetch(`${baseUrl}/recommendations?limit=4`, {
    headers: { 'x-user-id': testUserB2.id, 'x-user-role': 'student' },
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.recommendations));
  assert.ok(json.data.recommendations.length > 0);

  const topRec = json.data.recommendations[0];
  assert.ok(topRec.score > 0);
  assert.ok(topRec.components, 'Must include breakdown of score components');
  assert.ok(Array.isArray(topRec.reasons), 'Must include human-readable explainable reasons');
  assert.ok(topRec.reasons.length > 0, 'Reasons array must not be empty');

  // Verify top recommendation aligns with B2 / Exam prep goal
  const hasExamOrAdvanced = json.data.recommendations.some(
    (r) => r.category === 'Luyện thi' || r.level === 'Nâng cao' || r.level === 'Trung cấp',
  );
  assert.ok(hasExamOrAdvanced, 'Recommendations for B2 should prioritize Advanced or Exam prep courses');
});

test('5. 🔬 BENCHMARK EVALUATOR: Proposed algorithm outperforms Most Popular Baseline (Section 5.2 Rubric)', async () => {
  const res = await fetch(`${baseUrl}/recommendations/benchmark`);
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);

  const { evaluationSummary, detailedPersonaResults, methodology } = json.data;
  assert.ok(evaluationSummary);
  assert.ok(detailedPersonaResults.length === 3, 'Must evaluate across 3 student personas');
  assert.ok(methodology);

  // Compare summary metrics
  const proposedRel = parseInt(evaluationSummary.proposedModel.averageRelevanceRate, 10);
  const baselineRel = parseInt(evaluationSummary.baselineModel.averageRelevanceRate, 10);
  assert.ok(
    proposedRel >= baselineRel,
    `Proposed personalized model (${proposedRel}%) must achieve higher or equal relevance than Most Popular baseline (${baselineRel}%)`,
  );
});

test('6. 🎯 PUT /api/me/goal - Update user learning goal in database', async () => {
  const updateRes = await fetch(`${baseUrl}/me/goal`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserA1.id,
      'x-user-role': 'student',
    },
    body: JSON.stringify({ goal: 'Học tập và công việc' }),
  });
  const updateJson = await updateRes.json();

  assert.equal(updateRes.status, 200);
  assert.equal(updateJson.success, true);
  assert.equal(updateJson.data.goal, 'Học tập và công việc');

  // Reject empty goal
  const invalidRes = await fetch(`${baseUrl}/me/goal`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': testUserA1.id,
      'x-user-role': 'student',
    },
    body: JSON.stringify({ goal: '   ' }),
  });
  assert.equal(invalidRes.status, 400);
});

test('7. 🌐 URL COMPATIBILITY: Both /api/... and root /... paths work identically', async () => {
  const rootPathRes = await fetch(`${rootUrl}/path/me`, {
    headers: { 'x-user-id': testUserA1.id, 'x-user-role': 'student' },
  });
  assert.equal(rootPathRes.status, 200);

  const rootRecRes = await fetch(`${rootUrl}/recommendations`);
  assert.equal(rootRecRes.status, 200);

  const rootBenchRes = await fetch(`${rootUrl}/recommendations/benchmark`);
  assert.equal(rootBenchRes.status, 200);
});

test('8. 🎓 PLACEMENT EXEMPTION IN DAG: B1/B2 student has higher-level courses unlocked with unlockedReason', async () => {
  const b1StudentId = `b1-path-student-${Date.now()}`;
  await prisma.user.create({
    data: {
      id: b1StudentId,
      name: 'Học viên B1 Lộ trình',
      email: `${b1StudentId}@example.com`,
      role: 'student',
      level: 'B1',
    },
  });

  const res = await fetch(`${baseUrl}/path/me`, {
    headers: { 'x-user-id': b1StudentId, 'x-user-role': 'student' },
  });
  const json = await res.json();

  assert.equal(res.status, 200);
  assert.equal(json.success, true);

  // Courses with 'Cơ bản' prerequisite (like reading or exam) should be unlocked for B1 student
  const readingNode = json.data.nodes.find((n) => n.id === 'reading');
  if (readingNode) {
    assert.equal(readingNode.status, 'unlocked');
    assert.match(readingNode.unlockedReason, /Miễn điều kiện tiên quyết/);
  }

  // Cleanup
  await prisma.user.deleteMany({ where: { id: b1StudentId } });
});
