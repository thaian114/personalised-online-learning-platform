// Frontend API Client for Module 1: Courses & Lessons
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

export async function fetchPublishedCourses(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.level) searchParams.set('level', params.level);
  if (params.category) searchParams.set('category', params.category);
  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);

  const res = await fetch(`${API_BASE_URL}/courses?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Không thể tải danh sách khóa học');
  return res.json();
}

export async function fetchCourseDetail(courseId) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}`);
  if (!res.ok) throw new Error('Không thể tải chi tiết khóa học');
  return res.json();
}

export async function fetchInstructorCourses(user, params = {}) {
  const searchParams = new URLSearchParams(params);
  const res = await fetch(`${API_BASE_URL}/instructor/courses?${searchParams.toString()}`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) throw new Error('Không thể tải danh sách khóa học của bạn');
  return res.json();
}

export async function createCourseApi(courseData, user) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses`, {
    method: 'POST',
    headers: getAuthHeaders(user),
    body: JSON.stringify(courseData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi tạo khóa học' }));
    throw new Error(err.message || 'Lỗi khi tạo khóa học');
  }
  return res.json();
}

export async function updateCourseApi(courseId, courseData, user) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}`, {
    method: 'PUT',
    headers: getAuthHeaders(user),
    body: JSON.stringify(courseData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi cập nhật khóa học' }));
    throw new Error(err.message || 'Lỗi khi cập nhật khóa học');
  }
  return res.json();
}

export async function addLessonApi(courseId, lessonData, user) {
  const res = await fetch(`${API_BASE_URL}/instructor/courses/${courseId}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(user),
    body: JSON.stringify(lessonData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Lỗi khi thêm bài học' }));
    throw new Error(err.message || 'Lỗi khi thêm bài học');
  }
  return res.json();
}
