// Courses & Lessons HTTP Controller (Express Router)
import { Router } from 'express';
import {
  getCoursesList,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addLesson,
  updateLesson,
  deleteLesson,
} from './courses.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// ==================== PUBLIC ENDPOINTS ====================

// GET /api/courses - List published courses with filters and search
router.get('/courses', async (req, res, next) => {
  try {
    const { search, level, category, status, sort, page, limit } = req.query;
    const result = await getCoursesList({
      search,
      level,
      category,
      status: status || 'published',
      sort,
      page,
      limit,
    });
    res.json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:id - Course details and lesson outline
router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await getCourseById(req.params.id);
    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== INSTRUCTOR / ADMIN ENDPOINTS ====================

// GET /api/instructor/courses - Get courses owned by current instructor or all if admin
router.get(
  '/instructor/courses',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const { search, level, category, status, page, limit } = req.query;
      const result = await getCoursesList({
        search,
        level,
        category,
        status: status || 'all',
        page,
        limit,
      });

      // Filter by instructor if not admin
      let courses = result.courses;
      if (req.user.role !== 'admin') {
        courses = courses.filter((c) => !c.teacherId || c.teacherId === req.user.id);
      }

      res.json({
        success: true,
        data: courses,
        pagination: {
          ...result.pagination,
          total: courses.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/instructor/courses - Create new course
router.post(
  '/instructor/courses',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const course = await createCourse(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Tạo khóa học thành công',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/instructor/courses/:id - Update course
router.put(
  '/instructor/courses/:id',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const course = await updateCourse(req.params.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Cập nhật khóa học thành công',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/instructor/courses/:id - Delete / Hide course
router.delete(
  '/instructor/courses/:id',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const result = await deleteCourse(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/instructor/courses/:id/lessons - Add lesson to course
router.post(
  '/instructor/courses/:id/lessons',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const lesson = await addLesson(req.params.id, req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Thêm bài học thành công',
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/instructor/courses/:id/lessons/:lessonId - Update lesson
router.put(
  '/instructor/courses/:id/lessons/:lessonId',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const lesson = await updateLesson(req.params.id, req.params.lessonId, req.body, req.user);
      res.json({
        success: true,
        message: 'Cập nhật bài học thành công',
        data: lesson,
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/instructor/courses/:id/lessons/:lessonId - Delete lesson
router.delete(
  '/instructor/courses/:id/lessons/:lessonId',
  requireAuth,
  requireRole('instructor', 'admin'),
  async (req, res, next) => {
    try {
      const result = await deleteLesson(req.params.id, req.params.lessonId, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
