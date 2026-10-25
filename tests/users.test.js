// Automated API tests for Module Users & Accounts (Auth, Profile, Notifications & Admin Users)
import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/backend/app.js';
import prisma from '../src/backend/db/prisma.js';

let server;
let baseUrl;
let createdUserId = null;
let authToken = null;
const testEmail = `test.student.${Date.now()}@example.com`;

test.before(async () => {
  return new Promise((resolve) => {
    // Listen on dynamic port
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  // Clean up test user if created
  if (createdUserId) {
    try {
      await prisma.user.delete({ where: { id: createdUserId } });
    } catch (e) {
      // Ignore if already deleted
    }
  }
  // Ensure seeded 'thu-ha' remains locked (active: false) as in initial seed
  try {
    await prisma.user.update({
      where: { id: 'thu-ha' },
      data: { role: 'student', active: false },
    });
  } catch (e) {
    // Ignore if not seeded
  }

  if (server) server.close();
  await prisma.$disconnect();
});

test('1. POST /api/auth/register should validate input and register a new student', async () => {
  // 1a. Reject short password (< 8 chars)
  const invalidRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Student',
      email: testEmail,
      password: '123',
      confirm: '123',
    }),
  });
  assert.equal(invalidRes.status, 400);

  // 1b. Reject mismatched password confirmation
  const mismatchRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Student',
      email: testEmail,
      password: 'Password@123',
      confirm: 'Different@123',
    }),
  });
  assert.equal(mismatchRes.status, 400);

  // 1c. Successful registration
  const validRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nguyễn Văn Test',
      email: testEmail,
      password: 'Password@123',
      confirm: 'Password@123',
    }),
  });

  const validJson = await validRes.json();
  assert.equal(validRes.status, 201);
  assert.equal(validJson.success, true);
  assert.equal(validJson.user.email, testEmail);
  assert.equal(validJson.user.role, 'student');
  assert.equal(validJson.session.name, 'Nguyễn Văn Test');
  assert.ok(validJson.token);
  assert.equal(validJson.user.password, undefined); // Password must never be exposed

  createdUserId = validJson.user.id;
  authToken = validJson.token;

  // 1d. Reject duplicate email
  const dupRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate User',
      email: testEmail,
      password: 'Password@123',
      confirm: 'Password@123',
    }),
  });
  assert.equal(dupRes.status, 409);
});

test('2. POST /api/auth/login & /api/auth/demo should authenticate active users and block locked accounts', async () => {
  // 2a. Login with newly registered user
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password@123',
    }),
  });
  const loginJson = await loginRes.json();
  assert.equal(loginRes.status, 200);
  assert.equal(loginJson.success, true);
  assert.equal(loginJson.session.userId, createdUserId);
  assert.ok(loginJson.token);

  // 2b. Wrong password should return 401
  const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword@999',
    }),
  });
  assert.equal(wrongPassRes.status, 401);

  // 2c. Locked account (thuha@example.com) should return 403
  const lockedRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'thuha@example.com',
      password: 'Demo@123',
    }),
  });
  assert.equal(lockedRes.status, 403);

  // 2d. Quick demo login by role
  const demoRes = await fetch(`${baseUrl}/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' }),
  });
  const demoJson = await demoRes.json();
  assert.equal(demoRes.status, 200);
  assert.equal(demoJson.session.role, 'student');
});

test('3. GET /api/auth/me & /api/me/profile should return session and profile with Bearer token', async () => {
  // Unauthenticated request should fail with 401
  const unauthRes = await fetch(`${baseUrl}/auth/me`);
  assert.equal(unauthRes.status, 401);

  // Authenticated with Bearer token generated at login/register
  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  const meJson = await meRes.json();
  assert.equal(meRes.status, 200);
  assert.equal(meJson.success, true);
  assert.equal(meJson.session.userId, createdUserId);
  assert.equal(meJson.profile.email, testEmail);
});

test('4. PATCH /api/me/profile & /api/me/goal should update personal info and learning goals', async () => {
  // 4a. Update goal during onboarding
  const goalRes = await fetch(`${baseUrl}/me/goal`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      goal: 'Chuẩn bị thi cử',
      dailyMinutes: 45,
    }),
  });
  const goalJson = await goalRes.json();
  assert.equal(goalRes.status, 200);
  assert.equal(goalJson.profile.goal, 'Chuẩn bị thi cử');
  assert.equal(goalJson.profile.dailyMinutes, 45);

  // 4b. Update profile name and dailyMinutes
  const profileRes = await fetch(`${baseUrl}/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      name: 'Nguyễn Quang Học Viên',
      dailyMinutes: 30,
    }),
  });
  const profileJson = await profileRes.json();
  assert.equal(profileRes.status, 200);
  assert.equal(profileJson.profile.name, 'Nguyễn Quang Học Viên');
  assert.equal(profileJson.profile.dailyMinutes, 30);
  assert.equal(profileJson.session.name, 'Nguyễn Quang Học Viên');

  // 4c. Reject invalid dailyMinutes (e.g., 25 is not in [10, 20, 30, 45, 60])
  const badMinutesRes = await fetch(`${baseUrl}/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ dailyMinutes: 25 }),
  });
  assert.equal(badMinutesRes.status, 400);

  // 4d. Reject email already used by another account
  const conflictEmailRes = await fetch(`${baseUrl}/me/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ email: 'minhanh@example.com' }),
  });
  assert.equal(conflictEmailRes.status, 409);
});

