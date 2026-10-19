// Enrollment & Progress HTTP Controller (Express Router)
import { Router } from 'express';
import {
  enrollCourse,
  unenrollCourse,
  getUserEnrollments,
  completeLesson,
  getUserProgress,
} from './enrollment.service.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// ==================== ENROLLMENT ENDPOINTS ====================

// POST /courses/:id/enroll - Enroll in a course (checks prerequisite 100%)
router.post('/courses/:id/enroll', requireAuth, async (req, res, next) => {
  try {
    const result = await enrollCourse(req.user.id, req.params.id);
    const statusCode = result.alreadyEnrolled ? 200 : 201;
    res.status(statusCode).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE /courses/:id/unenroll - Unenroll from a course (preserves progress)
router.delete('/courses/:id/unenroll', requireAuth, async (req, res, next) => {
  try {
    const result = await unenrollCourse(req.user.id, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /me/enrollments - List course IDs user is currently enrolled in
router.get('/me/enrollments', requireAuth, async (req, res, next) => {
  try {
    const result = await getUserEnrollments(req.user.id);
    res.json({
      success: true,
      data: result.courseIds,
      enrollments: result.enrollments,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PROGRESS ENDPOINTS ====================

// POST /courses/:id/lessons/:lessonId/complete - Mark lesson completed (Idempotent)
router.post(
  '/courses/:id/lessons/:lessonId/complete',
  requireAuth,
  async (req, res, next) => {
    try {
      const result = await completeLesson(req.user.id, req.params.id, req.params.lessonId);
      res.json({
        success: true,
        message: 'Đã hoàn thành bài học',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// GET /me/progress - Get comprehensive progress across all courses
router.get('/me/progress', requireAuth, async (req, res, next) => {
  try {
    const result = await getUserProgress(req.user.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
