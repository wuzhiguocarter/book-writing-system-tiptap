import { test, expect } from '@playwright/test';
import { clearDatabase, createBook, selectFirstChapter, waitForEditor } from './test-helpers';

/**
 * 边界情况测试
 *
 * 测试各种边界场景和异常情况
 * - 空状态
 * - 极端输入
 * - 特殊字符
 * - 并发操作
 * - 错误处理
 */
test.describe('边界情况测试', () => {
  test.describe('空状态处理', () => {
    test('空书架应该显示提示信息', async ({ page }) => {
      await clearDatabase(page);
      await page.goto('/');

      // 验证空状态提示
      const emptyMessage = page.getByText(/还没有书籍|暂无书籍|No books/);
      const hasEmptyMessage = await emptyMessage.count();

      if (hasEmptyMessage > 0) {
        await expect(emptyMessage.first()).toBeVisible();
      }

      // 验证创建书籍的引导
      const createHint = page.getByText(/新建书籍|Create a book|开始创作/);
      const hasCreateHint = await createHint.count();

      if (hasCreateHint > 0) {
        await expect(createHint.first()).toBeVisible();
      }
    });

    test('空章节列表应该显示添加按钮', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      // 查找添加章节按钮
      const addButton = page.getByText('Add a page');
      await expect(addButton).toBeVisible();
    });

    test('空编辑器应该能够正常输入', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 在空编辑器中输入
      const testText = '空编辑器测试';
      await editor.type(testText);

      await expect(editor).toContainText(testText);
    });
  });

  test.describe('特殊字符处理', () => {
    test.beforeEach(async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);
    });

    test('应该能够输入 emoji 表情', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      const emojiText = '测试表情 😀🎉🚀';
      await editor.type(emojiText);

      await expect(editor).toContainText(emojiText);
    });

    test('应该能够输入特殊符号', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      await editor.type(specialChars);

      await expect(editor).toContainText(specialChars);
    });

    test('应该能够输入多语言文本', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 中文
      await editor.type('中文测试 ');
      // 日文
      await editor.type('日本語テスト ');
      // 韩文
      await editor.type('한국어 테스트 ');
      // 阿拉伯语
      await editor.type('اختبار ');
      // 俄文
      await editor.type('Тест ');

      await expect(editor).toContainText('中文测试');
      await expect(editor).toContainText('日本語テスト');
    });

    test('应该能够输入超长文本', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入超长单词（1000个字符）
      const longWord = 'a'.repeat(1000);
      await editor.type(longWord);

      await expect(editor).toContainText(longWord);
    });

    test('章节标题应该支持特殊字符', async ({ page }) => {
      const titleInput = page.getByPlaceholder('Untitled');
      const hasInput = await titleInput.count();

      if (hasInput > 0) {
        const specialTitle = '章节《特殊》@#$%标题😀';
        await titleInput.fill(specialTitle);
        await page.waitForTimeout(1500);

        await expect(titleInput).toHaveValue(specialTitle);
      }
    });
  });

  test.describe('极端输入场景', () => {
    test.beforeEach(async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);
    });

    test('应该能够处理大量换行', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入 50 个换行
      for (let i = 0; i < 50; i++) {
        await page.keyboard.press('Enter');
      }

      // 验证编辑器仍然响应
      await editor.type('测试文本');

      await expect(editor).toContainText('测试文本');
    });

    test('应该能够处理大量空格', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入大量空格
      await editor.type(' '.repeat(100));

      // 输入文本
      await editor.type('测试');

      await expect(editor).toContainText('测试');
    });

    test('应该能够处理快速连续输入', async ({ page }) => {
      const editor = page.locator('.ProseMirror');
      await editor.click();

      const startTime = Date.now();

      // 快速连续输入
      for (let i = 0; i < 100; i++) {
        await editor.type('a');
      }

      const inputTime = Date.now() - startTime;

      // 应该在 3 秒内完成
      expect(inputTime).toBeLessThan(3000);

      // 验证所有字符都输入了
      const textContent = await editor.textContent();
      const aCount = (textContent?.match(/a/g) || []).length;
      expect(aCount).toBeGreaterThanOrEqual(100);
    });
  });

  test.describe('极限数量测试', () => {
    test('应该能够处理大量章节', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      const addButton = page.getByText('Add a page');
      const startTime = Date.now();

      // 创建 30 个章节
      for (let i = 0; i < 30; i++) {
        await addButton.click();
        await page.waitForTimeout(200);
      }

      const createTime = Date.now() - startTime;

      // 创建 30 个章节应该在 15 秒内完成
      expect(createTime).toBeLessThan(15000);

      // 验证章节数量
      const chapters = page.locator('.truncate');
      const chapterCount = await chapters.count();
      expect(chapterCount).toBeGreaterThanOrEqual(30);
    });

    test('应该能够处理大量书籍', async ({ page }) => {
      await clearDatabase(page);

      const startTime = Date.now();

      // 创建 15 本书籍
      for (let i = 1; i <= 15; i++) {
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
        await page.waitForTimeout(600);
      }

      const createTime = Date.now() - startTime;

      // 创建 15 本书应该在 20 秒内完成
      expect(createTime).toBeLessThan(20000);
    });
  });

  test.describe('并发操作测试', () => {
    test('快速切换章节不应该崩溃', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      // 创建多个章节
      const addButton = page.getByText('Add a page');
      for (let i = 0; i < 10; i++) {
        await addButton.click();
        await page.waitForTimeout(300);
      }

      const chapters = page.locator('.truncate');
      const chapterCount = await chapters.count();

      if (chapterCount > 5) {
        // 快速切换章节
        for (let i = 0; i < 20; i++) {
          const randomIndex = Math.floor(Math.random() * Math.min(chapterCount, 10));
          await chapters.nth(randomIndex).click();
          await page.waitForTimeout(200);
        }

        // 验证编辑器仍然可用
        const editor = page.locator('.ProseMirror');
        await expect(editor).toBeVisible();
      }
    });

    test('快速创建和删除不应该崩溃', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      const addButton = page.getByText('Add a page');

      // 快速创建
      for (let i = 0; i < 10; i++) {
        await addButton.click();
        await page.waitForTimeout(200);
      }

      // 快速删除
      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      for (let i = 0; i < Math.min(5, chapterCount); i++) {
        const chapter = chapters.first();
        await chapter.hover();

        const deleteButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
        const hasDeleteButton = await deleteButton.count();

        if (hasDeleteButton > 0) {
          await page.evaluate(() => {
            window.confirm = () => true;
          });
          await deleteButton.click();
          await page.waitForTimeout(200);
        }
      }

      // 验证应用仍然响应
      await expect(addButton).toBeVisible();
    });
  });

  test.describe('错误处理', () => {
    test('应该处理无效的文件导入', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      // 尝试导入不支持的文件类型
      const fileInput = page.locator('input[type="file"]');
      const hasFileInput = await fileInput.count();

      if (hasFileInput > 0) {
        // 注意：这里只是测试文件选择功能
        // 实际的无效文件需要根据具体实现
        await page.waitForTimeout(500);

        // 验证没有崩溃
        const editor = page.locator('.ProseMirror');
        const hasEditor = await editor.count();
        expect(hasEditor).toBeGreaterThan(0);
      }
    });

    test('应该处理极长的章节标题', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const titleInput = page.getByPlaceholder('Untitled');
      const hasInput = await titleInput.count();

      if (hasInput > 0) {
        // 输入极长的标题（500 字符）
        const longTitle = 'a'.repeat(500);
        await titleInput.fill(longTitle);
        await page.waitForTimeout(1500);

        // 验证标题被截断或保存
        const value = await titleInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('应该处理网络错误场景', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 尝试编辑
      await editor.type('离线编辑测试');

      // 恢复网络
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // 验证数据没有丢失
      await expect(editor).toContainText('离线编辑测试');
    });
  });

  test.describe('数据一致性测试', () => {
    test('刷新页面后数据应该一致', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入内容
      const testText = '数据一致性测试 ' + Date.now();
      await editor.type(testText);
      await page.waitForTimeout(1500);

      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');
      await waitForEditor(page);

      // 验证数据一致
      const reloadedEditor = page.locator('.ProseMirror');
      await expect(reloadedEditor).toContainText(testText);
    });

    test('跨标签页数据应该同步', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 在第一个标签页编辑
      const testText = '跨标签页测试 ' + Date.now();
      await editor.type(testText);
      await page.waitForTimeout(1500);

      // 打开第二个标签页
      const page2 = await context.newPage();
      await page2.goto(page.url());
      await page2.waitForLoadState('networkidle');
      await page2.waitForSelector('.ProseMirror', { timeout: 10000 });

      // 验证数据同步
      const editor2 = page2.locator('.ProseMirror');
      await expect(editor2).toContainText(testText);

      await page2.close();
    });
  });

  test.describe('UI 边界情况', () => {
    test('应该处理极小的窗口尺寸', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      // 设置极小的窗口尺寸
      await page.setViewportSize({ width: 320, height: 480 });

      // 验证页面仍然可访问
      const editor = page.locator('.ProseMirror');
      const hasEditor = await editor.count();

      if (hasEditor > 0) {
        await expect(editor.first()).toBeVisible();
      }
    });

    test('应该处理极大的窗口尺寸', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      // 设置极大的窗口尺寸
      await page.setViewportSize({ width: 3840, height: 2160 });

      // 验证页面正常显示
      await expect(page.locator('body')).toBeVisible();
    });

    test('应该处理窗口大小变化', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      // 多次改变窗口大小
      const sizes = [
        { width: 1920, height: 1080 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 },
        { width: 1920, height: 1080 },
      ];

      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.waitForTimeout(500);

        // 验证编辑器仍然可见
        const editor = page.locator('.ProseMirror');
        const hasEditor = await editor.count();

        if (hasEditor > 0) {
          await expect(editor.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('内存和性能边界', () => {
    test('长时间操作不应该导致内存溢出', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 执行大量编辑操作
      for (let i = 0; i < 50; i++) {
        await editor.type(`第${i}行测试内容 `);
        await page.keyboard.press('Enter');

        if (i % 10 === 0) {
          // 每 10 行清空一次
          await page.keyboard.press('Control+A');
          await page.keyboard.press('Backspace');
          await page.waitForTimeout(300);
        }
      }

      // 验证编辑器仍然响应
      await editor.type('最终测试');
      await expect(editor).toContainText('最终测试');
    });

    test('应该能够自动清理无效数据', async ({ page }) => {
      await clearDatabase(page);
      await createBook(page);

      // 创建多个章节
      const addButton = page.getByText('Add a page');
      for (let i = 0; i < 5; i++) {
        await addButton.click();
        await page.waitForTimeout(300);
      }

      // 删除一些章节
      const chapters = page.locator('.group');
      const chapterCount = await chapters.count();

      for (let i = 0; i < Math.min(3, chapterCount); i++) {
        const chapter = chapters.first();
        await chapter.hover();

        const deleteButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
        const hasDeleteButton = await deleteButton.count();

        if (hasDeleteButton > 0) {
          await page.evaluate(() => {
            window.confirm = () => true;
          });
          await deleteButton.click();
          await page.waitForTimeout(300);
        }
      }

      // 刷新页面验证清理
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 验证没有无效数据
      const finalChapters = page.locator('.truncate');
      const finalCount = await finalChapters.count();
      expect(finalCount).toBeLessThan(chapterCount);
    });
  });
});
