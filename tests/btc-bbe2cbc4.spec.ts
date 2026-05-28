/**
 * testCodeAgent 生成（2026-05-28T05:05:55.504Z）
 * specSlug: btc
 * artifactId: bbe2cbc435a812ada379b734cd1fb732
 * cacheKey: https://www.bydfi.com/zh::main_test_0_merged_spec
 * pageUrl: https://www.bydfi.com/zh
 * userInput: https://www.bydfi.com/zh 这个页面，找到搜索按钮，点击显示搜索框弹框，然后在搜索框中输入BTC
 */

import { test, expect } from '@playwright/test';

/** 多段 test 在同一 page 上按序执行；后序步骤应自带前置 UI 恢复逻辑 */
test.describe.serial('merged flow', () => {
  test('点击搜索按钮，断言搜索弹框可见', async ({ page }) => {
    // 等待搜索图标可见
    const searchIcon = page.locator('.search-icon').first();
    await expect(searchIcon).toBeVisible({ timeout: 10000 });
    
    // 点击搜索图标
    await searchIcon.click();
    
    // 断言搜索弹框可见
    const searchMenu = page.locator('.search-menu-wrap').first();
    await expect(searchMenu).toBeVisible({ timeout: 5000 });
  })

  test('在搜索框中输入BTC，断言输入内容正确', async ({ page }) => {
    // 检查搜索弹框是否可见，若不可见则先点击搜索按钮
    const searchMenu = page.locator('.search-menu-wrap').first();
    if (!(await searchMenu.isVisible().catch(() => false))) {
      await page.locator('.search-icon').first().click();
      await expect(searchMenu).toBeVisible();
    }

    // 定位搜索输入框并输入BTC
    const searchInput = page.locator('.search-menu-wrap input.ant-input, input.search-input').first();
    await searchInput.fill('BTC');

    // 断言输入内容为BTC
    await expect(searchInput).toHaveValue('BTC');
  })
});
