/**
 * testCodeAgent 生成（2026-05-30T04:26:59.960Z）
 * specSlug: test-bbe2cbc4
 * artifactId: bbe2cbc435a812ada379b734cd1fb732
 * cacheKey: https://www.bydfi.com/zh::main_test_0_merged_spec
 * pageUrl: https://www.bydfi.com/zh
 * userInput: https://www.bydfi.com/zh，找到快速充值按钮，点击，跳转到充值页面，点击选择网络，显示下拉框，然后在下拉框中选择ETH
 */

import { test, expect } from '@playwright/test';

/** 多段 test 在同一 page 上按序执行；首段导航至提示词 URL，后序步骤应自带前置 UI 恢复逻辑 */
test.describe.serial('merged flow', () => {
  test('导航到用户需求起始页', async ({ page }) => {
    await page.goto("https://www.bydfi.com/zh", { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  })

  test('点击快速充值按钮，进入充值页面', async ({ page }) => {
    // 等待快速充值按钮可见
    const quickRechargeBtn = page.locator('.login-box .common-button.primary');
    await expect(quickRechargeBtn).toBeVisible({ timeout: 10000 });
    
    // 点击快速充值按钮
    await quickRechargeBtn.click();
  })

  test('点击选择网络触发器，打开网络下拉列表', async ({ page }) => {
    // 检查网络选择触发器是否可见，如果不可见则先点击快速充值按钮进入充值页面
    const networkTrigger = page.locator('.address-input .input input');
    if (!(await networkTrigger.isVisible())) {
      // 点击快速充值按钮（假设在首页）
      await page.goto('https://www.bydfi.com/zh');
      const quickRechargeBtn = page.getByRole('button', { name: '快速充值' });
      await expect(quickRechargeBtn).toBeVisible();
      await quickRechargeBtn.click();
      // 等待充值页面加载
      await expect(page).toHaveURL(/\/recharge/);
    }

    // 等待网络选择触发器可见
    await expect(networkTrigger).toBeVisible();

    // 点击网络选择触发器
    await networkTrigger.click();

    // 断言网络下拉列表已打开
    const networkDropdown = page.locator('.address-input .select-view');
    await expect(networkDropdown).toBeVisible();
  })

  test('在网络下拉列表中选择ETH选项', async ({ page }) => {
    // 检查网络下拉列表是否已打开，如果未打开则先点击触发器
    const networkDropdown = page.locator('.address-input .select-view.show');
    if (!(await networkDropdown.isVisible())) {
      // 点击网络选择触发器
      const networkTrigger = page.locator('.address-input .input input');
      await expect(networkTrigger).toBeVisible();
      await networkTrigger.click();
      // 等待下拉列表出现
      await expect(networkDropdown).toBeVisible({ timeout: 5000 });
    }

    // 在网络下拉列表中选择ETH选项
    const ethOption = page.locator('.address-input .select-view .item').filter({ hasText: /ETH|Ethereum/i });
    await expect(ethOption).toBeVisible();
    await ethOption.click();

    // 断言网络输入框已显示ETH
    const networkInput = page.locator('.address-input .input input');
    await expect(networkInput).toHaveValue(/ETH|Ethereum/i);
  })
});
