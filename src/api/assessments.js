// Frontend API Client for Module 3: Assessments & Quizzes
// Connects UI to Node.js backend API

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(user) {
  const headers = { 'Content-Type': 'application/json' };
  if (user?.id) {
    headers['x-user-id'] = user.id;
    headers['x-user-role'] = user.role || 'student';
    headers['x-user-name'] = user.name || '';
  }
  return headers;
}

/**
 * Fetch lesson quiz questions (answers and explanations are stripped on server)
 */
export async function fetchLessonQuiz(courseId, lessonId) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/quiz`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải câu hỏi bài kiểm tra');
  return data;
}

/**
 * Submit answers for lesson quiz and receive graded review with explanations
 */
export async function submitLessonQuizApi(courseId, lessonId, answers, user) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons/${lessonId}/quiz/submit`, {
    method: 'POST',
    headers: getAuthHeaders(user),
    body: JSON.stringify({ answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi khi nộp bài trắc nghiệm');
  return data;
}

/**
 * Fetch 20 placement test questions (answers stripped)
 */
export async function fetchPlacementTest() {
  const res = await fetch(`${API_BASE_URL}/placement/test`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải đề kiểm tra đầu vào');
  return data;
}

/**
 * Submit 20 placement test questions and receive CEFR level classification
 */
export async function submitPlacementTestApi(answers, user) {
  const res = await fetch(`${API_BASE_URL}/placement/submit`, {
    method: 'POST',
    headers: getAuthHeaders(user),
    body: JSON.stringify({ answers }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi khi nộp bài kiểm tra đầu vào');
  return data;
}

/**
 * Submit assignment text or file
 */
export async function submitAssignmentApi(courseId, assignmentId, submissionData, user) {
  const res = await fetch(`${API_BASE_URL}/courses/${courseId}/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(user),
    body: JSON.stringify(submissionData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi khi nộp bài tập');
  return data;
}

/**
 * Instructor: View pending or graded submissions
 */
export async function fetchInstructorSubmissions(filters = {}, user) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE_URL}/instructor/submissions?${params.toString()}`, {
    headers: getAuthHeaders(user),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách bài nộp');
  return data;
}

/**
 * Instructor: Grade a submission (draft or published)
 */
export async function gradeSubmissionApi(submissionId, gradeData, user) {
  const res = await fetch(`${API_BASE_URL}/instructor/submissions/${submissionId}/grade`, {
    method: 'PUT',
    headers: getAuthHeaders(user),
    body: JSON.stringify(gradeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Lỗi khi chấm điểm bài nộp');
  return data;
}
