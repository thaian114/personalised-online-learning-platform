import { test, expect } from '@playwright/test';

test('English lesson, worksheet and lesson-specific quiz persist after reload', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Học viên', exact: true }).click();
  await page.goto('/learn/foundations/1');
  await expect(
    page.getByRole('heading', { name: 'Greetings and introductions', level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText('Introduce yourself using I am and My name is.', { exact: true }),
  ).toBeVisible();
  const worksheet = page.getByRole('link', { name: 'Open printable worksheet and answer key' });
  await expect(worksheet).toHaveAttribute('href', '/materials/foundations-worksheet.html');
  await page.getByRole('link', { name: 'Làm bài kiểm tra', exact: true }).click();
  for (const [index, answer] of [1, 2, 0].entries()) {
    await page.getByRole('radio').nth(answer).check();
    await page
      .getByRole('button', { name: index === 2 ? 'Nộp bài' : 'Câu tiếp theo', exact: true })
      .click();
  }
  await page.getByRole('button', { name: 'Xác nhận nộp bài', exact: true }).click();
  await expect(page.locator('.score-circle strong')).toHaveText('3 / 3');
  await page.reload();
  await expect(page.locator('.score-circle strong')).toHaveText('3 / 3');
  await page.goto('/learn/foundations/1');
  await expect(page.getByRole('button', { name: 'Đã hoàn thành', exact: true })).toBeDisabled();
});

test('both printable worksheets are served with exercises and answer keys', async ({ page }) => {
  for (const course of ['foundations', 'everyday']) {
    await page.goto('/materials/' + course + '-worksheet.html');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.locator('summary').click();
    await expect(page.locator('details')).toHaveAttribute('open', '');
    await expect(page.locator('details')).toContainText(/Answer|studies|Pronouns/);
  }
});
