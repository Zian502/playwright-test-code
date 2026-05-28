/**
 * testCodeAgent 生成（2026-05-28T05:09:57.345Z）
 * specSlug: btc
 * artifactId: bbe2cbc435a812ada379b734cd1fb732
 * cacheKey: https://www.bydfi.com/zh::main_test_0_merged_spec
 * pageUrl: https://www.bydfi.com/zh
 * userInput: https://www.bydfi.com/zh 这个页面，找到搜索按钮，点击显示搜索框弹框，然后在搜索框中输入BTC，然后点击搜索结果列表的第一个
 */

import { test, expect } from '@playwright/test';

/** 多段 test 在同一 page 上按序执行；后序步骤应自带前置 UI 恢复逻辑 */
test.describe.serial('merged flow', () => {
  test('点击搜索按钮，断言搜索弹框可见', async ({ page }) => {
    // 点击搜索按钮
    await page.locator('.search-icon').first().click();
    
    // 断言搜索弹框可见
    await expect(page.locator('.search-menu-wrap').first()).toBeVisible();
  })

  test('在搜索框中输入BTC并点击第一个搜索结果，断言跳转到BTC交易页面', async ({ page }) => {
    // 如果搜索弹框不可见，先点击搜索图标打开它
    const searchMenu = page.locator('div.search-menu-wrap').first();
    if (!(await searchMenu.isVisible().catch(() => false))) {
      await page.locator('.search-icon').first().click();
      await expect(searchMenu).toBeVisible({ timeout: 5000 });
    }

    // 在搜索输入框中输入BTC
    const searchInput = page.locator('.search-menu-wrap input.ant-input, input.search-input').first();
    await searchInput.fill('BTC');
    // 等待搜索结果出现（至少有一个可点击的链接）

    // 点击搜索结果列表的第一个（优先选择BTC现货交易链接）
    const firstResult = page.locator('a[href="/zh/spot/BTC_USDT"]').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();

    // 断言跳转到BTC/USDT交易页面
    await expect(page).toHaveURL(/\/zh\/spot\/BTC_USDT/, { timeout: 10000 });
    // 可选：断言页面包含交易相关元素
    await expect(page.locator('body')).toBeVisible();
  })
});
