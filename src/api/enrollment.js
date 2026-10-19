// Frontend API Client for Module 2: Enrollment & Progress
// Connects UI to Node.js backend API

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(user) {
  const headers = { 'Content-Type': 'application/json' };
  if (user?.id) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role || 'student';
  }
  return headers;
}

/**
 * Enroll student into a course
 * Throws error if prerequisite is not 100% completed
 */
export async function enrollCourseApi(courseId, user) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: getAuthHeaders(user),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể đăng ký khóa học');
  }
  return data;
}

/**
 * Unenroll student from a course
 * Progress is preserved in database
 */
export async function unenrollCourseApi(courseId, user) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/unenroll`, {
    method: 'DELETE',
    headers: getAuthHeaders(user),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể hủy đăng ký khóa học');
  }
  return data;
}

/**
 * Fetch list of enrolled course IDs for current student
 */
export async function fetchUserEnrollments(user) {
  const res = await fetch(`${API_BASE_URL}/me/enrollments`, {
    headers: getAuthHeaders(user),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải danh sách khóa học đã đăng ký');
  }
  return data;
}

/**
 * Mark a lesson as completed
 * Idempotent: safe to call multiple times
 * Returns updated completion percentage
 */
export async function completeLessonApi(courseId, lessonId, user) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(user),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể cập nhật tiến độ bài học');
  }
  return data;
}

/**
 * Fetch detailed progress across all courses for current student
 */
export async function fetchUserProgress(user) {
  const res = await fetch(`${API_BASE_URL}/me/progress`, {
    headers: getAuthHeaders(user),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể tải tiến độ học tập');
  }
  return data;
}
