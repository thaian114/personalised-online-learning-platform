// Assessments & Quizzes HTTP Controller (Express Router)
import { Router } from 'express';
import {
  getLessonQuiz,
  submitLessonQuiz,
  getPlacementTest,
  submitPlacementTest,
  submitAssignment,
  getInstructorSubmissions,
  gradeSubmission,
} from './assessments.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// ==================== LESSON QUIZZES ====================

// GET /courses/:id/lessons/:lessonId/quiz - Fetch questions (stripped of answers/explanations)
router.get('/courses/:id/lessons/:lessonId/quiz', async (req, res, next) => {
  try {
    const result = await getLessonQuiz(req.params.id, req.params.lessonId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /courses/:id/lessons/:lessonId/quiz/submit - Submit answers and get graded result
router.post(
  '/courses/:id/lessons/:lessonId/quiz/submit',
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await submitLessonQuiz(
        req.user.id,
        req.params.id,
        req.params.lessonId,
        req.body?.answers || {},
      );
      res.json({
        success: true,
        message: result.passed ? 'Chúc mừng! Bạn đã hoàn thành bài quiz' : 'Bạn chưa đạt điểm chuẩn, hãy thử lại nhé',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==================== PLACEMENT TEST ====================

// GET /placement/test - Get 20 questions for input placement test (answers stripped)
router.get('/placement/test', async (req, res, next) => {
  try {
    const result = await getPlacementTest();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /placement/submit - Submit placement test and classify CEFR level
router.post('/placement/submit', requireAuth, async (req, res, next) => {
  try {
    const result = await submitPlacementTest(req.user.id, req.body?.answers || {});
    res.json({
      success: true,
      message: `Đánh giá thành công! Trình độ của bạn được xếp loại là: ${result.level}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// ====================  ASSIGNMENTS & GRADING ====================

// POST /courses/:id/assignments/:assignmentId/submit - Student submits assignment
router.post(
  '/courses/:id/assignments/:assignmentId/submit',
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await submitAssignment(
        req.user.id,
        req.user,
        req.params.id,
        req.params.assignmentId,
        req.body || {},
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

// GET /instructor/submissions - Instructor reviews pending submissions
router.get(
  '/instructor/submissions',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const result = await getInstructorSubmissions(req.query);
      res.json({
        success: true,
        data: result.submissions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /instructor/submissions/:id/grade - Instructor grades submission
router.put(
  '/instructor/submissions/:id/grade',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const { score, feedback, status } = req.body || {};
      const result = await gradeSubmission(req.params.id, { score, feedback, status });
      res.json({
        success: true,
        message: status === 'draft' ? 'Đã lưu điểm nháp' : 'Đã công bố điểm cho học viên',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
