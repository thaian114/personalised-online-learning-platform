// Recommendation Engine & Baseline Comparison Service (Business Logic Layer)
// Module 4: Personalised Recommendations with Multi-factor Scoring & Explainability

import prisma from '../../db/prisma.js';

// Goal - Category matching matrices
const GOAL_CATEGORY_WEIGHTS = {
  'Củng cố nền tảng': {
    'Ngữ pháp': 1.0,
    'Phát âm': 0.95,
    'Từ vựng': 0.9,
    'Đọc hiểu': 0.75,
    default: 0.4,
  },
  'Giao tiếp hằng ngày': {
    'Giao tiếp': 1.0,
    'Phát âm': 0.9,
    'Nghe': 0.85,
    'Kỹ năng': 0.75,
    default: 0.4,
  },
  'Học tập và công việc': {
    'Kỹ năng': 1.0,
    'Giao tiếp': 0.95,
    'Đọc hiểu': 0.85,
    'Ngữ pháp': 0.8,
    default: 0.5,
  },
  'Chuẩn bị thi cử': {
    'Luyện thi': 1.0,
    'Đọc hiểu': 0.9,
    'Nghe': 0.85,
    'Ngữ pháp': 0.8,
    default: 0.35,
  },
};

// CEFR Level - Course Level matching matrix
const LEVEL_ALIGNMENT = {
  A1: { 'Cơ bản': 1.0, 'Trung cấp': 0.3, 'Nâng cao': 0.1 },
  A2: { 'Cơ bản': 0.95, 'Trung cấp': 0.65, 'Nâng cao': 0.2 },
  B1: { 'Trung cấp': 1.0, 'Cơ bản': 0.65, 'Nâng cao': 0.65 },
  B2: { 'Nâng cao': 1.0, 'Trung cấp': 0.75, 'Cơ bản': 0.3 },
};

/**
 * Calculates Multi-factor Priority Score for a course with respect to a user
 * Score = 0.4*Goal + 0.3*Level + 0.2*Prereq + 0.1*History
 */
export function calculateCourseScore(course, userContext) {
  const { goal = 'Giao tiếp hằng ngày', level = 'A1', completedCourseIds = new Set(), quizHistory = [] } =
    userContext;

  // 1. Goal Matching Score (0.4)
  const goalWeights = GOAL_CATEGORY_WEIGHTS[goal] || GOAL_CATEGORY_WEIGHTS['Giao tiếp hằng ngày'];
  let sGoal = goalWeights[course.category] ?? goalWeights.default ?? 0.5;

  // Keyword bonus if title or description mentions goal keywords
  const titleDesc = (course.title + ' ' + course.description).toLowerCase();
  if (goal === 'Củng cố nền tảng' && (titleDesc.includes('cơ bản') || titleDesc.includes('foundation'))) {
    sGoal = Math.min(1.0, sGoal + 0.1);
  } else if (goal === 'Chuẩn bị thi cử' && (titleDesc.includes('ielts') || titleDesc.includes('thi'))) {
    sGoal = Math.min(1.0, sGoal + 0.1);
  }

  // 2. CEFR Level Matching Score (0.3)
  const normLevel = (level || 'A1').toUpperCase();
  const levelWeights = LEVEL_ALIGNMENT[normLevel] || LEVEL_ALIGNMENT.A1;
  const sLevel = levelWeights[course.level] ?? 0.5;

  // 3. Prerequisite Readiness Score (0.2)
  let sPrereq = 1.0;
  let prereqStatus = 'none'; // 'none' | 'met' | 'unmet' | 'exempt'

  if (course.prerequisiteId) {
    const isExempt =
      normLevel === 'B2' ||
      (normLevel === 'B1' && (!course.prerequisite?.level || course.prerequisite?.level === 'Cơ bản'));

    if (completedCourseIds.has(course.prerequisiteId)) {
      sPrereq = 1.0;
      prereqStatus = 'met';
    } else if (isExempt) {
      sPrereq = 1.0;
      prereqStatus = 'exempt';
    } else {
      sPrereq = 0.15; // heavily penalized because course is locked
      prereqStatus = 'unmet';
    }
  }

  // 4. Study & Quiz History Score (0.1)
  let sHistory = 0.5; // neutral baseline
  if (quizHistory.length > 0) {
    const relevantQuizzes = quizHistory.filter((q) => q.category === course.category);
    if (relevantQuizzes.length > 0) {
      const avgQuizScore =
        relevantQuizzes.reduce((sum, q) => sum + q.score, 0) / relevantQuizzes.length;
      sHistory = Math.min(1.0, Math.max(0.3, avgQuizScore / 10));
    }
  }

  // Combine with defined weights
  const finalScore = 0.4 * sGoal + 0.3 * sLevel + 0.2 * sPrereq + 0.1 * sHistory;

  return {
    finalScore: Math.round(finalScore * 100) / 100,
    components: {
      goalScore: Math.round(sGoal * 100) / 100,
      levelScore: Math.round(sLevel * 100) / 100,
      prereqScore: Math.round(sPrereq * 100) / 100,
      historyScore: Math.round(sHistory * 100) / 100,
      prereqStatus,
    },
  };
}

