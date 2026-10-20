// Assessments & Quizzes Service (Business Logic Layer)
// Handles quiz evaluation, placement test grading, and assignment submissions

import prisma from '../../db/prisma.js';
import { quizQuestions, placementQuestions, defaultAssignment } from '../../../data.js';

/**
 * Get quiz questions for a lesson
 * ⚠️ SECURITY REQUIREMENT: Strips 'answer' and 'explanation' before sending to client
 */
export async function getLessonQuiz(courseId, lessonId) {
  const numLessonId = parseInt(lessonId, 10);

  // Verify course & lesson exist
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { courseId_id: { courseId, id: numLessonId } },
  });
  if (!lesson) {
    const error = new Error('Không tìm thấy bài học');
    error.status = 404;
    throw error;
  }

  // Fetch questions from DB or fallback to default bank
  let questions = await prisma.question.findMany({
    where: { type: 'lesson_quiz' },
    orderBy: { orderIndex: 'asc' },
  });

  if (questions.length === 0) {
    questions = quizQuestions;
  }

  // Strip answer and explanation to prevent cheat
  const sanitized = questions.map((q) => {
    const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    return {
      id: q.id,
      prompt: q.prompt,
      options,
    };
  });

  return {
    courseId,
    lessonId: numLessonId,
    totalQuestions: sanitized.length,
    questions: sanitized,
  };
}

/**
 * Submit quiz answers and calculate score
 * Saves result into QuizResult table and returns full review with explanations
 */
