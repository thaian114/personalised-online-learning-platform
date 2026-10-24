// Learning Path & Recommendation Controller (Routing & HTTP Handling)
// Module 4: Personalised Learning Paths & Recommendations

import { Router } from 'express';
import { getPersonalizedLearningPath } from './path.service.js';
import {
  getPersonalizedRecommendations,
  runRecommendationBenchmark,
} from './recommendation.service.js';
import prisma from '../../db/prisma.js';

const router = Router();

/**
 * GET /api/path/me OR /path/me
 * Returns personalized DAG learning path in Topological Order
 */
router.get(['/path/me', '/api/path/me'], async (req, res, next) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || null;
    const pathData = await getPersonalizedLearningPath(userId);
    res.json({
      success: true,
      data: pathData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recommendations OR /recommendations
 * Returns Top-K personalized course recommendations with explainable reasons
 * Query params: ?limit=4
 */
router.get(['/recommendations', '/api/recommendations'], async (req, res, next) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || null;
    const limit = parseInt(req.query.limit, 10) || 4;
    const recommendationsData = await getPersonalizedRecommendations(userId, { limit });
    res.json({
      success: true,
      data: recommendationsData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/recommendations/benchmark OR /recommendations/benchmark
 * Compares proposed Multi-factor Scoring vs Most Popular Baseline
 * Meets Section 5.2 Rubric Requirement
 */
router.get(
  ['/recommendations/benchmark', '/api/recommendations/benchmark'],
  async (req, res, next) => {
    try {
      const benchmarkData = await runRecommendationBenchmark();
      res.json({
        success: true,
        data: benchmarkData,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PUT /api/me/goal OR /me/goal
 * Updates user learning goal (e.g. 'Củng cố nền tảng', 'Giao tiếp hằng ngày', 'Học tập và công việc', 'Chuẩn bị thi cử')
 */
router.put(['/me/goal', '/api/me/goal'], async (req, res, next) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn cần đăng nhập để cập nhật mục tiêu học tập',
      });
    }

    const { goal } = req.body;
    if (!goal || typeof goal !== 'string' || !goal.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mục tiêu học tập không được để trống',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { goal: goal.trim() },
      select: { id: true, name: true, email: true, level: true, goal: true },
    });

    res.json({
      success: true,
      message: 'Đã cập nhật mục tiêu học tập thành công',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