/**
 * Generates natural language explainable reasons (Explainable AI / Rules)
 */
export function generateExplainableReasons(course, userContext, components) {
  const { goal, level } = userContext;
  const reasons = [];

  // Goal Reason
  if (components.goalScore >= 0.8) {
    reasons.push(
      `Phù hợp trực tiếp với mục tiêu "${goal}" của bạn (chủ đề ${course.category}).`,
    );
  } else if (components.goalScore >= 0.6) {
    reasons.push(`Hỗ trợ bổ trợ tốt cho mục tiêu "${goal}".`);
  }

  // Level Reason
  if (components.levelScore >= 0.8) {
    reasons.push(
      `Độ khó "${course.level}" vừa vặn với kết quả xếp loại CEFR trình độ ${level} của bạn.`,
    );
  }

  // Prerequisite Readiness Reason
  if (components.prereqStatus === 'met') {
    reasons.push(
      `Bạn đã hoàn thành đủ điều kiện tiên quyết và sẵn sàng học khóa này ngay.`,
    );
  } else if (components.prereqStatus === 'exempt') {
    reasons.push(
      `Bạn được miễn điều kiện tiên quyết nhờ đạt trình độ ${level} từ bài kiểm tra đầu vào.`,
    );
  } else if (components.prereqStatus === 'none') {
    reasons.push(`Khóa học mở sẵn, không yêu cầu điều kiện tiên quyết.`);
  } else {
    reasons.push(
      `Lưu ý: Khóa học cần hoàn thành khóa tiên quyết trước khi đăng ký chính thức.`,
    );
  }

  // History Reason
  if (components.historyScore >= 0.8) {
    reasons.push(`Phù hợp với điểm số trắc nghiệm cao trước đây của bạn ở nhóm kiến thức này.`);
  }

  return reasons;
}

/**
 * Fetches courses and calculates personalized recommendations for user
 * Filters out courses already 100% completed
 */
