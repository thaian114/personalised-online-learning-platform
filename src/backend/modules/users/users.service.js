// Users & Accounts Service (Business Logic Layer)
// Handles Authentication, Profile, Learning Goals, Notifications & Admin User Management

import crypto from 'node:crypto';
import prisma from '../../db/prisma.js';
import {
  VALID_GOALS,
  validateRegisterPayload,
  validateLoginPayload,
  validateProfilePayload,
  validateGoalPayload,
  validateAdminUserPayload,
} from './users.validation.js';

const TOKEN_SECRET = process.env.JWT_SECRET || 'luma-english-secret-key-2026';
const DEFAULT_DEMO_PASSWORD = 'Demo@123';

const DEMO_ROLE_USER_IDS = {
  student: 'minh-anh',
  instructor: 'linh-tran',
  admin: 'admin',
};

// ==================== HELPERS ====================

export function normalizeSearch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(inputPassword, storedPassword) {
  const plainInput = String(inputPassword || '');

  // Fallback cho các tài khoản mẫu trong seed nếu chưa có trường password
  if (!storedPassword) {
    return plainInput === DEFAULT_DEMO_PASSWORD;
  }

  // Nếu mật khẩu trong DB đang lưu dạng plain text (ví dụ: Demo@123)
  if (!storedPassword.includes(':')) {
    return plainInput === storedPassword;
  }

  // Nếu mật khẩu lưu dạng salt:hash
  const [salt, originalHash] = storedPassword.split(':');
  const inputHash = crypto.scryptSync(plainInput, salt, 64).toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(originalHash, 'hex'),
    Buffer.from(inputHash, 'hex'),
  );
}

/**
 * Tạo Bearer Token định dạng header.payload.signature
 */
export function generateAuthToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      userId: user.id,
      role: user.role || 'student',
      name: user.name,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
    }),
  ).toString('base64');

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Chuẩn hóa dữ liệu User trả về (loại bỏ password và tạo cấu trúc session/profile cho FE)
 */
export function formatUserResponse(user) {
  if (!user) return null;

  const { password, ...safeUser } = user;

  const session = {
    userId: safeUser.id,
    role: safeUser.role,
    name: safeUser.name,
    email: safeUser.email,
  };

  const profile = {
    name: safeUser.name,
    email: safeUser.email,
    goal: safeUser.goal || VALID_GOALS[0],
    dailyMinutes: safeUser.dailyMinutes ?? 20,
    level: safeUser.level || 'A1',
  };

  return {
    user: {
      ...safeUser,
      goal: profile.goal,
      dailyMinutes: profile.dailyMinutes,
      level: profile.level,
    },
    session,
    profile,
  };
}

// ==================== AUTHENTICATION ====================

/**
 * Đăng ký tài khoản học viên mới (POST /api/auth/register)
 */
export async function registerUser(data) {
  const validation = validateRegisterPayload(data);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const normalizedEmail = data.email.trim().toLowerCase();

  // Kiểm tra trùng email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    const error = new Error('Email này đã tồn tại trong dữ liệu mẫu.');
    error.status = 409;
    throw error;
  }

  const newUser = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashPassword(data.password),
      role: 'student',
      level: 'A1',
      goal: data.goal && VALID_GOALS.includes(data.goal) ? data.goal : VALID_GOALS[0],
      dailyMinutes: Number(data.dailyMinutes) || 20,
      active: true,
    },
  });

  // Tạo thông báo chào mừng mặc định cho tài khoản mới
  try {
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'Chào mừng bạn đến với Luma',
        body: 'Lộ trình của bạn đã sẵn sàng. Cùng bắt đầu một bài học nhé.',
        to: '/path',
        read: false,
      },
    });
  } catch (e) {
  }

  const formatted = formatUserResponse(newUser);
  const token = generateAuthToken(newUser);

  return {
    ...formatted,
    token,
  };
}

/**
 * Đăng nhập bằng email và mật khẩu (POST /api/auth/login)
 */
export async function loginUser(data) {
  const validation = validateLoginPayload(data);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const normalizedEmail = data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !verifyPassword(data.password, user.password)) {
    const error = new Error('Email hoặc mật khẩu không chính xác.');
    error.status = 401;
    throw error;
  }

  if (!user.active) {
    const error = new Error('Tài khoản này đang tạm khóa.');
    error.status = 403;
    throw error;
  }

  const formatted = formatUserResponse(user);
  const token = generateAuthToken(user);

  return {
    ...formatted,
    token,
  };
}

