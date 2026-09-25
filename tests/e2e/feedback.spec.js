import { test, expect } from '@playwright/test';

test('feedback animates, plays distinct cues and respects mute and reduced motion', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.feedbackNotes = [];
    const createOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = createOscillator.call(this);
      const start = oscillator.start.bind(oscillator);
      oscillator.start = (...args) => {
        window.feedbackNotes.push({ frequency: oscillator.frequency.value, state: this.state });
        return start(...args);
      };
      return oscillator;
    };
  });
  await page.goto('/login');
  const sound = page.getByRole('button', { name: 'Âm thanh phản hồi', exact: true });
  await expect(sound).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.feedbackNotes)).toEqual([]);

  const login = page.getByRole('button', { name: 'Đăng nhập', exact: true });
  await login.hover();
  await expect(login).not.toHaveCSS('transform', 'none');
  await page.mouse.move(0, 0);
  await expect(login).toHaveCSS('transform', 'none');
  const box = await login.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect
    .poll(() => login.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a))
    .toBeLessThan(1);
  await page.mouse.move(0, 0);
  await page.mouse.up();

  await page.getByLabel('Địa chỉ email', { exact: true }).fill('minhanh@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password');
  await login.click();
  await expect(page.getByRole('alert')).toContainText('Dùng email tài khoản mẫu');
  await expect.poll(() => page.evaluate(() => window.feedbackNotes.length)).toBe(2);
  const errorNotes = await page.evaluate(() => window.feedbackNotes);
  expect(errorNotes[0].frequency).toBeGreaterThan(errorNotes[1].frequency);
  expect(errorNotes.every((note) => note.state === 'running')).toBe(true);

  await page.getByRole('button', { name: 'Học viên', exact: true }).click();
  await page.goto('/profile');
  const save = page.getByRole('button', { name: 'Lưu thay đổi', exact: true });
  await save.click();
  await expect(page.getByRole('status')).toContainText('Đã lưu thông tin cá nhân');
  await expect.poll(() => page.evaluate(() => window.feedbackNotes.length)).toBe(2);
  const successNotes = await page.evaluate(() => window.feedbackNotes);
  expect(successNotes[0].frequency).toBeLessThan(successNotes[1].frequency);
  await page.getByRole('button', { name: 'Đóng thông báo', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0);

  await sound.click();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  await save.click();
  await expect(page.getByRole('status')).toContainText('Đã lưu thông tin cá nhân');
  expect(await page.evaluate(() => window.feedbackNotes.length)).toBe(2);
  await page.reload();
  await expect(sound).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.feedbackNotes)).toEqual([]);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login');
  await login.hover();
  await expect(login).toHaveCSS('transform', 'none');
  await page.getByLabel('Địa chỉ email', { exact: true }).fill('minhanh@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('wrong-password');
  await login.click();
  await expect(page.getByRole('alert')).toHaveCSS('transform', 'none');
  expect(await page.evaluate(() => window.feedbackNotes)).toEqual([]);
  expect(errors).toEqual([]);
});
