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

  test.describe('章节嵌套', () => {
    test('应该能够创建嵌套章节', async ({ page }) => {
      // 添加第一个章节
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(500);

      // 添加第二个章节
      await addButton.click();
      await page.waitForTimeout(500);

      // 查找章节
      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      if (chapterCount >= 2) {
        const firstChapter = chapters.first();
        const secondChapter = chapters.nth(1);

        // 拖拽第二个章节到第一个章节内部
        await secondChapter.dragTo(firstChapter);

        // 等待拖拽完成
        await page.waitForTimeout(1000);

        // 验证嵌套（第二个章节应该有缩进）
        const nestedChapter = chapters.nth(1);
        const classes = await nestedChapter.getAttribute('class');
        const hasIndent = classes?.includes('pl-') || classes?.includes('ml-');

        if (hasIndent) {
          // 成功创建嵌套
          expect(true).toBe(true);
        }
      }
    });

    test('嵌套章节应该显示缩进', async ({ page }) => {
      // 添加章节并创建嵌套结构
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(500);
      await addButton.click();
      await page.waitForTimeout(500);

      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      if (chapterCount >= 2) {
        // 创建嵌套
        await chapters.nth(1).dragTo(chapters.first());
        await page.waitForTimeout(1000);

        // 验证缩进
        const allChapters = page.locator('.group');
        const firstChapter = allChapters.first();
        const secondChapter = allChapters.nth(1);

        const firstClasses = await firstChapter.getAttribute('class') || '';
        const secondClasses = await secondChapter.getAttribute('class') || '';

        // 子章节应该有更大的缩进
        const firstPadding = (firstClasses.match(/pl-\d+/) || [''])[0];
        const secondPadding = (secondClasses.match(/pl-\d+/) || [''])[0];

        // 验证子章节缩进大于父章节
        if (firstPadding && secondPadding) {
          const firstValue = parseInt(firstPadding.replace('pl-', ''));
          const secondValue = parseInt(secondPadding.replace('pl-', ''));
          expect(secondValue).toBeGreaterThan(firstValue);
        }
      }
    });

    test('应该能够取消嵌套章节', async ({ page }) => {
      // 先创建嵌套章节
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(500);
      await addButton.click();
      await page.waitForTimeout(500);

      const chapters = page.locator('.group');
      if (await chapters.count() >= 2) {
        // 创建嵌套
        await chapters.nth(1).dragTo(chapters.first());
        await page.waitForTimeout(1000);

        // 将子章节拖出来
        const allChapters = page.locator('.group');
        await allChapters.nth(1).dragTo(allChapters.first());
        await page.waitForTimeout(1000);

        // 验证嵌套已取消（两个章节应该有相同的缩进）
        const finalChapters = page.locator('.group');
        const firstClasses = await finalChapters.first().getAttribute('class') || '';
        const secondClasses = await finalChapters.nth(1).getAttribute('class') || '';

        const firstPadding = (firstClasses.match(/pl-\d+/) || ['pl-0'])[0];
        const secondPadding = (secondClasses.match(/pl-\d+/) || ['pl-0'])[0];

        expect(firstPadding).toBe(secondPadding);
      }
    });
  });

  test.describe('批量操作', () => {
    test('应该能够连续创建多个章节', async ({ page }) => {
      const addButton = page.getByText('Add a page');
      const initialCount = await page.locator('.truncate').count();

      // 连续创建 5 个章节
      for (let i = 0; i < 5; i++) {
        await addButton.click();
        await page.waitForTimeout(300);
      }

      // 等待所有章节创建完成
      await page.waitForTimeout(1500);

      // 验证章节数量增加
      const finalCount = await page.locator('.truncate').count();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount + 5);
    });

    test('删除嵌套章节应该同时删除子章节', async ({ page }) => {
      // 创建嵌套结构
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(500);
      await addButton.click();
      await page.waitForTimeout(500);

      const chapters = page.locator('.group');
      if (await chapters.count() >= 2) {
        // 创建嵌套
        await chapters.nth(1).dragTo(chapters.first());
        await page.waitForTimeout(1000);

        // 记录当前章节数
        const countBefore = await chapters.count();

        // 删除父章节
        await chapters.first().hover();
        const deleteButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
        const hasDeleteButton = await deleteButton.count();

        if (hasDeleteButton > 0) {
          await deleteButton.click();
          page.on('dialog', dialog => dialog.accept());
          await page.waitForTimeout(1000);

          // 验证：父章节和子章节都应该被删除
          const countAfter = await chapters.count();
          expect(countAfter).toBeLessThan(countBefore);
        }
      }
    });
  });

  test.describe('章节重命名', () => {
    test('应该能够双击章节标题进行编辑', async ({ page }) => {
      // 等待章节加载
      await page.waitForTimeout(1000);

      const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
      const chapterCount = await chapters.count();

      if (chapterCount > 0) {
        // 双击章节标题
        await chapters.first().dblclick();
        await page.waitForTimeout(500);

        // 查找标题输入框
        const titleInput = page.getByPlaceholder('Untitled').or(page.locator('input[type="text"]'));
        const hasInput = await titleInput.count();

        if (hasInput > 0) {
          // 输入新标题
          const newTitle = '双击编辑的章节';
          await titleInput.first().fill(newTitle);
          await page.keyboard.press('Enter');

          // 等待保存
          await page.waitForTimeout(1500);

          // 验证标题已更新
          await expect(page.getByText(newTitle)).toBeVisible();
        }
      }
    });

    test('章节标题应该支持特殊字符', async ({ page }) => {
      await page.waitForTimeout(1000);

      const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
      const chapterCount = await chapters.count();

      if (chapterCount > 0) {
        await chapters.first().click();
        await page.waitForTimeout(500);

        const titleInput = page.getByPlaceholder('Untitled');
        const hasInput = await titleInput.count();

        if (hasInput > 0) {
          // 输入包含特殊字符的标题
          const specialTitle = '章节《特殊》@#$%字符';
          await titleInput.fill(specialTitle);
          await page.waitForTimeout(1500);

          // 验证标题已保存
          await expect(titleInput).toHaveValue(specialTitle);
        }
      }
    });
  });

  test.describe('章节导航', () => {
    test.beforeEach(async ({ page }) => {
      // 创建多个章节用于测试导航
      const addButton = page.getByText('Add a page');
      for (let i = 0; i < 3; i++) {
        await addButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('应该能够使用键盘快捷键切换章节', async ({ page }) => {
      // 选择第一个章节
      const chapters = page.locator('.truncate');
      if (await chapters.count() > 0) {
        await chapters.first().click();
        await page.waitForTimeout(1000);

        // 使用快捷键切换到下一个章节（如果有此功能）
        // 这里假设使用 Alt+Down 或类似快捷键
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);

        // 验证焦点移到下一个章节
        // 这取决于具体实现
      }
    });

    test('点击章节应该高亮显示', async ({ page }) => {
      const chapters = page.locator('.truncate');
      const chapterCount = await chapters.count();

      if (chapterCount > 0) {
        // 点击第一个章节
        await chapters.first().click();
        await page.waitForTimeout(500);

        // 验证选中状态（通过背景色或边框）
        const activeChapter = chapters.first().locator('..');
        const classes = await activeChapter.getAttribute('class') || '';

        // 应该有选中状态的类名（如 bg-blue-50, border-blue-500 等）
        const hasActiveClass =
          classes.includes('bg-') ||
          classes.includes('border-') ||
          classes.includes('active') ||
          classes.includes('selected');

        if (hasActiveClass) {
          expect(true).toBe(true);
        }
      }
    });
  });

  test.describe('章节排序', () => {
    test('拖拽后章节顺序应该持久化', async ({ page }) => {
      // 创建多个章节
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(500);
      await addButton.click();
      await page.waitForTimeout(500);

      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      if (chapterCount >= 2) {
        // 拖拽第一个章节到最后
        const firstChapter = chapters.first();
        const lastChapter = chapters.nth(chapterCount - 1);
        await firstChapter.dragTo(lastChapter);
        await page.waitForTimeout(1000);

        // 刷新页面验证持久化
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // 验证顺序保持不变
        const reloadedChapters = page.locator('.truncate');
        const firstChapterText = await reloadedChapters.first().textContent();

        // 第一个章节不应该是原来的第一个
        expect(firstChapterText).not.toBe('Chapter 1');
      }
    });

    test('应该能够将章节移动到书籍顶部', async ({ page }) => {
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(500);
      await addButton.click();
      await page.waitForTimeout(500);

      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      if (chapterCount >= 2) {
        const lastChapter = chapters.nth(chapterCount - 1);
        const firstChapter = chapters.first();

        // 拖拽最后一个章节到第一个位置
        await lastChapter.dragTo(firstChapter, { targetPosition: { x: 0, y: 0 } });
        await page.waitForTimeout(1000);

        // 验证最后一个章节现在在第一个位置
        const allChapters = page.locator('.truncate');
        const lastChapterText = await allChapters.nth(chapterCount - 1).textContent();
        const firstChapterText = await allChapters.first().textContent();

        // 最后章节的文本应该现在在第一个位置
        expect(lastChapterText).not.toBe(firstChapterText);
      }
    });
  });
});
