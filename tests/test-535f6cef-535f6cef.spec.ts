import { test, expect } from '@playwright/test';

test('点击登录按钮后登录弹框应可见', async ({ page }) => {
  // 点击登录按钮
  await page.locator('.moonx-login button').click();

  // 断言登录弹框可见（通常登录弹框会有一个 modal 或 dialog 容器）
  // 这里假设登录弹框有一个常见的 class 或 role，可根据实际页面调整
  await expect(page.locator('.ant-modal, [role="dialog"], .login-modal, .moonx-login-modal').first()).toBeVisible();
})

test('在登录弹框中输入账号密码并提交，断言登录成功', async ({ page }, testEnv) => {
  // 等待登录弹框出现（假设弹框包含账号输入框）
  const usernameInput = page.locator('input[type="text"], input[name="username"], input[placeholder*="账号"], input[placeholder*="邮箱"], input[placeholder*="手机"]').first();
  await expect(usernameInput).toBeVisible({ timeout: 10000 });

  // 输入账号
  await usernameInput.fill(testEnv.TEST_USERNAME);

  // 输入密码
  const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="密码"]').first();
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill(testEnv.TEST_PASSWORD);

  // 点击提交按钮（登录按钮）
  const submitButton = page.locator('button[type="submit"], button:has-text("登录"), button:has-text("登入"), .login-button, .submit-button').first();
  await expect(submitButton).toBeEnabled({ timeout: 5000 });
  await submitButton.click();

  // 断言登录成功：等待页面跳转或出现用户信息（如头像、用户名、退出按钮等）
  // 这里假设登录成功后页面会出现用户头像或用户名元素
  await page.waitForTimeout(2000); // 等待可能的跳转
  const userAvatar = page.locator('.user-avatar, .user-info, .header-user, [data-testid="user-avatar"], .account-info').first();
  await expect(userAvatar).toBeVisible({ timeout: 15000 });
})