export async function submitLessonQuiz(userId, courseId, lessonId, answers = {}) {
  const numLessonId = parseInt(lessonId, 10);

  // Verify course & lesson
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { courseId_id: { courseId, id: numLessonId } },
  });
  if (!lesson) {
    const error = new Error('Không tìm thấy bài học');
    error.status = 404;
    throw error;
  }

  // Load ground-truth questions with correct answers
  let questions = await prisma.question.findMany({
    where: { type: 'lesson_quiz' },
    orderBy: { orderIndex: 'asc' },
  });

  if (questions.length === 0) {
    questions = quizQuestions;
  }

  // Score answers
  let correctCount = 0;
  const details = questions.map((q) => {
    const userChoice = answers[q.id];
    const isCorrect = userChoice !== undefined && Number(userChoice) === q.answer;
    if (isCorrect) correctCount++;

    const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    return {
      questionId: q.id,
      prompt: q.prompt,
      options,
      yourAnswer: userChoice !== undefined ? Number(userChoice) : null,
      correctAnswer: q.answer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const totalQuestions = questions.length;
  const score = Math.round((correctCount / totalQuestions) * 10 * 10) / 10;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = percentage >= 70; // 70% passing threshold

  // Save result in QuizResult table
  await prisma.quizResult.upsert({
    where: {
      userId_courseId_lessonId: {
        userId,
        courseId,
        lessonId: numLessonId,
      },
    },
    update: {
      score,
      percentage,
      correctCount,
      totalQuestions,
      passed,
      answers: JSON.stringify(answers || {}),
    },
    create: {
      userId,
      courseId,
      lessonId: numLessonId,
      score,
      percentage,
      correctCount,
      totalQuestions,
      passed,
      answers: JSON.stringify(answers || {}),
    },
  });

  return {
    courseId,
    lessonId: numLessonId,
    score,
    percentage,
    passed,
    correctCount,
    totalQuestions,
    details,
  };
}

/**
 * Get 20-question Placement Test
 * ⚠️ SECURITY REQUIREMENT: Strips 'answer' and 'explanation'
 */
export async function getPlacementTest() {
  let questions = await prisma.question.findMany({
    where: { type: 'placement' },
    orderBy: { orderIndex: 'asc' },
  });

  if (questions.length === 0) {
    questions = placementQuestions;
  }

  const sanitized = questions.map((q) => {
    const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    return {
      id: q.id,
      prompt: q.prompt,
      options,
    };
  });

  return {
    totalQuestions: sanitized.length,
    questions: sanitized,
  };
}

/**
 * Submit 20-question Placement Test
 * Evaluates score, determines CEFR level (A1, A2, B1, B2) and updates user profile
 */
export async function submitPlacementTest(userId, answers = {}) {
  let questions = await prisma.question.findMany({
    where: { type: 'placement' },
    orderBy: { orderIndex: 'asc' },
  });

  if (questions.length === 0) {
    questions = placementQuestions;
  }

  let correctCount = 0;
  const details = questions.map((q) => {
    const userChoice = answers[q.id];
    const isCorrect = userChoice !== undefined && Number(userChoice) === q.answer;
    if (isCorrect) correctCount++;

    const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    return {
      questionId: q.id,
      prompt: q.prompt,
      options,
      yourAnswer: userChoice !== undefined ? Number(userChoice) : null,
      correctAnswer: q.answer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const totalQuestions = questions.length || 20;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const score = Math.round((correctCount / totalQuestions) * 10 * 10) / 10;

  // Level classification according to rubric:
  // < 40% -> A1
  // 40 - 60% -> A2
  // 60 - 80% -> B1
  // > 80% -> B2
  let level = 'A1';
  if (percentage > 80) {
    level = 'B2';
  } else if (percentage >= 60) {
    level = 'B1';
  } else if (percentage >= 40) {
    level = 'A2';
  } else {
    level = 'A1';
  }

  // Save in PlacementResult table
  await prisma.placementResult.upsert({
    where: { userId },
    update: {
      score,
      percentage,
      correctCount,
      totalQuestions,
      level,
      answers: JSON.stringify(answers || {}),
    },
    create: {
      userId,
      score,
      percentage,
      correctCount,
      totalQuestions,
      level,
      answers: JSON.stringify(answers || {}),
    },
  });

  // Update User profile with assessed level
  await prisma.user.update({
    where: { id: userId },
    data: { level },
  });

  return {
    score,
    percentage,
    correctCount,
    totalQuestions,
    level,
    details,
  };
}

/**
 * Submit assignment text or file
 * Validates due date and marks late if submitted after deadline
 */
export async function submitAssignment(userId, user, courseId, assignmentId, data = {}) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  // Check assignment
  let assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) {
    // Look up any assignment for this course or create default
    assignment = await prisma.assignment.findFirst({ where: { courseId } });
    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          id: assignmentId || `asg-${courseId}`,
          courseId,
          title: data.title || defaultAssignment.title,
          prompt: defaultAssignment.prompt,
          due: new Date(defaultAssignment.due),
        },
      });
    }
  }

  // Check deadline
  const now = new Date();
  const isLate = assignment.due ? now > new Date(assignment.due) : false;

  const submission = await prisma.submission.create({
    data: {
      userId,
      courseId,
      assignmentId: assignment.id,
      studentName: user?.name || 'Học viên',
      title: data.title?.trim() || assignment.title,
      filename: data.filename || null,
      fileUrl: data.fileUrl || null,
      text: data.text || '',
      status: 'pending',
      late: isLate,
      submittedAt: now,
    },
  });

  return {
    success: true,
    message: isLate ? 'Đã nộp bài (Nộp muộn sau deadline)' : 'Đã nộp bài thành công',
    data: submission,
  };
}

/**
 * Get submissions for instructor grading
 */
export async function getInstructorSubmissions(filters = {}) {
  const where = {};
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.status && filters.status !== 'all') where.status = filters.status;

  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.max(1, parseInt(filters.limit, 10) || 20);

  const total = await prisma.submission.count({ where });
  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    submissions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Grade a student submission
 * Supports 'draft' (saving temporary grade) and 'published'/'graded'
 */
export async function gradeSubmission(submissionId, { score, feedback, status = 'graded' }) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    const error = new Error('Không tìm thấy bài nộp');
    error.status = 404;
    throw error;
  }

  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0 || numScore > 10) {
    const error = new Error('Điểm số phải là số từ 0 đến 10');
    error.status = 400;
    throw error;
  }

  let updated;
  if (status === 'draft') {
    updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        draftScore: numScore,
        draftFeedback: feedback || '',
        status: 'draft',
      },
    });
  } else {
    updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: numScore,
        feedback: feedback || '',
        status: 'graded',
        gradedAt: new Date(),
      },
    });
  }

  return updated;
}
