// Validation logic for Users, Auth, Profile & Admin Account Management

export const VALID_ROLES = ['student', 'instructor', 'admin'];

export const VALID_GOALS = [
  'Củng cố nền tảng',
  'Giao tiếp hằng ngày',
  'Học tập và công việc',
  'Chuẩn bị thi cử',
];

export const VALID_DAILY_MINUTES = [10, 20, 30, 45, 60];

export const VALID_CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/**
 * Validate registration payload (POST /api/auth/register)
 */
export function validateRegisterPayload(data = {}) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu đăng ký không hợp lệ.'] };
  }

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Vui lòng nhập họ và tên.');
  } else if (data.name.trim().length > 80) {
    errors.push('Họ và tên không được vượt quá 80 ký tự.');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Địa chỉ email không hợp lệ.');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 8) {
    errors.push('Mật khẩu cần ít nhất 8 ký tự.');
  }

  if (data.confirm !== undefined && data.password !== data.confirm) {
    errors.push('Mật khẩu nhập lại chưa khớp.');
  }

  if (data.role !== undefined && !VALID_ROLES.includes(data.role)) {
    errors.push(`Vai trò '${data.role}' không hợp lệ. Chọn một trong: ${VALID_ROLES.join(', ')}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate login payload (POST /api/auth/login)
 */
export function validateLoginPayload(data = {}) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu đăng nhập không hợp lệ.'] };
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Vui lòng nhập địa chỉ email hợp lệ.');
  }

  if (!data.password || typeof data.password !== 'string' || !data.password.trim()) {
    errors.push('Vui lòng nhập mật khẩu.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user profile update payload (PUT / PATCH /api/me/profile)
 */
export function validateProfilePayload(data = {}, isUpdate = true) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu hồ sơ không hợp lệ.'] };
  }

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Vui lòng nhập họ và tên.');
    } else if (data.name.trim().length > 80) {
      errors.push('Họ và tên không được vượt quá 80 ký tự.');
    }
  }

  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !isValidEmail(data.email)) {
      errors.push('Địa chỉ email không hợp lệ.');
    }
  }

  if (data.goal !== undefined) {
    if (!VALID_GOALS.includes(data.goal)) {
      errors.push(
        `Mục tiêu học tập '${data.goal}' không hợp lệ. Chọn một trong: ${VALID_GOALS.join(', ')}.`,
      );
    }
  }

  if (data.dailyMinutes !== undefined) {
    const minutes = Number(data.dailyMinutes);
    if (!Number.isInteger(minutes) || !VALID_DAILY_MINUTES.includes(minutes)) {
      errors.push(
        `Chọn thời gian học hợp lệ (${VALID_DAILY_MINUTES.join(', ')} phút).`,
      );
    }
  }

  if (data.level !== undefined && data.level !== null) {
    if (!VALID_CEFR_LEVELS.includes(data.level)) {
      errors.push(
        `Trình độ CEFR '${data.level}' không hợp lệ. Chọn một trong: ${VALID_CEFR_LEVELS.join(', ')}.`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate learning goal update payload (PUT / PATCH /api/me/goal)
 */
export function validateGoalPayload(data = {}) {
  const errors = [];

  if (!data || !data.goal || !VALID_GOALS.includes(data.goal)) {
    errors.push(
      `Mục tiêu học tập không hợp lệ. Chọn một trong: ${VALID_GOALS.join(', ')}.`,
    );
  }

  if (data.dailyMinutes !== undefined) {
    const minutes = Number(data.dailyMinutes);
    if (!Number.isInteger(minutes) || !VALID_DAILY_MINUTES.includes(minutes)) {
      errors.push(
        `Chọn thời gian học hợp lệ (${VALID_DAILY_MINUTES.join(', ')} phút).`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate admin account update payload (PUT / PATCH /api/admin/users/:id)
 */
export function validateAdminUserPayload(data = {}) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Dữ liệu cập nhật tài khoản không hợp lệ.'] };
  }

  if (data.role === undefined && data.active === undefined && data.name === undefined) {
    errors.push('Cần cung cấp ít nhất một trường cần cập nhật (role, active hoặc name).');
  }

  if (data.role !== undefined && !VALID_ROLES.includes(data.role)) {
    errors.push(`Vai trò '${data.role}' không hợp lệ. Chọn một trong: ${VALID_ROLES.join(', ')}.`);
  }

  if (data.active !== undefined && typeof data.active !== 'boolean') {
    errors.push('Trạng thái hoạt động (active) phải là kiểu boolean (true/false).');
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Họ và tên không được để trống.');
    } else if (data.name.trim().length > 80) {
      errors.push('Họ và tên không được vượt quá 80 ký tự.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}