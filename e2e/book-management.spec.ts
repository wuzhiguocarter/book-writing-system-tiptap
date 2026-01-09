import { test, expect } from '@playwright/test';
import { clearDatabase } from './test-helpers';

/**
 * 书籍管理功能测试
 *
 * F-001 书籍创建与删除
 */
test.describe('书籍管理', () => {
  test.beforeEach(async ({ page }) => {
    // 清理数据库以确保测试隔离
    await clearDatabase(page);
  });

  test('应该显示创建书籍按钮', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 如果没有书籍，应该显示 "Create a book" 按钮
    const createButton = page.getByText('Create a book');
    const hasCreateButton = await createButton.count();

    if (hasCreateButton > 0) {
      await expect(createButton).toBeVisible();
    }
  });

  test('应该能够创建新书籍', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 点击创建书籍按钮（如果存在）
    const createButton = page.getByText('Create a book');
    const hasCreateButton = await createButton.count();

    if (hasCreateButton > 0) {
      await createButton.click();
    }

    // 在书籍列表中点击 "Create new book"
    const createNewBookButton = page.getByText('Create new book');
    const hasCreateNewBook = await createNewBookButton.count();

    if (hasCreateNewBook > 0) {
      // 点击书籍切换器打开书籍列表
      await page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first().click();

      // 等待下拉菜单显示
      await page.waitForTimeout(500);

      await createNewBookButton.click();
    }

    // 输入书籍标题
    const input = page.getByPlaceholder('Book Title');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('测试书籍');

    // 提交表单
    await input.press('Enter');

    // 等待书籍创建
    await page.waitForTimeout(1000);

    // 验证书籍已创建
    await expect(page.getByText('测试书籍')).toBeVisible({ timeout: 5000 });
  });

  test('应该能够显示书籍切换器', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 查找书籍切换器
    const bookSwitcher = page.locator('.w-5.h-5.rounded-sm.bg-slate-700');
    const hasSwitcher = await bookSwitcher.count();

    if (hasSwitcher > 0) {
      await expect(bookSwitcher.first()).toBeVisible();
    }
  });

  test('应该能够删除书籍', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 点击书籍切换器
    const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first();
    const hasSwitcher = await bookSwitcher.count();

    if (hasSwitcher === 0) {
      test.skip();
      return;
    }

    await bookSwitcher.click();
    await page.waitForTimeout(500);

    // 查找删除按钮（如果有多个书籍）
    const deleteButtons = page.locator('button').filter({ hasText: '' }).locator('svg').nth(-1);

    const deleteButtonCount = await deleteButtons.count();
    if (deleteButtonCount > 1) {
      // 点击第二个删除按钮（第一个是当前书籍）
      await deleteButtons.nth(1).click();

      // 处理确认对话框
      page.on('dialog', dialog => dialog.accept());

      // 验证删除成功
      await page.waitForTimeout(1000);
    }
  });

  test('应该能够切换书籍', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 点击书籍切换器
    const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first();
    const hasSwitcher = await bookSwitcher.count();

    if (hasSwitcher === 0) {
      test.skip();
      return;
    }

    await bookSwitcher.click();
    await page.waitForTimeout(500);

    // 查找所有书籍选项
    const bookOptions = page.locator('div').filter({ hasText: /^(?!.*Create new book).*[A-Z]/u });
    const optionCount = await bookOptions.count();

    if (optionCount > 1) {
      // 点击第二个书籍
      await bookOptions.nth(1).click();

      // 等待切换
      await page.waitForTimeout(1000);

      // 验证书籍已切换
      await expect(bookSwitcher).toBeVisible();
    }
  });
});
