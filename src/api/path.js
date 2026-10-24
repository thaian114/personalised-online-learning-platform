// Frontend API Client for Module 4: Personalised Learning Paths & Recommendations
// Connects UI to Node.js backend DAG and recommendation engine

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
 * Fetch personalized DAG learning path with classified node statuses (completed, unlocked, locked)
 */
export async function fetchPersonalizedLearningPath(user) {
  const res = await fetch(`${API_BASE_URL}/path/me`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) throw new Error('Không thể tải lộ trình học tập cá nhân hóa');
  return res.json();
}

/**
 * Fetch Top-K course recommendations calculated with Multi-factor Scoring and Explainability
 */
export async function fetchPersonalizedRecommendations(user, limit = 4) {
  const res = await fetch(`${API_BASE_URL}/recommendations?limit=${limit}`, {
    headers: getAuthHeaders(user),
  });
  if (!res.ok) throw new Error('Không thể tải danh sách gợi ý khóa học');
  return res.json();
}

/**
 * Fetch evaluation benchmark comparing proposed model with Most Popular baseline
 * Used for demo and final report evidence
 */
export async function fetchRecommendationBenchmark() {
  const res = await fetch(`${API_BASE_URL}/recommendations/benchmark`);
  if (!res.ok) throw new Error('Không thể tải dữ liệu đánh giá đối chuẩn (benchmark)');
  return res.json();
}

/**
 * Update user learning goal in database
 */
export async function updateUserGoal(user, goal) {
  const res = await fetch(`${API_BASE_URL}/me/goal`, {
    method: 'PUT',
    headers: getAuthHeaders(user),
    body: JSON.stringify({ goal }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Không thể cập nhật mục tiêu học tập');
  }
  return res.json();
}