/**
 * Đăng nhập nhanh bằng tài khoản mẫu theo vai trò (POST /api/auth/demo)
 */
export async function loginDemoByRole(role = 'student') {
  const targetUserId = DEMO_ROLE_USER_IDS[role];
  if (!targetUserId) {
    const error = new Error('Vai trò tài khoản mẫu không hợp lệ.');
    error.status = 400;
    throw error;
  }

  let user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { role },
    });
  }

  if (!user) {
    const error = new Error('Không tìm thấy tài khoản mẫu cho vai trò này.');
    error.status = 404;
    throw error;
  }

  if (!user.active) {
    const error = new Error('Tài khoản mẫu đang tạm khóa. Hãy mở lại trong trang quản trị.');
    error.status = 403;
    throw error;
  }

  const formatted = formatUserResponse(user);
  const token = generateAuthToken(user);

  return {
    ...formatted,
    token,
  };
}

/**
 * Lấy thông tin phiên đăng nhập và hồ sơ hiện tại (GET /api/auth/me & GET /api/me/profile)
 */
export async function getCurrentUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      placementResult: true,
    },
  });

  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.status = 404;
    throw error;
  }

  if (!user.active) {
    const error = new Error('Tài khoản này đang tạm khóa.');
    error.status = 403;
    throw error;
  }

  const formatted = formatUserResponse(user);
  return {
    ...formatted,
    placement: user.placementResult || null,
  };
}

// ==================== PROFILE & GOALS ====================

/**
 * Cập nhật hồ sơ cá nhân: name, email, dailyMinutes, goal (PUT / PATCH /api/me/profile)
 */
export async function updateUserProfile(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('Không tìm thấy hồ sơ người dùng.');
    error.status = 404;
    throw error;
  }

  const validation = validateProfilePayload(data, true);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }

  if (data.email !== undefined) {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (normalizedEmail !== user.email.toLowerCase()) {
      const emailOwner = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (emailOwner && emailOwner.id !== userId) {
        const error = new Error('Email đã được một hồ sơ khác sử dụng.');
        error.status = 409;
        throw error;
      }
      updateData.email = normalizedEmail;
    }
  }

  if (data.goal !== undefined) {
    updateData.goal = data.goal;
  }

  if (data.dailyMinutes !== undefined) {
    updateData.dailyMinutes = Number(data.dailyMinutes);
  }

  if (data.level !== undefined) {
    updateData.level = data.level;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // Đồng bộ tên hiển thị của giảng viên trên các khóa học nếu giảng viên đổi tên
  if (updatedUser.role === 'instructor' && updateData.name) {
    await prisma.course.updateMany({
      where: { teacherId: userId },
      data: { teacher: updateData.name },
    });
  }

  return formatUserResponse(updatedUser);
}

/**
 * Cập nhật mục tiêu học tập trong luồng Onboarding (PUT / PATCH /api/me/goal)
 */
export async function updateUserGoal(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('Không tìm thấy người dùng.');
    error.status = 404;
    throw error;
  }

  const validation = validateGoalPayload(data);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const updateData = { goal: data.goal };
  if (data.dailyMinutes !== undefined) {
    updateData.dailyMinutes = Number(data.dailyMinutes);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return formatUserResponse(updatedUser);
}

// ==================== NOTIFICATIONS ====================

/**
 * Lấy danh sách thông báo của người dùng đang đăng nhập (GET /api/me/notifications)
 */
export async function getUserNotifications(userId) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
  };
}

/**
 * Đánh dấu 1 thông báo là đã đọc (PATCH / PUT /api/me/notifications/:id/read)
 */
export async function markNotificationAsRead(userId, notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    const error = new Error('Không tìm thấy thông báo.');
    error.status = 404;
    throw error;
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return updated;
}

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc (PATCH / PUT /api/me/notifications/read-all)
 */
export async function markAllNotificationsAsRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    updatedCount: result.count,
    notifications,
  };
}

// ==================== ADMIN ACCOUNT MANAGEMENT ====================

/**
 * Lấy danh sách người dùng cho trang Admin (GET /api/admin/users)
 * Hỗ trợ tìm kiếm không dấu theo tên/email, lọc theo role và trạng thái active/locked
 */