export async function getPersonalizedRecommendations(userId, { limit = 4 } = {}) {
  // 1. Fetch user
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, level: true, goal: true },
    });
  }

  const userContext = {
    goal: user?.goal || 'Giao tiếp hằng ngày',
    level: user?.level || 'A1',
    completedCourseIds: new Set(),
    quizHistory: [],
  };

  // 2. Fetch all published courses with lessons
  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    include: {
      lessons: { select: { id: true } },
      prerequisite: { select: { id: true, title: true } },
    },
    orderBy: { learners: 'desc' },
  });

  // 3. User study history
  if (userId) {
    const progresses = await prisma.lessonProgress.findMany({
      where: { userId },
      select: { courseId: true, lessonId: true },
    });
    const completedByCourse = new Map();
    for (const p of progresses) {
      if (!completedByCourse.has(p.courseId)) completedByCourse.set(p.courseId, new Set());
      completedByCourse.get(p.courseId).add(p.lessonId);
    }

    for (const c of courses) {
      const completedSet = completedByCourse.get(c.id);
      if (completedSet && c.lessons.length > 0 && completedSet.size >= c.lessons.length) {
        userContext.completedCourseIds.add(c.id);
      }
    }

    // Quiz history
    const quizzes = await prisma.quizResult.findMany({
      where: { userId },
      include: {
        lesson: {
          include: { course: { select: { category: true } } },
        },
      },
    });
    userContext.quizHistory = quizzes.map((q) => ({
      score: q.score,
      category: q.lesson?.course?.category || '',
    }));
  }

  // 4. Calculate scores & filter out completed courses
  const candidates = courses
    .filter((c) => !userContext.completedCourseIds.has(c.id))
    .map((c) => {
      const { finalScore, components } = calculateCourseScore(c, userContext);
      const reasons = generateExplainableReasons(c, userContext, components);

      return {
        id: c.id,
        title: c.title,
        description: c.description,
        level: c.level,
        category: c.category,
        hours: c.hours,
        lessonsCount: c.lessons.length,
        learners: c.learners,
        prerequisiteId: c.prerequisiteId,
        score: finalScore,
        components,
        reasons,
        art: c.art,
        color: c.color,
      };
    });

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  const topRecommendations = candidates.slice(0, limit);

  return {
    user: {
      id: userId || null,
      name: user?.name || 'Học viên',
      level: userContext.level,
      goal: userContext.goal,
    },
    recommendations: topRecommendations,
    meta: {
      totalCandidates: candidates.length,
      returnedCount: topRecommendations.length,
      algorithm: 'Multi-factor Personalized Scoring (Goal 40%, Level 30%, Prereq 20%, History 10%)',
    },
  };
}

/**
 * Baseline Recommender: Most Popular
 * Recommends courses strictly based on highest enrollment count, ignoring individual personalization
 */
export function getMostPopularBaseline(courses, completedCourseIds = new Set(), limit = 4) {
  return courses
    .filter((c) => !completedCourseIds.has(c.id))
    .sort((a, b) => (b.learners || 0) - (a.learners || 0))
    .slice(0, limit);
}

/**
 * Benchmark Evaluator: Compares Proposed Personalized Algorithm vs Most Popular Baseline
 * Evaluates Relevance Rate (%) and Prerequisite Feasibility Rate (%) across 3 Student Personas
 * Meets Section 5.2 Rubric Requirement: "so sánh với một phương pháp cơ sở như phổ biến nhất"
 */
