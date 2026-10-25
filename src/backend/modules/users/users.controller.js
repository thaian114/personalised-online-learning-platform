// Users, Auth, Profile & Admin Accounts HTTP Controller (Express Router)
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  loginDemoByRole,
  getCurrentUserProfile,
  updateUserProfile,
  updateUserGoal,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAdminUsersList,
  getAdminUserById,
  updateUserByAdmin,
} from './users.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

// ==================== AUTHENTICATION ENDPOINTS ====================

// POST /api/auth/register - Register new student account
router.post('/auth/register', async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: result,
      user: result.user,
      session: result.session,
      profile: result.profile,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - Login with email and password
router.post('/auth/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json({
      success: true,
      message: 'Đăng nhập thành công. Chào mừng bạn trở lại!',
      data: result,
      user: result.user,
      session: result.session,
      profile: result.profile,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/demo - Quick login with demo account by role (student, instructor, admin)
router.post('/auth/demo', async (req, res, next) => {
  try {
    const role = req.body?.role || req.query?.role || 'student';
    const result = await loginDemoByRole(role);
    res.json({
      success: true,
      message: 'Đăng nhập tài khoản mẫu thành công',
      data: result,
      user: result.user,
      session: result.session,
      profile: result.profile,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - Logout current session
router.post('/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
});

// GET /api/auth/me - Get current authenticated session and user profile
router.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    const result = await getCurrentUserProfile(req.user.id);
    res.json({
      success: true,
      data: result,
      user: result.user,
      session: result.session,
      profile: result.profile,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PROFILE & LEARNING GOAL ENDPOINTS ====================

// GET /api/me/profile - Get current user's profile
router.get('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const result = await getCurrentUserProfile(req.user.id);
    res.json({
      success: true,
      data: result.profile,
      profile: result.profile,
      session: result.session,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
});

// PUT & PATCH /api/me/profile - Update personal profile (name, email, goal, dailyMinutes)
async function handleUpdateProfile(req, res, next) {
  try {
    const result = await updateUserProfile(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Đã lưu thông tin cá nhân.',
      data: result.profile,
      profile: result.profile,
      session: result.session,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

router.put('/me/profile', requireAuth, handleUpdateProfile);
router.patch('/me/profile', requireAuth, handleUpdateProfile);

// PUT & PATCH /api/me/goal - Update learning goal during onboarding or from profile
async function handleUpdateGoal(req, res, next) {
  try {
    const result = await updateUserGoal(req.user.id, req.body);
    res.json({
      success: true,
      message: 'Đã cập nhật mục tiêu học tập.',
      data: result.profile,
      profile: result.profile,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
}

router.put('/me/goal', requireAuth, handleUpdateGoal);
router.patch('/me/goal', requireAuth, handleUpdateGoal);

// ==================== NOTIFICATIONS ENDPOINTS ====================

// GET /api/me/notifications - Get notifications for current logged-in user
router.get('/me/notifications', requireAuth, async (req, res, next) => {
  try {
    const result = await getUserNotifications(req.user.id);
    res.json({
      success: true,
      data: result.notifications,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    next(error);
  }
});

// PUT & PATCH /api/me/notifications/read-all - Mark all user notifications as read
async function handleMarkAllRead(req, res, next) {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);
    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc.',
      data: result.notifications,
      notifications: result.notifications,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    next(error);
  }
}

router.put('/me/notifications/read-all', requireAuth, handleMarkAllRead);
router.patch('/me/notifications/read-all', requireAuth, handleMarkAllRead);

// PUT & PATCH /api/me/notifications/:id/read - Mark a single notification as read
async function handleMarkOneRead(req, res, next) {
  try {
    const notification = await markNotificationAsRead(req.user.id, req.params.id);
    res.json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc.',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

router.put('/me/notifications/:id/read', requireAuth, handleMarkOneRead);
router.patch('/me/notifications/:id/read', requireAuth, handleMarkOneRead);

// ==================== ADMIN USER MANAGEMENT ENDPOINTS ====================

// GET /api/admin/users - List all users with search, role and status filters
router.get('/admin/users', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { search, q, role, status, page, limit } = req.query;
    const result = await getAdminUsersList({
      search,
      q,
      role,
      status,
      page,
      limit,
    });
    res.json({
      success: true,
      data: result.users,
      users: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users/:id - Get detailed user account info for Admin
router.get('/admin/users/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await getAdminUserById(req.params.id);
    res.json({
      success: true,
      data: user,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// PUT & PATCH /api/admin/users/:id - Update user role or active status by Admin
async function handleAdminUpdateUser(req, res, next) {
  try {
    const result = await updateUserByAdmin(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Đã cập nhật tài khoản.',
      data: result.user,
      user: result.user,
      audit: result.audit,
    });
  } catch (error) {
    next(error);
  }
}

router.put('/admin/users/:id', requireAuth, requireRole('admin'), handleAdminUpdateUser);
router.patch('/admin/users/:id', requireAuth, requireRole('admin'), handleAdminUpdateUser);

export default router;