export async function getAdminUsersList({
  search = '',
  q = '',
  role = '',
  status = '',
  page = 1,
  limit = 50,
} = {}) {
  const where = {};

  if (role && role !== 'all') {
    where.role = role;
  }

  if (status === 'active') {
    where.active = true;
  } else if (status === 'locked' || status === 'inactive') {
    where.active = false;
  }

  let users = await prisma.user.findMany({
    where,
    include: {
      _count: {
        select: {
          enrollments: true,
          submissions: true,
          authoredCourses: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const keyword = search || q;
  if (keyword) {
    const normKeyword = normalizeSearch(keyword);
    users = users.filter((u) =>
      normalizeSearch(`${u.name} ${u.email}`).includes(normKeyword),
    );
  }

  const sanitizedUsers = users.map((u) => {
    const { password, _count, ...rest } = u;
    return {
      ...rest,
      goal: rest.goal || VALID_GOALS[0],
      dailyMinutes: rest.dailyMinutes ?? 20,
      enrollmentsCount: _count?.enrollments || 0,
      submissionsCount: _count?.submissions || 0,
      authoredCoursesCount: _count?.authoredCourses || 0,
    };
  });

  const total = sanitizedUsers.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 50);
  const startIndex = (pageNum - 1) * limitNum;

  return {
    users: sanitizedUsers.slice(startIndex, startIndex + limitNum),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

/**
 * Xem chi tiết 1 tài khoản người dùng (GET /api/admin/users/:id)
 */
export async function getAdminUserById(targetUserId) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      enrollments: {
        include: {
          course: { select: { id: true, title: true, level: true } },
        },
      },
      placementResult: true,
      _count: {
        select: {
          progress: true,
          quizResults: true,
          submissions: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('Không tìm thấy tài khoản người dùng.');
    error.status = 404;
    throw error;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Admin cập nhật vai trò hoặc khóa/mở khóa tài khoản (PUT / PATCH /api/admin/users/:id)
 * Tuân thủ 2 quy tắc bảo vệ trong Admin.jsx:
 * 1. Không tự khóa hoặc tự hạ quyền của tài khoản đang đăng nhập
 * 2. Phải giữ lại ít nhất 1 quản trị viên đang hoạt động
 */
export async function updateUserByAdmin(targetUserId, data, adminActor) {
  const validation = validateAdminUserPayload(data);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!targetUser) {
    const error = new Error('Không tìm thấy tài khoản người dùng cần cập nhật.');
    error.status = 404;
    throw error;
  }

  const nextRole = data.role !== undefined ? data.role : targetUser.role;
  const nextActive = data.active !== undefined ? data.active : targetUser.active;

  // Quy tắc 1: Không cho phép tự thay đổi vai trò hoặc tự khóa chính mình
  if (
    adminActor &&
    adminActor.id === targetUserId &&
    (nextRole !== targetUser.role || nextActive !== targetUser.active)
  ) {
    const error = new Error('Tài khoản đang đăng nhập giữ vai trò và quyền truy cập hiện tại.');
    error.status = 400;
    throw error;
  }

  // Quy tắc 2: Đảm bảo hệ thống luôn có ít nhất 1 admin đang hoạt động
  if (targetUser.role === 'admin' && targetUser.active && (nextRole !== 'admin' || !nextActive)) {
    const otherActiveAdminsCount = await prisma.user.count({
      where: {
        role: 'admin',
        active: true,
        id: { not: targetUserId },
      },
    });

    if (otherActiveAdminsCount === 0) {
      const error = new Error('Cần giữ ít nhất một quản trị viên hoạt động.');
      error.status = 400;
      throw error;
    }
  }

  const updateData = {};
  if (data.role !== undefined) updateData.role = data.role;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.name !== undefined) updateData.name = data.name.trim();

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: updateData,
  });

  const { password, ...safeUpdated } = updated;

  return {
    user: safeUpdated,
    audit: {
      actor: adminActor?.name || 'Admin',
      action: 'Cập nhật tài khoản',
      target: `${safeUpdated.name} · ${safeUpdated.role} · ${
        safeUpdated.active ? 'Hoạt động' : 'Tạm khóa'
      }`,
      createdAt: new Date().toISOString(),
    },
  };
}