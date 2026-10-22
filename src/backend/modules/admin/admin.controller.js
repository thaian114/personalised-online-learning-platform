// Admin Controller (Routing & HTTP Handling)
// Protected with requireRole('admin')

import { Router } from 'express';
import { requireRole } from '../../middleware/auth.js';
import {
  getAdminCourseStatistics,
  updateCourseStatusByAdmin,
} from './admin.service.js';

const router = Router();

// All admin routes strictly require 'admin' role
router.use('/admin', requireRole('admin'));

/**
 * GET /api/admin/courses/stats OR /api/admin/stats
 * Returns system-wide course statistics, enrollment rates, completion rates, and learning outcomes
 */
router.get('/admin/courses/stats', async (req, res, next) => {
  try {
    const stats = await getAdminCourseStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/stats', async (req, res, next) => {
  try {
    const stats = await getAdminCourseStatistics();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/courses
 * Returns list of courses with detailed enrollment and completion statistics
 */
router.get('/admin/courses', async (req, res, next) => {
  try {
    const stats = await getAdminCourseStatistics();
    res.json({
      success: true,
      count: stats.courses.length,
      courses: stats.courses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/courses/:id/status
 * Quick action for admin to update course status ('published', 'draft', 'hidden')
 */
router.put('/admin/courses/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await updateCourseStatusByAdmin(id, status);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
