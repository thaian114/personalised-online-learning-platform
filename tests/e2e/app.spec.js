import { test, expect } from '@playwright/test';

async function demo(page, role = 'Học viên') {
  await page.goto('/login');
  await page.getByRole('button', { name: role, exact: true }).click();
}

test('a new learner keeps an independent profile and progress when switching demo accounts', async ({
  page,
}) => {
  await page.goto('/register');
  await page.getByLabel('Họ và tên', { exact: true }).fill('Lan Anh');
  await page.getByLabel('Địa chỉ email', { exact: true }).fill('lan@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Demo@123');
  await page.getByLabel('Nhập lại mật khẩu', { exact: true }).fill('Demo@123');
  await page.getByRole('button', { name: 'Tạo hồ sơ dùng thử', exact: true }).click();
  await expect(page).toHaveURL(/onboarding\/goal/);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Chào Lan Anh,' })).toBeVisible();
  await demo(page);
  await expect(page.getByRole('heading', { name: 'Chào Minh Anh,' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tiếp tục bài học', exact: true })).toBeVisible();
  await page.goto('/login');
  await page.getByLabel('Địa chỉ email', { exact: true }).fill('lan@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Demo@123');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Chào Lan Anh,' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Khám phá khóa học', exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tiếp tục bài học', exact: true })).toHaveCount(0);
});

test('learner completes a lesson, submits quiz answers and keeps the result after reload', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  await demo(page);
  await expect(page.getByRole('heading', { name: 'Chào Minh Anh,' })).toBeVisible();
  await page.getByRole('link', { name: 'Tiếp tục bài học', exact: true }).click();
  await page.getByRole('button', { name: 'Đánh dấu hoàn thành', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đã hoàn thành', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Làm bài kiểm tra', exact: true }).click();
  const answers = [1, 2, 1, 2, 1, 2, 1, 2, 2, 1];
  for (const [index, answer] of answers.entries()) {
    await page.getByRole('radio').nth(answer).check();
    await expect(page.locator('input[type=radio]:checked')).toHaveCount(1);
    await page
      .getByRole('button', { name: index === 9 ? 'Nộp bài' : 'Câu tiếp theo', exact: true })
      .click();
  }
  await page.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click();
  await expect(page.locator('.score-circle strong')).toHaveText('10 / 10');
  await page.reload();
  await expect(page.locator('.score-circle strong')).toHaveText('10 / 10');
  await page.getByRole('button', { name: 'Xem lại câu trả lời', exact: true }).click();
  await expect(
    page.getByText('Với chủ ngữ “she”, động từ “go” thêm -es trong thì hiện tại đơn.'),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('search, prerequisites and enrollment cancellation are functional', async ({ page }) => {
  await demo(page);
  await page.goto('/courses');
  await page.getByLabel('Tìm kiếm khóa học', { exact: true }).fill('khongtimthay');
  await expect(page.getByRole('heading', { name: 'Chưa tìm thấy khóa học' })).toBeVisible();
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).last().click();
  await page.goto('/courses/reading');
  await expect(page.getByRole('button', { name: 'Đăng ký học', exact: true })).toBeDisabled();
  await page.goto('/my-courses');
  await page.getByRole('button', { name: 'Hủy đăng ký', exact: true }).first().click();
  await page.getByRole('button', { name: 'Xác nhận hủy', exact: true }).click();
  await expect(page.locator('.course-grid h3', { hasText: 'English Foundations' })).toHaveCount(0);
  await page.goto('/courses/foundations');
  await page.getByRole('button', { name: 'Đăng ký học', exact: true }).click();
  await expect(page).toHaveURL(/learn\/foundations\/4/);
});

test('assignment validation, grading and moderation propagate through the demo', async ({
  page,
}) => {
  await demo(page);
  await page.goto('/assignments/foundations');
  await page.getByRole('button', { name: 'Nộp lại bài', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Nộp bài', exact: true })).toBeDisabled();
  await page
    .getByLabel('Tệp bài làm')
    .setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
  await expect(page.getByRole('alert')).toContainText('Chỉ hỗ trợ tệp PDF hoặc DOCX');
  await page.getByLabel('Tệp bài làm').setInputFiles({
    name: 'my-routine.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n% Luma browser test\n%%EOF'),
  });
  await page
    .getByLabel('Ghi chú cho giảng viên (tùy chọn)')
    .fill('I study English every afternoon.');
  await page.getByRole('button', { name: 'Nộp bài', exact: true }).click();
  await expect(page.getByText('Đã nộp bài · Chờ chấm', { exact: true })).toBeVisible();
  await demo(page, 'Giảng viên');
  await page.goto('/instructor/submissions/sub-minh');
  await page.getByLabel('Điểm', { exact: true }).fill('9');
  await page
    .getByLabel('Nhận xét cho học viên')
    .fill('Bài viết rõ ràng. Chú ý thêm -s với he, she, it.');
  await page.getByRole('button', { name: 'Lưu điểm và gửi phản hồi' }).click();
  await expect(page.getByText('ĐÃ CHẤM', { exact: true })).toBeVisible();
  await demo(page);
  await page.goto('/assignments/foundations');
  await expect(page.locator('.assignment-grade')).toHaveText('9 / 10');
  await demo(page, 'Quản trị viên');
  await page.goto('/admin/reports');
  await page.getByLabel('Ghi chú xử lý').fill('Nội dung quảng cáo không liên quan đến bài học.');
  await page.getByRole('button', { name: 'Ẩn nội dung và xử lý', exact: true }).click();
  await page.goto('/admin/logs');
  await expect(page.getByRole('cell', { name: 'Xử lý báo cáo', exact: true })).toBeVisible();
});

test('instructor saves course content, publishes a course and responds to a learner', async ({
  page,
}) => {
  await demo(page, 'Giảng viên');
  await page.getByRole('link', { name: 'Tạo khóa học', exact: true }).click();
  await page.getByLabel('Tên khóa học', { exact: true }).fill('English at University');
  await page.getByLabel('Mô tả khóa học').fill('Practical English for everyday university life.');
  await page.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
  await expect(page).toHaveURL(/courses\/course-[a-z0-9]+\/edit/);
  const editPath = new URL(page.url()).pathname;
  await page.getByRole('link', { name: 'Soạn bài học', exact: true }).click();
  await page.getByLabel('Tên bài học', { exact: true }).fill('Meeting your classmates');
  await page
    .getByLabel('Nội dung bài học', { exact: true })
    .fill('Hello, I am Minh Anh. What is your name?');
  await page.getByRole('button', { name: 'Lưu bài học', exact: true }).click();
  await expect(
    page.locator('.editor-outline').getByRole('button', { name: /Meeting your classmates/ }),
  ).toBeVisible();
  await page.goto(editPath);
  await page.getByRole('button', { name: 'Xuất bản khóa học', exact: true }).click();
  await page.getByRole('button', { name: 'Xác nhận xuất bản', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đã công khai', exact: true })).toBeDisabled();
  await page.goto('/instructor/courses/foundations/lessons');
  await page
    .getByLabel('Trả lời học viên', { exact: true })
    .fill('Dùng does với he, she, it và động từ nguyên mẫu.');
  await page.getByRole('button', { name: 'Gửi phản hồi thảo luận', exact: true }).click();
  await page.goto('/instructor/courses/foundations/assessments');
  await page.getByLabel('Tên bài tập', { exact: true }).fill('My weekly routine');
  await page.getByRole('button', { name: 'Lưu bài tập', exact: true }).click();
  await demo(page);
  await page.goto('/courses?q=English%20at%20University');
  await expect(
    page.getByRole('heading', { name: 'English at University', exact: true }),
  ).toBeVisible();
  await page.goto('/learn/foundations/4');
  await page.getByRole('button', { name: 'Thảo luận', exact: true }).click();
  await expect(
    page.getByText('Dùng does với he, she, it và động từ nguyên mẫu.', { exact: true }),
  ).toBeVisible();
  await page.goto('/assignments/foundations');
  await expect(
    page.getByRole('heading', { name: 'Writing: My weekly routine', exact: true }),
  ).toBeVisible();
});

test('all main routes render without runtime errors, missing assets or horizontal overflow', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors = [];
  const missing = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (response) => {
    if (response.status() >= 400 && /\/icons\/|\/src\//.test(response.url()))
      missing.push(response.url());
  });
  const routes = {
    'Học viên': [
      '/dashboard',
      '/path',
      '/courses',
      '/courses/foundations',
      '/my-courses',
      '/learn/foundations/4',
      '/quiz/foundations/4',
      '/quiz/foundations/4/result',
      '/assignments/foundations',
      '/progress',
      '/profile',
      '/notifications',
      '/onboarding/goal',
      '/placement',
      '/placement/test',
      '/placement/result',
    ],
    'Giảng viên': [
      '/instructor/courses',
      '/instructor/courses/new/edit',
      '/instructor/courses/foundations/edit',
      '/instructor/courses/foundations/lessons',
      '/instructor/courses/foundations/assessments',
      '/instructor/submissions',
      '/instructor/submissions/sub-minh',
      '/instructor/students',
    ],
    'Quản trị viên': ['/admin', '/admin/users', '/admin/courses', '/admin/reports', '/admin/logs'],
  };
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 844 : 1000 });
    for (const [role, paths] of Object.entries(routes)) {
      await demo(page, role);
      for (const path of paths) {
        await page.goto(path);
        await expect(page.locator('main')).toBeVisible();
        await expect(page.getByText('Trang chưa thể hiển thị', { exact: true })).toHaveCount(0);
        const overflow = await page.evaluate(() => ({
          content: document.documentElement.scrollWidth,
          viewport: innerWidth,
        }));
        expect(overflow.content, path + ' at ' + width).toBeLessThanOrEqual(overflow.viewport + 1);
      }
    }
  }
  expect(errors).toEqual([]);
  expect(missing).toEqual([]);
});
