// Courses & Lessons Service (Business Logic Layer)
// Handles database operations via Prisma ORM

import prisma from '../../db/prisma.js';
import { validateCoursePayload, validateLessonPayload } from './courses.validation.js';

export function normalizeSearch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function parseCourseOutcomes(course) {
  if (!course) return null;
  let outcomes = [];
  try {
    outcomes =
      typeof course.outcomes === 'string' ? JSON.parse(course.outcomes) : course.outcomes || [];
  } catch (e) {
    outcomes = [];
  }

  const lessonItems = Array.isArray(course.lessons) ? course.lessons : [];
  const count = course.lessonsCount || lessonItems.length || 0;

  return {
    ...course,
    outcomes,
    lessons: count, // number of lessons matching Course entity
    lessonList: lessonItems, // detailed lesson objects when included
    prerequisite: course.prerequisiteId || '', // backward-compatible string id
  };
}

export async function getCoursesList({
  search = '',
  level = '',
  category = '',
  status = 'published',
  sort = 'title',
  page = 1,
  limit = 20,
} = {}) {
  const where = {};

  if (status && status !== 'all') {
    where.status = status;
  }
  if (level) {
    where.level = level;
  }
  if (category) {
    where.category = category;
  }

  // Fetch from database
  let courses = await prisma.course.findMany({
    where,
    include: {
      prerequisite: {
        select: { id: true, title: true, level: true },
      },
      lessons: {
        select: { id: true, title: true, minutes: true, orderIndex: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: sort === 'hours' ? { hours: 'asc' } : { title: 'asc' },
  });

  // Client search keyword normalization matching frontend behavior
  if (search) {
    const normKeyword = normalizeSearch(search);
    courses = courses.filter((c) => {
      const matchTitle = normalizeSearch(c.title).includes(normKeyword);
      const matchDesc = normalizeSearch(c.description).includes(normKeyword);
      const matchCat = normalizeSearch(c.category).includes(normKeyword);
      return matchTitle || matchDesc || matchCat;
    });
  }

  const total = courses.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedCourses = courses
    .slice(startIndex, startIndex + limitNum)
    .map(parseCourseOutcomes);

  return {
    courses: paginatedCourses,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
}

export async function getCourseById(courseId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      prerequisite: {
        select: { id: true, title: true, level: true, status: true },
      },
      lessons: {
        orderBy: { orderIndex: 'asc' },
      },
      instructor: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  return parseCourseOutcomes(course);
}

export async function createCourse(data, user) {
  const validation = validateCoursePayload(data, false);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  // Generate ID / slug
  let courseId = (data.id || data.title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!courseId) {
    courseId = 'course-' + Date.now();
  }

  // Check unique ID
  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (existing) {
    courseId = `${courseId}-${Date.now().toString().slice(-4)}`;
  }

  // Check prerequisite if provided
  if (data.prerequisiteId) {
    const prereq = await prisma.course.findUnique({ where: { id: data.prerequisiteId } });
    if (!prereq) {
      const error = new Error('Khóa học tiên quyết không tồn tại');
      error.status = 400;
      throw error;
    }
  }

  const outcomesStr = JSON.stringify(data.outcomes || []);

  const newCourse = await prisma.course.create({
    data: {
      id: courseId,
      title: data.title.trim(),
      description: data.description.trim(),
      level: data.level || 'Cơ bản',
      category: data.category || 'Giao tiếp',
      hours: Number(data.hours) || 0,
      lessonsCount: 0,
      teacher: data.teacher || user?.name || 'Giảng viên',
      teacherId: user?.id || null,
      learners: 0,
      status: data.status || 'draft',
      prerequisiteId: data.prerequisiteId || null,
      outcomes: outcomesStr,
      reason: data.reason || null,
      art: data.art || 'Book',
      color: data.color || 'indigo',
    },
  });

  return parseCourseOutcomes(newCourse);
}

export async function updateCourse(courseId, data, user) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học cần sửa');
    error.status = 404;
    throw error;
  }

  // Role authorization: only instructor owner or admin can edit
  if (user && user.role !== 'admin' && course.teacherId && course.teacherId !== user.id) {
    const error = new Error('Bạn không có quyền chỉnh sửa khóa học này');
    error.status = 403;
    throw error;
  }

  const validation = validateCoursePayload(data, true);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  // Prevent cycle in prerequisite
  if (data.prerequisiteId) {
    if (data.prerequisiteId === courseId) {
      const error = new Error('Khóa học không thể tự chọn chính mình làm điều kiện tiên quyết');
      error.status = 400;
      throw error;
    }
    const prereq = await prisma.course.findUnique({ where: { id: data.prerequisiteId } });
    if (!prereq) {
      const error = new Error('Khóa học tiên quyết không tồn tại');
      error.status = 400;
      throw error;
    }
    if (prereq.prerequisiteId === courseId) {
      const error = new Error('Phát hiện vòng lặp điều kiện tiên quyết giữa 2 khóa học');
      error.status = 400;
      throw error;
    }
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.level !== undefined) updateData.level = data.level;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.hours !== undefined) updateData.hours = Number(data.hours);
  if (data.status !== undefined) updateData.status = data.status;
  if (data.prerequisiteId !== undefined) updateData.prerequisiteId = data.prerequisiteId || null;
  if (data.outcomes !== undefined) updateData.outcomes = JSON.stringify(data.outcomes);
  if (data.reason !== undefined) updateData.reason = data.reason;
  if (data.art !== undefined) updateData.art = data.art;
  if (data.color !== undefined) updateData.color = data.color;

  const updated = await prisma.course.update({
    where: { id: courseId },
    data: updateData,
  });

  return parseCourseOutcomes(updated);
}

export async function deleteCourse(courseId, user) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học cần xóa');
    error.status = 404;
    throw error;
  }

  if (user && user.role !== 'admin' && course.teacherId && course.teacherId !== user.id) {
    const error = new Error('Bạn không có quyền xóa khóa học này');
    error.status = 403;
    throw error;
  }

  // Soft delete or hide to preserve learning history
  await prisma.course.update({
    where: { id: courseId },
    data: { status: 'hidden' },
  });

  return { success: true, message: 'Đã ẩn khóa học thành công' };
}

