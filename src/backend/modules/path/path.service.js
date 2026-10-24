// Learning Path & Topological Sort Service (Business Logic Layer)
// Module 4: Personalised Learning Paths & Recommendations (DAG & Kahn's Algorithm)

import prisma from '../../db/prisma.js';

/**
 * Builds a Directed Acyclic Graph (DAG) and computes Topological Order
 * using Kahn's Algorithm (BFS based in-degree processing)
 * @param {Array} courses - List of courses with id, prerequisiteId, level, etc.
 * @returns {Object} { orderedIds: string[], graph: Map, inDegrees: Map, hasCycle: boolean }
 */
export function buildDAGAndTopologicalOrder(courses) {
  const inDegrees = new Map();
  const adjList = new Map(); // prereq -> dependent courses

  // Initialize graph nodes
  for (const c of courses) {
    inDegrees.set(c.id, 0);
    adjList.set(c.id, []);
  }

  // Build edges: prerequisite -> dependent
  for (const c of courses) {
    if (c.prerequisiteId && inDegrees.has(c.prerequisiteId)) {
      adjList.get(c.prerequisiteId).push(c.id);
      inDegrees.set(c.id, (inDegrees.get(c.id) || 0) + 1);
    }
  }

  // Kahn's algorithm: queue nodes with in-degree = 0
  const queue = [];
  for (const [id, deg] of inDegrees.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  // Sort initial 0 in-degree nodes by foundational levels first (Cơ bản -> Trung cấp -> Nâng cao)
  const levelPriority = { 'Cơ bản': 1, 'Trung cấp': 2, 'Nâng cao': 3 };
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  queue.sort((a, b) => {
    const la = levelPriority[courseMap.get(a)?.level] || 2;
    const lb = levelPriority[courseMap.get(b)?.level] || 2;
    return la - lb;
  });

  const orderedIds = [];
  const tempInDegrees = new Map(inDegrees);

  while (queue.length > 0) {
    const u = queue.shift();
    orderedIds.push(u);

    const neighbors = adjList.get(u) || [];
    for (const v of neighbors) {
      const newDeg = tempInDegrees.get(v) - 1;
      tempInDegrees.set(v, newDeg);
      if (newDeg === 0) {
        queue.push(v);
      }
    }
  }

  const hasCycle = orderedIds.length < courses.length;

  // Append any cycle / unvisited nodes to ensure complete representation
  if (hasCycle) {
    for (const c of courses) {
      if (!orderedIds.includes(c.id)) {
        orderedIds.push(c.id);
      }
    }
  }

  return { orderedIds, adjList, inDegrees, hasCycle };
}

/**
 * Determines starting course recommendation based on CEFR level
 */
export function getRecommendedStartCourse(courses, cefrLevel = 'A1') {
  const normLevel = (cefrLevel || 'A1').toUpperCase();
  const published = courses.filter((c) => c.status === 'published');
  const available = published.filter((c) => !c.prerequisiteId);

  if (normLevel === 'B2') {
    return (
      available.find((c) => c.level === 'Nâng cao' || c.category === 'Luyện thi') ||
      published.find((c) => c.level === 'Nâng cao' || c.category === 'Luyện thi') ||
      available[0]
    );
  }
  if (normLevel === 'B1') {
    return (
      available.find((c) => c.level === 'Trung cấp') ||
      published.find((c) => c.level === 'Trung cấp') ||
      available[0]
    );
  }
  // A1 or A2
  return available.find((c) => c.level === 'Cơ bản') || available[0];
}

/**
 * Fetches and builds personalized learning path for the user
 * Marks node status: 'completed' | 'unlocked' | 'locked'
 */
export async function getPersonalizedLearningPath(userId) {
  // 1. Fetch user profile
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, level: true, goal: true },
    });
  }

  const userLevel = (user?.level || 'A1').toUpperCase();
  const userGoal = user?.goal || 'Giao tiếp';

  // 2. Fetch all published courses with lessons count and prerequisites
  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    include: {
      prerequisite: {
        select: { id: true, title: true, level: true },
      },
      lessons: {
        select: { id: true },
      },
    },
    orderBy: { hours: 'asc' },
  });

  if (courses.length === 0) {
    return {
      user: { id: userId, level: userLevel, goal: userGoal },
      nodes: [],
      edges: [],
      summary: { total: 0, completed: 0, unlocked: 0, locked: 0 },
    };
  }

  // 3. Fetch user's completed lessons & enrollments
  let completedLessonMap = new Map(); // courseId -> Set of completed lessonIds
  let enrolledCourseSet = new Set();

  if (userId) {
    const progresses = await prisma.lessonProgress.findMany({
      where: { userId },
      select: { courseId: true, lessonId: true },
    });
    for (const p of progresses) {
      if (!completedLessonMap.has(p.courseId)) {
        completedLessonMap.set(p.courseId, new Set());
      }
      completedLessonMap.get(p.courseId).add(p.lessonId);
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    enrolledCourseSet = new Set(enrollments.map((e) => e.courseId));
  }

  // 4. Run Topological Sort on DAG
  const { orderedIds } = buildDAGAndTopologicalOrder(courses);
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Check completion for each course
  const isCourseCompleted = (courseId) => {
    const c = courseMap.get(courseId);
    if (!c || c.lessons.length === 0) return false;
    const completedSet = completedLessonMap.get(courseId);
    return completedSet ? completedSet.size >= c.lessons.length : false;
  };

  const recommendedStart = getRecommendedStartCourse(courses, userLevel);

  // 5. Construct classified nodes in Topological Order
  const nodes = [];
  const edges = [];
  let completedCount = 0;
  let unlockedCount = 0;
  let lockedCount = 0;

  for (const id of orderedIds) {
    const c = courseMap.get(id);
    if (!c) continue;

    const totalLessons = c.lessons.length;
    const completedCountForCourse = completedLessonMap.get(id)?.size || 0;
    const progressPercent =
      totalLessons > 0 ? Math.round((completedCountForCourse / totalLessons) * 100) : 0;
    const completed = totalLessons > 0 && completedCountForCourse >= totalLessons;

    const prereqCourse = c.prerequisiteId ? courseMap.get(c.prerequisiteId) : null;
    const isExempt = c.prerequisiteId
      ? userLevel === 'B2' || (userLevel === 'B1' && (!prereqCourse?.level || prereqCourse?.level === 'Cơ bản'))
      : false;

    let status = 'locked';
    let lockedBy = null;
    let unlockedReason = null;

    if (completed) {
      status = 'completed';
      completedCount++;
    } else if (!c.prerequisiteId || isCourseCompleted(c.prerequisiteId) || isExempt) {
      status = 'unlocked';
      unlockedCount++;
      if (isExempt && !isCourseCompleted(c.prerequisiteId)) {
        unlockedReason = `Miễn điều kiện tiên quyết nhờ đạt trình độ ${userLevel} qua bài kiểm tra đầu vào`;
      }
    } else {
      status = 'locked';
      lockedCount++;
      lockedBy = {
        id: c.prerequisiteId,
        title: prereqCourse?.title || c.prerequisite?.title || 'Khóa học tiên quyết',
        level: prereqCourse?.level || c.prerequisite?.level || '',
      };
    }

    const isStart = recommendedStart?.id === c.id;

    nodes.push({
      id: c.id,
      title: c.title,
      description: c.description,
      level: c.level,
      category: c.category,
      hours: c.hours,
      lessonsCount: totalLessons,
      progress: progressPercent,
      status, // 'completed' | 'unlocked' | 'locked'
      unlockedReason,
      isEnrolled: enrolledCourseSet.has(c.id),
      prerequisiteId: c.prerequisiteId,
      lockedBy,
      isRecommendedStart: isStart,
      art: c.art,
      color: c.color,
    });

    if (c.prerequisiteId) {
      edges.push({
        from: c.prerequisiteId,
        to: c.id,
      });
    }
  }

  return {
    user: {
      id: userId || null,
      name: user?.name || 'Học viên',
      level: userLevel,
      goal: userGoal,
    },
    nodes,
    edges,
    summary: {
      totalCourses: nodes.length,
      completedCount,
      unlockedCount,
      lockedCount,
      overallProgress:
        nodes.length > 0 ? Math.round((completedCount / nodes.length) * 100) : 0,
    },
  };
}
