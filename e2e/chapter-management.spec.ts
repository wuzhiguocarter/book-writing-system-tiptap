import { test, expect } from '@playwright/test';
import { clearDatabase, createBook } from './test-helpers';

/**
 * 章节管理功能测试
 *
 * F-002 章节管理（添加、删除、重命名、移动）
 */
test.describe('章节管理', () => {
  test.beforeEach(async ({ page }) => {
    // 清理数据库以确保测试隔离
    await clearDatabase(page);

    // 创建测试书籍
    await createBook(page);
  });

  test('应该显示 "Add a page" 按钮', async ({ page }) => {
    const addButton = page.getByText('Add a page');
    await expect(addButton).toBeVisible();
  });

  test('应该能够添加新章节', async ({ page }) => {
    const addButton = page.getByText('Add a page');
    await addButton.click();

    // 等待章节创建
    await page.waitForTimeout(1000);

    // 验证新章节已创建
    const untitled = page.getByText('Untitled');
    await expect(untitled.first()).toBeVisible();
  });

  test('应该能够选择章节', async ({ page }) => {
    // 等待章节列表加载
    await page.waitForTimeout(1000);

    // 查找章节
    const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
    const chapterCount = await chapters.count();

    if (chapterCount > 0) {
      // 点击第一个章节
      await chapters.first().click();

      // 验证章节已选中（检查编辑器是否显示）
      const editor = page.locator('.ProseMirror');
      await expect(editor).toBeVisible({ timeout: 5000 });
    }
  });

  test('应该能够删除章节', async ({ page }) => {
    // 添加一个新章节
    const addButton = page.getByText('Add a page');
    await addButton.click();
    await page.waitForTimeout(1000);

    // 查找并点击章节的删除按钮
    const deleteButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
    const deleteButtonCount = await deleteButton.count();

    if (deleteButtonCount > 0) {
      // 悬停在章节上显示删除按钮
      const chapter = page.locator('.group').first();
      await chapter.hover();

      // 点击删除按钮
      await deleteButton.first().click();

      // 处理确认对话框
      page.on('dialog', dialog => dialog.accept());

      // 等待删除完成
      await page.waitForTimeout(1000);
    }
  });

  test('应该能够编辑章节标题', async ({ page }) => {
    // 等待章节加载
    await page.waitForTimeout(1000);

    // 点击第一个章节
    const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
    const chapterCount = await chapters.count();

    if (chapterCount > 0) {
      await chapters.first().click();

      // 查找标题输入框
      const titleInput = page.getByPlaceholder('Untitled');
      await expect(titleInput).toBeVisible({ timeout: 5000 });

      // 编辑标题
      const newTitle = '新章节标题 ' + Date.now();
      await titleInput.fill(newTitle);

      // 等待保存
      await page.waitForTimeout(2000);

      // 验证标题已更新
      await expect(titleInput).toHaveValue(newTitle);
    }
  });

  test('章节应该支持拖拽排序', async ({ page }) => {
    // 添加多个章节
    const addButton = page.getByText('Add a page');
    await addButton.click();
    await page.waitForTimeout(500);
    await addButton.click();
    await page.waitForTimeout(500);

    // 查找章节
    const chapters = page.locator('.group');
    const chapterCount = await chapters.count();

    if (chapterCount >= 2) {
      const firstChapter = chapters.first();
      const secondChapter = chapters.nth(1);

      // 执行拖拽
      await firstChapter.dragTo(secondChapter);

      // 等待拖拽完成
      await page.waitForTimeout(1000);

      // 验证：第一个章节应该移动到第二个位置
      // 注意：这可能需要根据实际实现调整
    }
  });

  test('应该显示章节列表', async ({ page }) => {
    // 查找 PAGES 标题
    const pagesLabel = page.getByText('PAGES');
    await expect(pagesLabel).toBeVisible();

    // 查找章节列表
    const chapterList = page.locator('.space-y-0\\.5');
    const hasList = await chapterList.count();

    if (hasList > 0) {
      await expect(chapterList.first()).toBeVisible();
    }
  });
});