test('5. GET & PATCH /api/me/notifications should list and mark notifications as read', async () => {
  // List notifications for newly registered user (has 1 welcome notification)
  const listRes = await fetch(`${baseUrl}/me/notifications`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const listJson = await listRes.json();
  assert.equal(listRes.status, 200);
  assert.equal(listJson.success, true);
  assert.ok(Array.isArray(listJson.notifications));
  assert.ok(listJson.notifications.length >= 1);
  assert.equal(listJson.notifications[0].read, false);

  const firstNotifId = listJson.notifications[0].id;

  // Mark single notification as read
  const readOneRes = await fetch(`${baseUrl}/me/notifications/${firstNotifId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authToken}` },
  });
  const readOneJson = await readOneRes.json();
  assert.equal(readOneRes.status, 200);
  assert.equal(readOneJson.data.read, true);

  // Mark all notifications as read for minh-anh
  const readAllRes = await fetch(`${baseUrl}/me/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      'x-user-id': 'minh-anh',
      'x-user-role': 'student',
    },
  });
  const readAllJson = await readAllRes.json();
  assert.equal(readAllRes.status, 200);
  assert.ok(readAllJson.notifications.every((n) => n.read === true));
});

test('6. GET /api/admin/users should enforce admin role and support search/filters', async () => {
  // Student cannot access admin users list
  const forbiddenRes = await fetch(`${baseUrl}/admin/users`, {
    headers: {
      'x-user-id': 'minh-anh',
      'x-user-role': 'student',
    },
  });
  assert.equal(forbiddenRes.status, 403);

  // Admin can list and filter users (diacritic-insensitive search)
  const searchRes = await fetch(`${baseUrl}/admin/users?q=hoang nam&role=student`, {
    headers: {
      'x-user-id': 'admin',
      'x-user-role': 'admin',
    },
  });
  const searchJson = await searchRes.json();
  assert.equal(searchRes.status, 200);
  assert.equal(searchJson.success, true);
  assert.ok(searchJson.users.some((u) => u.id === 'hoang-nam'));

  // Filter locked accounts
  const lockedListRes = await fetch(`${baseUrl}/admin/users?status=locked`, {
    headers: {
      'x-user-id': 'admin',
      'x-user-role': 'admin',
    },
  });
  const lockedListJson = await lockedListRes.json();
  assert.equal(lockedListRes.status, 200);
  assert.ok(lockedListJson.users.every((u) => u.active === false));
});

test('7. PATCH /api/admin/users/:id should update user status/role and prevent self-lockout', async () => {
  // 7a. Admin unlocks 'thu-ha'
  const unlockRes = await fetch(`${baseUrl}/admin/users/thu-ha`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'admin',
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ active: true }),
  });
  const unlockJson = await unlockRes.json();
  assert.equal(unlockRes.status, 200);
  assert.equal(unlockJson.user.active, true);
  assert.ok(unlockJson.audit);

  // 7b. Admin cannot lock or change their own role
  const selfLockRes = await fetch(`${baseUrl}/admin/users/admin`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'admin',
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ active: false }),
  });
  assert.equal(selfLockRes.status, 400);

  // 7c. Lock 'thu-ha' back to restore initial state
  const relockRes = await fetch(`${baseUrl}/admin/users/thu-ha`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'admin',
      'x-user-role': 'admin',
    },
    body: JSON.stringify({ active: false }),
  });
  assert.equal(relockRes.status, 200);
  assert.equal(relockRes.status, 200);
});