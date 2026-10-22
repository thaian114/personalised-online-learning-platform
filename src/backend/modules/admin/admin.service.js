// Admin Management & Course Statistics Service (Business Logic Layer)
// Meets Section 4.6 Rubric: Quản trị & Báo cáo cơ bản
// Calculates enrollments, completion rates, learning outcomes, and course breakdowns

import prisma from '../../db/prisma.js';

export async function getAdminCourseStatistics() {
  // 1. Fetch all courses with lessons and enrollments
  const courses = await prisma.course.findMany({
    include: {
      lessons: {
        select: { id: true, minutes: true },
      },
      enrollments: {
        select: { userId: true },
      },
      assignments: {
        select: { id: true },
      },
      instructor: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch all lesson progress
  const allProgress = await prisma.lessonProgress.findMany({
    select: { userId: true, courseId: true, lessonId: true },
  });

  // Map progress: key = `${userId}:${courseId}` -> Set of completed lessonIds
  const progressMap = new Map();
  for (const p of allProgress) {
    const key = `${p.userId}:${p.courseId}`;
    if (!progressMap.has(key)) {
      progressMap.set(key, new Set());
    }
    progressMap.get(key).add(p.lessonId);
  }

  // 3. Fetch all quiz results
  const allQuizResults = await prisma.quizResult.findMany({
    select: { courseId: true, score: true, passed: true },
  });

  const quizMap = new Map();
  for (const q of allQuizResults) {
    if (!quizMap.has(q.courseId)) {
      quizMap.set(q.courseId, []);
    }
    quizMap.get(q.courseId).push(q);
  }

  // 4. Fetch all submissions
  const allSubmissions = await prisma.submission.findMany({
    select: { courseId: true, status: true, score: true },
  });

  const submissionMap = new Map();
  for (const s of allSubmissions) {
    if (!submissionMap.has(s.courseId)) {
      submissionMap.set(s.courseId, []);
    }
    submissionMap.get(s.courseId).push(s);
  }

  // 5. Compute per-course statistics
  let totalCompletions = 0;
  let totalEnrolledUsersAcrossAll = 0;
  let sumProgressPercentages = 0;

  const courseStats = courses.map((c) => {
    const totalLessons = c.lessons.length;
    const enrolledUsers = c.enrollments.map((e) => e.userId);
    const enrolledCount = enrolledUsers.length;
    totalEnrolledUsersAcrossAll += enrolledCount;

    let completedLearnersCount = 0;
    let sumCourseProgress = 0;

    for (const uid of enrolledUsers) {
      const completedLessonCount = progressMap.get(`${uid}:${c.id}`)?.size || 0;
      const progressPercent = totalLessons > 0 ? (completedLessonCount / totalLessons) * 100 : 0;
      sumCourseProgress += progressPercent;
      sumProgressPercentages += progressPercent;
      if (totalLessons > 0 && completedLessonCount >= totalLessons) {
        completedLearnersCount++;
        totalCompletions++;
      }
    }

    const averageProgress =
      enrolledCount > 0 ? Math.round((sumCourseProgress / enrolledCount) * 10) / 10 : 0;
    const completionRate =
      enrolledCount > 0 ? Math.round((completedLearnersCount / enrolledCount) * 1000) / 10 : 0;

    const courseQuizzes = quizMap.get(c.id) || [];
    const quizAttempts = courseQuizzes.length;
    const avgQuizScore =
      quizAttempts > 0
        ? Math.round(
            (courseQuizzes.reduce((acc, q) => acc + q.score, 0) / quizAttempts) * 10,
          ) / 10
        : null;

    const courseSubs = submissionMap.get(c.id) || [];
    const submissionsCount = courseSubs.length;
    const gradedSubs = courseSubs.filter((s) => s.status === 'graded' && s.score != null);
    const avgSubmissionScore =
      gradedSubs.length > 0
        ? Math.round(
            (gradedSubs.reduce((acc, s) => acc + s.score, 0) / gradedSubs.length) * 10,
          ) / 10
        : null;

    return {
      id: c.id,
      title: c.title,
      level: c.level,
      category: c.category,
      status: c.status,
      teacher: c.teacher,
      teacherEmail: c.instructor?.email || null,
      hours: c.hours,
      lessonsCount: totalLessons,
      enrolledCount,
      completedLearnersCount,
      completionRate, // Percentage 0 - 100
      averageProgress, // Percentage 0 - 100
      quizAttempts,
      averageQuizScore: avgQuizScore,
      submissionsCount,
      averageSubmissionScore: avgSubmissionScore,
    };
  });

  // 6. Category breakdown
  const categoryMap = new Map();
  for (const cs of courseStats) {
    if (!categoryMap.has(cs.category)) {
      categoryMap.set(cs.category, { category: cs.category, coursesCount: 0, enrollmentsCount: 0 });
    }
    const cat = categoryMap.get(cs.category);
    cat.coursesCount++;
    cat.enrollmentsCount += cs.enrolledCount;
  }

  // 7. Level breakdown
  const levelMap = new Map();
  for (const cs of courseStats) {
    if (!levelMap.has(cs.level)) {
      levelMap.set(cs.level, { level: cs.level, coursesCount: 0, enrollmentsCount: 0 });
    }
    const lvl = levelMap.get(cs.level);
    lvl.coursesCount++;
    lvl.enrollmentsCount += cs.enrolledCount;
  }

  // 8. Overall platform metrics
  const totalUsers = await prisma.user.count();
  const studentsCount = await prisma.user.count({ where: { role: 'student' } });
  const instructorsCount = await prisma.user.count({ where: { role: 'instructor' } });
  const adminsCount = await prisma.user.count({ where: { role: 'admin' } });

  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c) => c.status === 'published').length;
  const draftCourses = courses.filter((c) => c.status === 'draft').length;
  const hiddenCourses = courses.filter((c) => c.status === 'hidden').length;
  const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);

  const totalQuizAttempts = allQuizResults.length;
  const passedQuizCount = allQuizResults.filter((q) => q.passed).length;
  const avgOverallQuizScore =
    totalQuizAttempts > 0
      ? Math.round(
          (allQuizResults.reduce((acc, q) => acc + q.score, 0) / totalQuizAttempts) * 10,
        ) / 10
      : 0;

  const overallCompletionRate =
    totalEnrolledUsersAcrossAll > 0
      ? Math.round((totalCompletions / totalEnrolledUsersAcrossAll) * 1000) / 10
      : 0;

  const averageLearnerProgress =
    totalEnrolledUsersAcrossAll > 0
      ? Math.round((sumProgressPercentages / totalEnrolledUsersAcrossAll) * 10) / 10
      : 0;

  return {
    overview: {
      totalCourses,
      publishedCourses,
      draftCourses,
      hiddenCourses,
      totalLessons,
      totalUsers,
      userRoles: {
        students: studentsCount,
        instructors: instructorsCount,
        admins: adminsCount,
      },
      enrollments: {
        total: totalEnrolledUsersAcrossAll,
        totalCompletions,
        completionRate: overallCompletionRate,
        averageProgress: averageLearnerProgress,
      },
      learningOutcomes: {
        totalQuizAttempts,
        passedQuizCount,
        quizPassRate:
          totalQuizAttempts > 0
            ? Math.round((passedQuizCount / totalQuizAttempts) * 1000) / 10
            : 0,
        averageQuizScore: avgOverallQuizScore,
        totalSubmissions: allSubmissions.length,
        gradedSubmissions: allSubmissions.filter((s) => s.status === 'graded').length,
        pendingSubmissions: allSubmissions.filter((s) => s.status === 'pending').length,
      },
    },
    courses: courseStats,
    categories: Array.from(categoryMap.values()),
    levels: Array.from(levelMap.values()),
  };
}

export async function updateCourseStatusByAdmin(courseId, status) {
  const validStatuses = ['published', 'draft', 'hidden'];
  if (!validStatuses.includes(status)) {
    const error = new Error(`Trạng thái không hợp lệ. Phải là một trong: ${validStatuses.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học cần cập nhật trạng thái');
    error.status = 404;
    throw error;
  }

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: { status },
  });

  return {
    success: true,
    message: `Đã cập nhật trạng thái khóa học "${updated.title}" thành "${status}"`,
    course: {
      id: updated.id,
      title: updated.title,
      status: updated.status,
    },
  };
}