// ----------------- LESSONS -----------------

export async function addLesson(courseId, data, user) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });

  if (!course) {
    const error = new Error('Không tìm thấy khóa học để thêm bài học');
    error.status = 404;
    throw error;
  }

  if (user && user.role !== 'admin' && course.teacherId && course.teacherId !== user.id) {
    const error = new Error('Bạn không có quyền thêm bài học vào khóa này');
    error.status = 403;
    throw error;
  }

  const validation = validateLessonPayload(data, false);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  // Next sequential ID (1, 2, 3...)
  const maxLessonId = course.lessons.reduce((max, l) => Math.max(max, l.id), 0);
  const nextId = maxLessonId + 1;
  const minutes = Number(data.minutes) || 15;

  const lesson = await prisma.lesson.create({
    data: {
      id: nextId,
      courseId,
      title: data.title.trim(),
      minutes,
      orderIndex: nextId,
      body: data.body || '',
      videoUrl: data.videoUrl || null,
      summary: data.summary || '',
    },
  });

  // Update course lesson count and approximate hours
  const totalMinutes = course.lessons.reduce((sum, l) => sum + l.minutes, minutes);
  const newHours = Math.round((totalMinutes / 60) * 10) / 10;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      lessonsCount: course.lessons.length + 1,
      hours: newHours,
    },
  });

  return lesson;
}

export async function updateLesson(courseId, lessonId, data, user) {
  const numLessonId = Number(lessonId);
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  if (user && user.role !== 'admin' && course.teacherId && course.teacherId !== user.id) {
    const error = new Error('Bạn không có quyền sửa bài học này');
    error.status = 403;
    throw error;
  }

  const lesson = await prisma.lesson.findUnique({
    where: {
      courseId_id: {
        courseId,
        id: numLessonId,
      },
    },
  });

  if (!lesson) {
    const error = new Error('Không tìm thấy bài học');
    error.status = 404;
    throw error;
  }

  const validation = validateLessonPayload(data, true);
  if (!validation.isValid) {
    const error = new Error(validation.errors.join(' '));
    error.status = 400;
    throw error;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.minutes !== undefined) updateData.minutes = Number(data.minutes);
  if (data.body !== undefined) updateData.body = data.body;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
  if (data.summary !== undefined) updateData.summary = data.summary;

  const updated = await prisma.lesson.update({
    where: {
      courseId_id: {
        courseId,
        id: numLessonId,
      },
    },
    data: updateData,
  });

  return updated;
}

export async function deleteLesson(courseId, lessonId, user) {
  const numLessonId = Number(lessonId);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true },
  });

  if (!course) {
    const error = new Error('Không tìm thấy khóa học');
    error.status = 404;
    throw error;
  }

  if (user && user.role !== 'admin' && course.teacherId && course.teacherId !== user.id) {
    const error = new Error('Bạn không có quyền xóa bài học này');
    error.status = 403;
    throw error;
  }

  await prisma.lesson.delete({
    where: {
      courseId_id: {
        courseId,
        id: numLessonId,
      },
    },
  });

  // Update course count
  const remainingLessons = course.lessons.filter((l) => l.id !== numLessonId);
  const totalMinutes = remainingLessons.reduce((sum, l) => sum + l.minutes, 0);
  const newHours = Math.round((totalMinutes / 60) * 10) / 10;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      lessonsCount: remainingLessons.length,
      hours: newHours,
    },
  });

  return { success: true, message: 'Đã xóa bài học thành công' };
}