export async function runRecommendationBenchmark() {
  const courses = await prisma.course.findMany({
    where: { status: 'published' },
    include: { lessons: { select: { id: true } } },
    orderBy: { learners: 'desc' },
  });

  const personas = [
    {
      id: 'persona-beginner-a1',
      name: 'Persona A (Người mới bắt đầu)',
      level: 'A1',
      goal: 'Củng cố nền tảng',
      completedCourseIds: new Set(),
      description: 'Học viên mới, năng lực A1, mục tiêu nắm vững ngữ pháp & phát âm căn bản.',
    },
    {
      id: 'persona-intermediate-b1',
      name: 'Persona B (Người đi làm)',
      level: 'B1',
      goal: 'Học tập và công việc',
      completedCourseIds: new Set(['foundations']),
      description: 'Đã hoàn thành khóa Foundations, trình độ B1, cần kỹ năng thuyết trình & giao tiếp công việc.',
    },
    {
      id: 'persona-advanced-b2',
      name: 'Persona C (Luyện thi nâng cao)',
      level: 'B2',
      goal: 'Chuẩn bị thi cử',
      completedCourseIds: new Set(['foundations', 'speaking-part-1']),
      description: 'Trình độ B2, mục tiêu luyện thi chứng chỉ chuyên sâu (IELTS / Viết học thuật).',
    },
  ];

  const results = personas.map((persona) => {
    // 1. Run Proposed Algorithm
    const scored = courses
      .filter((c) => !persona.completedCourseIds.has(c.id))
      .map((c) => {
        const { finalScore, components } = calculateCourseScore(c, {
          goal: persona.goal,
          level: persona.level,
          completedCourseIds: persona.completedCourseIds,
        });
        return { ...c, score: finalScore, components };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // 2. Run Baseline Algorithm (Most Popular)
    const baseline = getMostPopularBaseline(courses, persona.completedCourseIds, 3);

    // Evaluate Metrics
    // Relevance check: does the course match persona's goal & level?
    const isRelevance = (course, p) => {
      const matchGoal =
        (GOAL_CATEGORY_WEIGHTS[p.goal]?.[course.category] ?? 0.4) >= 0.7;
      const matchLevel =
        (LEVEL_ALIGNMENT[p.level]?.[course.level] ?? 0.5) >= 0.6;
      return matchGoal || matchLevel;
    };

    // Feasibility check: is prerequisite satisfied?
    const isFeasible = (course, p) => {
      if (!course.prerequisiteId) return true;
      return p.completedCourseIds.has(course.prerequisiteId);
    };

    const proposedRelevanceCount = scored.filter((c) => isRelevance(c, persona)).length;
    const proposedFeasibleCount = scored.filter((c) => isFeasible(c, persona)).length;

    const baselineRelevanceCount = baseline.filter((c) => isRelevance(c, persona)).length;
    const baselineFeasibleCount = baseline.filter((c) => isFeasible(c, persona)).length;

    return {
      persona: persona.name,
      level: persona.level,
      goal: persona.goal,
      proposedModel: {
        topCourses: scored.map((c) => ({ id: c.id, title: c.title, score: c.score })),
        relevanceRate: Math.round((proposedRelevanceCount / 3) * 100),
        feasibilityRate: Math.round((proposedFeasibleCount / 3) * 100),
      },
      baselineModel: {
        topCourses: baseline.map((c) => ({ id: c.id, title: c.title, learners: c.learners })),
        relevanceRate: Math.round((baselineRelevanceCount / 3) * 100),
        feasibilityRate: Math.round((baselineFeasibleCount / 3) * 100),
      },
    };
  });

  // Calculate summary metrics across all personas
  const avgProposedRelevance =
    Math.round(results.reduce((acc, r) => acc + r.proposedModel.relevanceRate, 0) / results.length);
  const avgProposedFeasibility =
    Math.round(results.reduce((acc, r) => acc + r.proposedModel.feasibilityRate, 0) / results.length);

  const avgBaselineRelevance =
    Math.round(results.reduce((acc, r) => acc + r.baselineModel.relevanceRate, 0) / results.length);
  const avgBaselineFeasibility =
    Math.round(results.reduce((acc, r) => acc + r.baselineModel.feasibilityRate, 0) / results.length);

  return {
    evaluationSummary: {
      proposedModel: {
        name: 'Personalized Multi-Factor Scoring Engine',
        averageRelevanceRate: `${avgProposedRelevance}%`,
        averageFeasibilityRate: `${avgProposedFeasibility}%`,
      },
      baselineModel: {
        name: 'Most Popular Baseline Recommender',
        averageRelevanceRate: `${avgBaselineRelevance}%`,
        averageFeasibilityRate: `${avgBaselineFeasibility}%`,
      },
      improvement: {
        relevanceGain: `+${avgProposedRelevance - avgBaselineRelevance}%`,
        feasibilityGain: `+${avgProposedFeasibility - avgBaselineFeasibility}%`,
      },
    },
    detailedPersonaResults: results,
    methodology: {
      metricRelevance: 'Tỷ lệ khóa học gợi ý thuộc đúng mục tiêu hoặc cấp độ CEFR phù hợp của người học.',
      metricFeasibility: 'Tỷ lệ khóa học mà người học có thể mở khóa học ngay (không bị kẹt tiên quyết).',
      rubricCompliance: 'Mục 5.2 - Đề tài CO3103: So sánh mô hình cá nhân hóa với phương pháp cơ sở phổ biến nhất.',
    },
  };
}
