// Validation logic for Courses & Lessons

export const VALID_LEVELS = ['Cơ bản', 'Trung cấp', 'Nâng cao'];
export const VALID_CATEGORIES = ['Giao tiếp', 'Đọc hiểu', 'Nghe', 'Ngữ pháp', 'Luyện thi'];
export const VALID_STATUSES = ['draft', 'published', 'hidden'];

export function validateCoursePayload(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      errors.push('Tiêu đề khóa học phải có ít nhất 3 ký tự.');
    }
  }

  if (!isUpdate || data.description !== undefined) {
    if (
      !data.description ||
      typeof data.description !== 'string' ||
      data.description.trim().length < 5
    ) {
      errors.push('Mô tả khóa học phải có ít nhất 5 ký tự.');
    }
  }

  if (data.level && !VALID_LEVELS.includes(data.level)) {
    errors.push(
      `Trình độ '${data.level}' không hợp lệ. Chọn một trong: ${VALID_LEVELS.join(', ')}.`,
    );
  }

  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    errors.push(
      `Danh mục '${data.category}' không hợp lệ. Chọn một trong: ${VALID_CATEGORIES.join(', ')}.`,
    );
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push(
      `Trạng thái '${data.status}' không hợp lệ. Chọn một trong: ${VALID_STATUSES.join(', ')}.`,
    );
  }

  if (data.hours !== undefined && (typeof data.hours !== 'number' || data.hours < 0)) {
    errors.push('Thời lượng giờ học phải là số dương.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLessonPayload(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 2) {
      errors.push('Tiêu đề bài học phải có ít nhất 2 ký tự.');
    }
  }

  if (data.minutes !== undefined && (typeof data.minutes !== 'number' || data.minutes <= 0)) {
    errors.push('Thời lượng bài học phải là số nguyên dương.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
