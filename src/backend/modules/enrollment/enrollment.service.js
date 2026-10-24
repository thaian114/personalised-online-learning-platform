// Enrollment & Progress Service (Business Logic Layer)
// Handles enrollment, prerequisite checks, and idempotent lesson progress tracking

import prisma from '../../db/prisma.js';

/**
 * Enroll student into a course
 * Enforces 100% completion of prerequisite course before allowing enrollment
 */
export async function enrollCourse(userId, courseId) {
  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });

  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  if (course.status !== 'published') {
    const error = new Error('Khóa học chưa được công khai');
    error.status = 400;
    throw error;
  }

  // Check if already enrolled
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  if (existing) {
    return {
      success: true,
      alreadyEnrolled: true,
      message: 'Bạn đã đăng ký khóa học này rồi',
      data: existing,
    };
  }

  // Check Prerequisite requirement
  if (course.prerequisiteId) {
    const prereqCourse = await prisma.course.findUnique({
      where: { id: course.prerequisiteId },
      include: { lessons: true },
    });

    if (prereqCourse) {
      // Check Placement Test Exemption:
      // Level B2: exempt from all prerequisites
      // Level B1: exempt from 'Cơ bản' (foundational) prerequisites
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { level: true },
      });
      const userLevel = (user?.level || 'A1').toUpperCase();
      const isExempt =
        userLevel === 'B2' ||
        (userLevel === 'B1' && (!prereqCourse.level || prereqCourse.level === 'Cơ bản'));

      if (!isExempt) {
        const totalPrereqLessons = prereqCourse.lessons.length || prereqCourse.lessonsCount || 0;

        if (totalPrereqLessons > 0) {
          // Count completed lessons for prerequisite
          const completedPrereqCount = await prisma.lessonProgress.count({
            where: {
              userId,
              courseId: course.prerequisiteId,
            },
          });

          // Must complete 100%
          if (completedPrereqCount < totalPrereqLessons) {
            const error = new Error('Chưa hoàn thành khóa học tiên quyết');
            error.status = 400;
            error.details = {
              prerequisiteId: course.prerequisiteId,
              prerequisiteTitle: prereqCourse.title,
              completedLessons: completedPrereqCount,
              totalLessons: totalPrereqLessons,
              currentPercentage: Math.round((completedPrereqCount / totalPrereqLessons) * 100),
              requiredPercentage: 100,
            };
            throw error;
          }
        }
      }
    }
  }

  // Create enrollment record
  const enrollment = await prisma.enrollment.create({
    data: {
      userId,
      courseId,
    },
  });

  // Increment course learners count
  await prisma.course.update({
    where: { id: courseId },
    data: { learners: { increment: 1 } },
  });

  return {
    success: true,
    message: 'Đăng ký khóa học thành công',
    data: enrollment,
  };
}

/**
 * Unenroll student from a course
 * CRITICAL: Preserves learning history in LessonProgress
 */
export async function unenrollCourse(userId, courseId) {
  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  if (!existing) {
    const error = new Error('Bạn chưa đăng ký khóa học này');
    error.status = 400;
    throw error;
  }

  // Remove enrollment
  await prisma.enrollment.delete({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  // Decrement learners count
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (course) {
    const newCount = Math.max(0, (course.learners || 1) - 1);
    await prisma.course.update({
      where: { id: courseId },
      data: { learners: newCount },
    });
  }

  return {
    success: true,
    message: 'Hủy đăng ký khóa học thành công (tiến độ học được bảo lưu)',
  };
}

/**
 * Get all course IDs and details that the current user is enrolled in
 */
export async function getUserEnrollments(userId) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          level: true,
          category: true,
          hours: true,
          lessonsCount: true,
          teacher: true,
          status: true,
          prerequisiteId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    courseIds: enrollments.map((e) => e.courseId),
    enrollments,
  };
}

/**
 * Mark a lesson as completed
 * Idempotent: Can be called multiple times without duplicate records or error
 * Recalculates course completion percentage
 */
export async function completeLesson(userId, courseId, lessonId) {
  const numLessonId = parseInt(lessonId, 10);

  // Verify course and lesson
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });

  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  const lesson = await prisma.lesson.findUnique({
    where: {
      courseId_id: {
        courseId,
        id: numLessonId,
      },
    },
  });

  if (!lesson) {
    const error = new Error('Không tìm thấy bài học');
    error.status = 404;
    throw error;
  }

  // Idempotent upsert progress record
  const progress = await prisma.lessonProgress.upsert({
    where: {
      userId_courseId_lessonId: {
        userId,
        courseId,
        lessonId: numLessonId,
      },
    },
    update: {
      completedAt: new Date(),
    },
    create: {
      userId,
      courseId,
      lessonId: numLessonId,
      completedAt: new Date(),
    },
  });

  // Recalculate course percentage
  const totalLessons = course.lessons.length || course.lessonsCount || 1;
  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId,
      courseId,
    },
  });

  const percentage = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  return {
    courseId,
    lessonId: numLessonId,
    completedLessons: completedCount,
    totalLessons,
    percentage,
    completedAt: progress.completedAt,
  };
}

/**
 * Get detailed progress of user across all courses
 */
export async function getUserProgress(userId) {
  // Fetch all completed lessons for this user
  const allProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: [{ courseId: 'asc' }, { lessonId: 'asc' }],
  });

  // Fetch all active enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: { lessons: true },
      },
    },
  });

  // Group completed lessons by courseId
  const completed = {};
  for (const p of allProgress) {
    if (!completed[p.courseId]) {
      completed[p.courseId] = [];
    }
    if (!completed[p.courseId].includes(p.lessonId)) {
      completed[p.courseId].push(p.lessonId);
    }
  }

  // Collect all courses user interacted with (enrolled or has progress)
  const allCourseIds = new Set([
    ...enrollments.map((e) => e.courseId),
    ...Object.keys(completed),
  ]);

  const courses = await prisma.course.findMany({
    where: {
      id: { in: Array.from(allCourseIds) },
    },
    include: { lessons: true },
  });

  const percentages = {};
  const details = [];

  for (const c of courses) {
    const doneLessons = completed[c.id] || [];
    const total = c.lessons.length || c.lessonsCount || 1;
    const pct = Math.min(100, Math.round((doneLessons.length / total) * 100));

    percentages[c.id] = pct;
    details.push({
      courseId: c.id,
      courseTitle: c.title,
      completedCount: doneLessons.length,
      totalLessons: total,
      percentage: pct,
      completedLessonIds: doneLessons,
    });
  }

  return {
    enrolledCourses: enrollments.map((e) => e.courseId),
    completed,
    percentages,
    details,
  };
}
