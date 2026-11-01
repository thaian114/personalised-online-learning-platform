import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import prisma from '../src/backend/db/prisma.js';
import { interimLessons } from '../src/course-content.js';
import { verifyPassword } from '../src/backend/modules/users/users.service.js';

test.after(async () => prisma.$disconnect());

test('seeded lessons match curated material and reseeding preserves row counts', async () => {
  const before = await prisma.lesson.count();
  for (const [key, content] of Object.entries(interimLessons)) {
    const [courseId, lessonId] = key.split(':');
    const lesson = await prisma.lesson.findUnique({
      where: { courseId_id: { courseId, id: Number(lessonId) } },
    });
    assert.ok(lesson.body.includes(content.body));
    assert.equal(lesson.summary, content.summary);
  }
  const user = await prisma.user.findUnique({ where: { id: 'minh-anh' } });
  assert.notEqual(user.password, 'Demo@123');
  assert.equal(verifyPassword('Demo@123', user.password), true);
  const result = spawnSync(process.execPath, ['src/backend/seed.js'], {
    env: process.env,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await prisma.lesson.count(), before);
  assert.equal(await prisma.course.count(), 6);
});
