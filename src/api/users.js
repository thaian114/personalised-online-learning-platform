// Frontend API Client for Users, Authentication, Profile, Notifications & Admin Users
// Connects UI to Node.js backend API

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(userOrSession) {
  const headers = { 'Content-Type': 'application/json' };
  if (!userOrSession) return headers;

  if (userOrSession.token) {
    headers.Authorization = `Bearer ${userOrSession.token}`;
  }

  const userId = userOrSession.id || userOrSession.userId;
  if (userId) {
    headers['x-user-id'] = userId;
    headers['x-user-role'] = userOrSession.role || 'student';
  }

  return headers;
}

// ==================== AUTHENTICATION ====================

export async function registerApi(registerData) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi tạo tài khoản' }));
    throw new Error(err.message || 'Lỗi khi tạo tài khoản');
  }
  return res.json();
}

export async function loginApi(credentials) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi đăng nhập' }));
    throw new Error(err.message || 'Lỗi khi đăng nhập');
  }
  return res.json();
}

export async function demoLoginApi(role = 'student') {
  const res = await fetch(`${API_BASE_URL}/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Không thể đăng nhập tài khoản mẫu' }));
    throw new Error(err.message || 'Không thể đăng nhập tài khoản mẫu');
  }
  return res.json();
}

export async function logoutApi(user) {
  const res = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    throw new Error('Lỗi khi đăng xuất');
  }
  return res.json();
}

export async function fetchCurrentSession(user) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Phiên đăng nhập không hợp lệ' }));
    throw new Error(err.message || 'Phiên đăng nhập không hợp lệ');
  }
  return res.json();
}

// ==================== PROFILE & LEARNING GOALS ====================

export async function fetchMyProfile(user) {
  const res = await fetch(`${API_BASE_URL}/me/profile`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    throw new Error('Không thể tải hồ sơ cá nhân');
  }
  return res.json();
}

export async function updateMyProfileApi(profileData, user) {
  const res = await fetch(`${API_BASE_URL}/me/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(user),
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi lưu thông tin cá nhân' }));
    throw new Error(err.message || 'Lỗi khi lưu thông tin cá nhân');
  }
  return res.json();
}

export async function updateMyGoalApi(goalData, user) {
  const payload = typeof goalData === 'string' ? { goal: goalData } : goalData;
  const res = await fetch(`${API_BASE_URL}/me/goal`, {
    method: 'PATCH',
    headers: getAuthHeaders(user),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi cập nhật mục tiêu học tập' }));
    throw new Error(err.message || 'Lỗi khi cập nhật mục tiêu học tập');
  }
  return res.json();
}

// ==================== NOTIFICATIONS ====================

export async function fetchMyNotifications(user) {
  const res = await fetch(`${API_BASE_URL}/me/notifications`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    throw new Error('Không thể tải danh sách thông báo');
  }
  return res.json();
}

export async function markNotificationReadApi(notificationId, user) {
  const res = await fetch(`${API_BASE_URL}/me/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Không thể cập nhật thông báo' }));
    throw new Error(err.message || 'Không thể cập nhật thông báo');
  }
  return res.json();
}

export async function markAllNotificationsReadApi(user) {
  const res = await fetch(`${API_BASE_URL}/me/notifications/read-all`, {
    method: 'PATCH',
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Không thể đánh dấu tất cả đã đọc' }));
    throw new Error(err.message || 'Không thể đánh dấu tất cả đã đọc');
  }
  return res.json();
}

// ==================== ADMIN USER MANAGEMENT ====================

export async function fetchAdminUsers(user, params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.q) searchParams.set('q', params.q);
  if (params.role) searchParams.set('role', params.role);
  if (params.status) searchParams.set('status', params.status);
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/admin/users${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Không thể tải danh sách người dùng' }));
    throw new Error(err.message || 'Không thể tải danh sách người dùng');
  }
  return res.json();
}

export async function fetchAdminUserDetail(targetUserId, user) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Không thể tải thông tin tài khoản' }));
    throw new Error(err.message || 'Không thể tải thông tin tài khoản');
  }
  return res.json();
}

export async function updateAdminUserApi(targetUserId, updateData, user) {
  const res = await fetch(`${API_BASE_URL}/admin/users/${targetUserId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(user),
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi cập nhật tài khoản' }));
    throw new Error(err.message || 'Lỗi khi cập nhật tài khoản');
  }
  return res.json();
}