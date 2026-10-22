// API Client for Admin Operations & Statistics
// Section 4.6 Rubric: Quản trị & Báo cáo cơ bản

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || `HTTP error ${res.status}`);
    error.status = res.status;
    error.details = data?.details;
    throw error;
  }
  return data;
}

/**
 * Fetch platform overview, course completion rates, learning outcomes, and breakdowns
 * Requires Admin role
 */
export async function getAdminCourseStats(token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request('/admin/courses/stats', { headers });
}

/**
 * Fetch all courses with enrollment and completion statistics for Admin management
 */
export async function getAdminCourses(token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request('/admin/courses', { headers });
}

/**
 * Update course status (published, draft, hidden) by Admin
 */
export async function updateCourseStatus(courseId, status, token = null) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return request(`/admin/courses/${courseId}/status`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status }),
  });
}
