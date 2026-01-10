import { test, expect } from '@playwright/test';
import { clearDatabase, createBook, selectFirstChapter, waitForEditor } from './test-helpers';

/**
 * 性能测试
 *
 * 验证应用在各种场景下的性能表现
 * - 页面加载时间
 * - 编辑器响应时间
 * - 大文档渲染性能
 * - 内存使用情况
 */
test.describe('性能测试', () => {
  test.describe('页面加载性能', () => {
    test('首页加载时间应该在合理范围内', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // 首页应该在 3 秒内加载完成
      expect(loadTime).toBeLessThan(3000);
    });

    test('编辑器页面加载时间应该在合理范围内', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);

      const startTime = Date.now();

      await page.reload();
      await page.waitForLoadState('networkidle');
      await waitForEditor(page);

      const loadTime = Date.now() - startTime;

      // 编辑器应该在 4 秒内加载完成
      expect(loadTime).toBeLessThan(4000);
    });

    test('应该快速响应页面导航', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);

      // 测试从首页到编辑器的导航时间
      const startTime = Date.now();

      await page.goto('/');

      // 点击书籍
      const bookCard = page.locator('.rounded-xl.border').first();
      if (await bookCard.count() > 0) {
        await bookCard.click();
        await waitForEditor(page);

        const navigationTime = Date.now() - startTime;

        // 导航应该在 2 秒内完成
        expect(navigationTime).toBeLessThan(2000);
      }
    });
  });

  test.describe('编辑器性能', () => {
    test.beforeEach(async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);
    });

    test('快速输入时不应该有卡顿', async ({ page }) => {
      test.setTimeout(60000);
      const editor = page.locator('.ProseMirror');
      await editor.click();

      const startTime = Date.now();

      // 快速输入 100 个字符
      for (let i = 0; i < 10; i++) {
        await editor.type('快速输入测试文本行 ', { delay: 10 });
        await page.keyboard.press('Enter');
      }

      const inputTime = Date.now() - startTime;

      // 100 个字符应该在 2 秒内输入完成
      expect(inputTime).toBeLessThan(2000);

      // 验证所有文本都已输入
      await expect(editor).toContainText('快速输入测试文本行');
    });

    test('格式化操作应该快速响应', async ({ page }) => {
      test.setTimeout(60000);
      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入一些文本
      await editor.type('这是测试文本');

      // 测试格式化按钮响应时间
      const startTime = Date.now();

      const boldButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
      await boldButton.click();

      const formatTime = Date.now() - startTime;

      // 格式化操作应该在 500ms 内完成
      expect(formatTime).toBeLessThan(500);
    });

    test('删除操作应该快速响应', async ({ page }) => {
      test.setTimeout(60000);
      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入大量文本
      for (let i = 0; i < 10; i++) {
        await editor.type(`第${i}行测试文本`);
        await page.keyboard.press('Enter');
      }

      // 测试全选和删除的响应时间
      const startTime = Date.now();

      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');

      const deleteTime = Date.now() - startTime;

      // 删除操作应该在 500ms 内完成
      expect(deleteTime).toBeLessThan(500);
    });
  });

  test.describe('大文档性能', () => {
    test('应该能够渲染包含大量标题的文档', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 创建包含 50 个标题的文档
      const startTime = Date.now();

      for (let i = 1; i <= 50; i++) {
        await editor.type(`# 第${i}章`);
        await page.keyboard.press('Enter');
        await editor.type(`这是第${i}章的内容。`);
        await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
      }

      const creationTime = Date.now() - startTime;

      // 创建 50 个标题应该在 10 秒内完成
      expect(creationTime).toBeLessThan(10000);

      // 验证编辑器仍然响应
      await expect(editor).toBeVisible();
    });

    test('目录更新不应该影响编辑器性能', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 创建大量标题
      for (let i = 1; i <= 30; i++) {
        await editor.type(`## 节${i}`);
        await page.keyboard.press('Enter');
        await editor.type('内容');
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(2000);

      // 测试继续输入的响应时间
      const startTime = Date.now();

      await editor.type('新内容');

      const responseTime = Date.now() - startTime;

      // 输入响应应该在 300ms 内完成
      expect(responseTime).toBeLessThan(300);
    });

    test('滚动大文档应该流畅', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 创建长文档
      for (let i = 0; i < 100; i++) {
        await editor.type(`这是第${i}行内容，用于测试滚动性能。`);
        await page.keyboard.press('Enter');
      }

      await page.waitForTimeout(1000);

      // 测试滚动性能
      const startTime = Date.now();

      const editorContainer = page.locator('#editor-scroll-container');
      await editorContainer.evaluate(async (el) => {
        // 模拟快速滚动
        let scrollTop = 0;
        const scrollStep = 100;
        const steps = 20;

        for (let i = 0; i < steps; i++) {
          scrollTop += scrollStep;
          el.scrollTop = scrollTop;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      });

      const scrollTime = Date.now() - startTime;

      // 滚动应该在合理时间内完成
      expect(scrollTime).toBeLessThan(3000);
    });
  });

  test.describe('内存性能', () => {
    test('长时间编辑不应该导致内存泄漏', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 获取初始内存使用
      const initialMetrics = await page.metrics();
      const initialMemory = initialMetrics.JSHeapUsedSize;

      // 执行大量编辑操作
      for (let i = 0; i < 20; i++) {
        await editor.type(`测试行${i}: `);
        await editor.type('A'.repeat(50));
        await page.keyboard.press('Enter');

        // 每 5 行删除一次
        if (i % 5 === 4) {
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Backspace');
        }

        await page.waitForTimeout(100);
      }

      // 等待垃圾回收
      await page.waitForTimeout(2000);

      // 获取最终内存使用
      const finalMetrics = await page.metrics();
      const finalMemory = finalMetrics.JSHeapUsedSize;

      // 内存增长不应该超过 50MB
      const memoryGrowth = (finalMemory - initialMemory) / (1024 * 1024);
      expect(memoryGrowth).toBeLessThan(50);
    });

    test('切换章节应该释放前一个章节的资源', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);

      // 创建多个章节
      const addButton = page.getByText('Add a page');
      for (let i = 0; i < 5; i++) {
        await addButton.click();
        await page.waitForTimeout(500);
      }

      const chapters = page.locator('.truncate');
      const chapterCount = await chapters.count();

      if (chapterCount > 0) {
        // 获取初始内存
        const initialMetrics = await page.metrics();
        const initialMemory = initialMetrics.JSHeapUsedSize;

        // 在多个章节间切换
        for (let i = 0; i < Math.min(10, chapterCount); i++) {
          const chapterIndex = i % chapterCount;
          await chapters.nth(chapterIndex).click();
          await page.waitForTimeout(500);
        }

        // 等待资源释放
        await page.waitForTimeout(1000);

        // 获取最终内存
        const finalMetrics = await page.metrics();
        const finalMemory = finalMetrics.JSHeapUsedSize;

        // 内存增长不应该超过 30MB
        const memoryGrowth = (finalMemory - initialMemory) / (1024 * 1024);
        expect(memoryGrowth).toBeLessThan(30);
      }
    });
  });

  test.describe('并发操作性能', () => {
    test('快速创建和删除章节不应该卡顿', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);
      await createBook(page);

      const addButton = page.getByText('Add a page');
      const startTime = Date.now();

      // 快速创建 10 个章节
      for (let i = 0; i < 10; i++) {
        await addButton.click();
        await page.waitForTimeout(200);
      }

      const creationTime = Date.now() - startTime;

      // 创建操作应该在 5 秒内完成
      expect(creationTime).toBeLessThan(5000);

      // 快速删除章节
      const deleteStartTime = Date.now();

      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      for (let i = 0; i < Math.min(5, chapterCount); i++) {
        const chapter = chapters.first();
        await chapter.hover();

        const deleteButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
        const hasDeleteButton = await deleteButton.count();

        if (hasDeleteButton > 0) {
          await deleteButton.click();
          page.on('dialog', dialog => dialog.accept());
          await page.waitForTimeout(300);
        }
      }

      const deleteTime = Date.now() - deleteStartTime;

      // 删除操作应该在 3 秒内完成
      expect(deleteTime).toBeLessThan(3000);
    });
  });

  test.describe('数据库性能', () => {
    test('大量书籍的加载时间应该在合理范围内', async ({ page }) => {
      test.setTimeout(60000);
      await clearDatabase(page);

      // 创建 20 本书籍
      const startTime = Date.now();

      for (let i = 1; i <= 20; i++) {
        const createButton = page.getByText('Create a book');
        const hasCreateButton = await createButton.count();

        if (hasCreateButton > 0) {
          await createButton.click();
        } else {
          const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Book/ }).first();
          await bookSwitcher.click();
          await page.waitForTimeout(500);

          const createNewBookButton = page.getByText('Create new book');
          await createNewBookButton.click();
        }

        const input = page.getByPlaceholder('Book Title');
        await input.fill(`书籍 ${i}`);
        await input.press('Enter');
        await page.waitForTimeout(800);
      }

      const creationTime = Date.now() - startTime;

      // 创建 20 本书籍应该在 30 秒内完成
      expect(creationTime).toBeLessThan(30000);

      // 测试加载时间
      const loadStartTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - loadStartTime;

      // 即使有 20 本书，加载时间也不应该超过 5 秒
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
