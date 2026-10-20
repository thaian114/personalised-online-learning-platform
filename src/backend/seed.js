// Seed script for Prisma database
// Imports default courses, lessons, questions, and assignments matching src/data.js

import prisma from './db/prisma.js';
import {
  initialCourses,
  initialUsers,
  getLessons,
  quizQuestions,
  placementQuestions,
  defaultAssignment,
  initialSubmissions,
} from '../data.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Users
  for (const user of initialUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        active: user.active ?? true,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        active: user.active ?? true,
      },
    });
  }
  console.log('✅ Seeded users successfully');

  // Find instructor user to link courses
  const instructor = await prisma.user.findFirst({ where: { role: 'instructor' } });

  // 2. Seed Courses (without prerequisite first to avoid foreign key error)
  for (const c of initialCourses) {
    await prisma.course.upsert({
      where: { id: c.id },
      update: {
        title: c.title,
        description: c.description,
        level: c.level,
        category: c.category,
        hours: c.hours,
        lessonsCount: c.lessons,
        teacher: c.teacher,
        learners: c.learners,
        status: c.status,
        outcomes: JSON.stringify(c.outcomes || []),
        reason: c.reason || null,
        art: c.art || 'Book',
        color: c.color || 'indigo',
        teacherId: instructor ? instructor.id : null,
      },
      create: {
        id: c.id,
        title: c.title,
        description: c.description,
        level: c.level,
        category: c.category,
        hours: c.hours,
        lessonsCount: c.lessons,
        teacher: c.teacher,
        learners: c.learners,
        status: c.status,
        outcomes: JSON.stringify(c.outcomes || []),
        reason: c.reason || null,
        art: c.art || 'Book',
        color: c.color || 'indigo',
        teacherId: instructor ? instructor.id : null,
      },
    });
  }

  // 3. Link Prerequisites
  for (const c of initialCourses) {
    if (c.prerequisite) {
      await prisma.course.update({
        where: { id: c.id },
        data: { prerequisiteId: c.prerequisite },
      });
    }
  }
  console.log('✅ Seeded courses and prerequisites successfully');

  // 4. Seed Lessons for each course
  for (const c of initialCourses) {
    const lessonsList = getLessons(c);

    for (const l of lessonsList) {
      const title = l.title || `Lesson ${l.id}: Key Concepts`;
      const minutes = l.minutes || 15;
      await prisma.lesson.upsert({
        where: {
          courseId_id: {
            courseId: c.id,
            id: l.id,
          },
        },
        update: {
          title,
          minutes,
          orderIndex: l.id,
          body: `Nội dung chi tiết cho bài học: ${title}. Bao gồm phần lý thuyết, từ vựng và các ví dụ minh họa ngữ cảnh.`,
          summary: `Tóm tắt bài học ${title} - Những điểm ngữ pháp và từ vựng trọng tâm cần ghi nhớ.`,
        },
        create: {
          id: l.id,
          courseId: c.id,
          title,
          minutes,
          orderIndex: l.id,
          body: `Nội dung chi tiết cho bài học: ${title}. Bao gồm phần lý thuyết, từ vựng và các ví dụ minh họa ngữ cảnh.`,
          summary: `Tóm tắt bài học ${title} - Những điểm ngữ pháp và từ vựng trọng tâm cần ghi nhớ.`,
        },
      });
    }
  }
  console.log('✅ Seeded lessons successfully');

  // 5. Seed Questions (Quiz & Placement) with natural IDs
  await prisma.question.deleteMany({});
  for (let i = 0; i < quizQuestions.length; i++) {
    const q = quizQuestions[i];
    await prisma.question.upsert({
      where: {
        type_id: {
          type: 'lesson_quiz',
          id: q.id,
        },
      },
      update: {
        prompt: q.prompt,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
        orderIndex: i + 1,
      },
      create: {
        id: q.id,
        type: 'lesson_quiz',
        prompt: q.prompt,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
        orderIndex: i + 1,
      },
    });
  }

  for (let i = 0; i < placementQuestions.length; i++) {
    const q = placementQuestions[i];
    await prisma.question.upsert({
      where: {
        type_id: {
          type: 'placement',
          id: q.id,
        },
      },
      update: {
        prompt: q.prompt,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
        orderIndex: i + 1,
      },
      create: {
        id: q.id,
        type: 'placement',
        prompt: q.prompt,
        options: JSON.stringify(q.options),
        answer: q.answer,
        explanation: q.explanation,
        orderIndex: i + 1,
      },
    });
  }
  console.log('✅ Seeded quiz and placement questions successfully');

  // 6. Seed Default Assignment for Foundations
  const asgId = 'asg-foundations-1';
  await prisma.assignment.upsert({
    where: { id: asgId },
    update: {
      title: defaultAssignment.title,
      prompt: defaultAssignment.prompt,
      due: new Date(defaultAssignment.due),
    },
    create: {
      id: asgId,
      courseId: 'foundations',
      title: defaultAssignment.title,
      prompt: defaultAssignment.prompt,
      due: new Date(defaultAssignment.due),
    },
  });
  console.log('✅ Seeded assignment successfully');

  // 7. Seed Initial Submissions
  for (const sub of initialSubmissions) {
    await prisma.submission.upsert({
      where: { id: sub.id },
      update: {
        assignmentId: asgId,
        courseId: sub.courseId,
        studentName: sub.name,
        title: sub.title,
        filename: sub.filename,
        text: sub.text,
        status: sub.status,
        score: typeof sub.score === 'number' ? sub.score : null,
        feedback: sub.feedback || null,
        submittedAt: new Date(sub.createdAt),
      },
      create: {
        id: sub.id,
        userId: sub.userId,
        assignmentId: asgId,
        courseId: sub.courseId,
        studentName: sub.name,
        title: sub.title,
        filename: sub.filename,
        text: sub.text,
        status: sub.status,
        score: typeof sub.score === 'number' ? sub.score : null,
        feedback: sub.feedback || null,
        submittedAt: new Date(sub.createdAt),
      },
    });
  }
  console.log('✅ Seeded initial submissions successfully');

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
