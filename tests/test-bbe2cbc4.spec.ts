/**
 * testCodeAgent 生成（2026-05-28T12:30:10.238Z）
 * specSlug: test-bbe2cbc4
 * artifactId: bbe2cbc435a812ada379b734cd1fb732
 * cacheKey: https://www.bydfi.com/zh::main_test_0_merged_spec
 * pageUrl: https://www.bydfi.com/zh
 * userInput: https://www.bydfi.com/zh，找到快速充值按钮，点击，跳转到充值页面，选择网络，然后选择ETH
 */

import { test, expect } from '@playwright/test';

/** 多段 test 在同一 page 上按序执行；后序步骤应自带前置 UI 恢复逻辑 */
test.describe.serial('merged flow', () => {
  test('点击快速充值按钮，跳转到充值页面', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForLoadState('domcontentloaded');
    
    // 查找快速充值按钮 - 使用页面中可能存在的快速充值相关元素
    // 根据页面结构，快速充值按钮可能在快捷買幣菜单中或作为独立按钮存在
    const quickRechargeButton = page.locator('button:has-text("快速充值"), a:has-text("快速充值"), div:has-text("快速充值")').first();
    
    // 如果找不到快速充值按钮，尝试通过快捷買幣菜单进入
    if (await quickRechargeButton.count() === 0) {
      // 点击快捷買幣菜单
      const quickBuyMenu = page.locator('div.header-menu:has(div:contains("快捷買幣"))').first();
      await expect(quickBuyMenu).toBeVisible({ timeout: 10000 });
      await quickBuyMenu.click();
      
      // 等待下拉菜单出现并查找快速充值选项
      const rechargeOption = page.locator('div:has-text("快速充值")').first();
      await expect(rechargeOption).toBeVisible({ timeout: 5000 });
      await rechargeOption.click();
    } else {
      // 直接点击快速充值按钮
      await expect(quickRechargeButton).toBeVisible({ timeout: 10000 });
      await quickRechargeButton.click();
    }
    
    // 断言跳转到充值页面 - 检查URL是否包含充值相关路径
    await expect(page).toHaveURL(/\/zh\/(deposit|recharge|wallet\/deposit)/, { timeout: 10000 });
    
    // 或者检查充值页面特有的元素
    const depositPageElement = page.locator('div:has-text("充值"), div:has-text("存款"), div:has-text("Deposit")').first();
    await expect(depositPageElement).toBeVisible({ timeout: 10000 });
  })

  test('在充值页面选择网络并选择ETH，断言ETH被选中', async ({ page }) => {
    // 检查当前是否在充值页面，如果不在则先导航到充值页面
    const currentUrl = page.url();
    if (!currentUrl.includes('/finance/deposit') && !currentUrl.includes('/deposit')) {
      // 尝试点击快速充值按钮（假设前序步骤已实现，这里作为独立执行的前置操作）
      // 由于DSL中没有快速充值按钮，我们尝试通过常见选择器定位
      const quickDepositBtn = page.locator('button:has-text("快速充值"), a:has-text("快速充值"), .quick-deposit, [class*="quick"][class*="deposit"]').first();
      if (await quickDepositBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await quickDepositBtn.click();
        // 等待充值页面加载
        await page.waitForURL(/\/zh\/(finance\/)?deposit/, { timeout: 10000 });
      } else {
        // 如果找不到快速充值按钮，直接导航到充值页面
        await page.goto('https://www.bydfi.com/zh/finance/deposit', { waitUntil: 'domcontentloaded' });
      }
    }

    // 等待充值页面加载完成
    await page.waitForURL(/\/zh\/(finance\/)?deposit/, { timeout: 10000 });

    // 查找网络选择区域 - 通常充值页面有网络选择下拉框或按钮
    // 尝试多种常见选择器定位网络选择器
    const networkSelector = page.locator(
      '.network-select, [class*="network"][class*="select"], ' +
      '.chain-select, [class*="chain"][class*="select"], ' +
      'select:has(option[value*="ETH"]), ' +
      '.ant-select:has(.ant-select-selection-item:has-text("网络")), ' +
      '.ant-select:has(.ant-select-selection-placeholder:has-text("网络")), ' +
      'button:has-text("选择网络"), ' +
      'div:has-text("选择网络")'
    ).first();

    // 如果网络选择器可见，点击它
    if (await networkSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await networkSelector.click();
    } else {
      // 尝试查找包含"网络"文字的容器并点击
      const networkLabel = page.locator('text=网络, text=Network, text=選擇網絡').first();
      if (await networkLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
        await networkLabel.click();
      }
    }

    // 等待网络选项列表出现

    // 选择ETH网络 - 查找包含ETH的选项
    const ethOption = page.locator(
      '.ant-select-item-option:has-text("ETH"), ' +
      '.ant-select-item-option:has-text("Ethereum"), ' +
      'li:has-text("ETH"), ' +
      'div[class*="option"]:has-text("ETH"), ' +
      'div[class*="item"]:has-text("ETH")'
    ).first();

    await expect(ethOption).toBeVisible({ timeout: 5000 });
    await ethOption.click();

    // 断言ETH被选中 - 检查选中状态
    const selectedNetwork = page.locator(
      '.ant-select-selection-item:has-text("ETH"), ' +
      '.ant-select-selection-item:has-text("Ethereum"), ' +
      '[class*="selected"]:has-text("ETH"), ' +
      '[class*="active"]:has-text("ETH"), ' +
      'button[class*="active"]:has-text("ETH"), ' +
      'div[class*="selected"]:has-text("ETH")'
    ).first();

    await expect(selectedNetwork).toBeVisible({ timeout: 5000 });
  })
});
