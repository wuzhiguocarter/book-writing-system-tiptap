import { test, expect } from '@playwright/test';
import { clearDatabase, createBook, selectFirstChapter, waitForEditor } from './test-helpers';

/**
 * 离线模式测试
 *
 * 验证应用在离线状态下的行为
 * - 离线时编辑功能
 * - 离线时数据持久化
 * - 网络恢复后数据同步
 */
test.describe('离线模式', () => {
  test.describe('离线状态检测', () => {
    test('应该能够检测离线状态', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);

      // 模拟离线
      await context.setOffline(true);

      // 等待离线状态生效
      await page.waitForTimeout(1000);

      // 验证离线提示（如果有）
      const offlineIndicator = page.getByText(/离线|Offline|No Internet/);
      const hasOfflineIndicator = await offlineIndicator.count();

      if (hasOfflineIndicator > 0) {
        await expect(offlineIndicator.first()).toBeVisible();
      }
    });

    test('应该能够检测网络恢复', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);

      // 先离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 恢复网络
      await context.setOffline(false);
      await page.waitForTimeout(1000);

      // 验证离线提示消失（如果有）
      const offlineIndicator = page.getByText(/离线|Offline|No Internet/);
      const hasOfflineIndicator = await offlineIndicator.count();

      if (hasOfflineIndicator > 0) {
        await expect(offlineIndicator.first()).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('离线编辑功能', () => {
    test('离线时应该能够编辑章节', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 在离线状态下编辑
      const offlineText = '离线编辑的内容 ' + Date.now();
      await editor.type(offlineText);

      // 验证文本已输入
      await expect(editor).toContainText(offlineText);
    });

    test('离线时应该能够创建新章节', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 创建新章节
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(1500);

      // 验证章节已创建
      const newChapters = page.locator('.truncate').filter({ hasText: /Untitled/ });
      const hasNewChapter = await newChapters.count();

      expect(hasNewChapter).toBeGreaterThan(0);
    });

    test('离线时应该能够删除章节', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);

      // 先创建一个额外章节
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(1000);

      const chaptersBefore = await page.locator('.truncate').count();

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 删除章节
      const chapter = page.locator('.group').first();
      await chapter.hover();

      const deleteButton = page.locator('button').filter({ hasText: '' }).locator('svg').first();
      const hasDeleteButton = await deleteButton.count();

      if (hasDeleteButton > 0) {
        await page.evaluate(() => {
          window.confirm = () => true;
        });
        await deleteButton.click();
        await page.waitForTimeout(1000);

        const chaptersAfter = await page.locator('.truncate').count();
        expect(chaptersAfter).toBeLessThan(chaptersBefore);
      }
    });

    test('离线时应该能够重命名章节', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 重命名章节
      const titleInput = page.getByPlaceholder('Untitled');
      const hasInput = await titleInput.count();

      if (hasInput > 0) {
        const newTitle = '离线重命名 ' + Date.now();
        await titleInput.fill(newTitle);
        await page.waitForTimeout(1500);

        // 验证标题已更新
        await expect(titleInput).toHaveValue(newTitle);
      }
    });
  });

  test.describe('离线数据持久化', () => {
    test('离线编辑的数据应该在刷新后保留', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 在线状态下输入一些文本
      const onlineText = '在线编辑的内容';
      await editor.type(onlineText);
      await page.waitForTimeout(1500);

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 在离线状态下继续编辑
      const offlineText = ' + 离线编辑的内容';
      await editor.type(offlineText);
      await page.waitForTimeout(1500);

      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');
      await waitForEditor(page);

      // 验证所有文本都保留了
      const reloadedEditor = page.locator('.ProseMirror');
      await expect(reloadedEditor).toContainText(onlineText);
      await expect(reloadedEditor).toContainText(offlineText);
    });

    test('离线创建的章节应该在刷新后保留', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 创建新章节
      const addButton = page.getByText('Add a page');
      await addButton.click();
      await page.waitForTimeout(1000);
      await addButton.click();
      await page.waitForTimeout(1000);

      const chaptersBefore = await page.locator('.truncate').count();

      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // 验证章节数量保持不变
      const chaptersAfter = await page.locator('.truncate').count();
      expect(chaptersAfter).toBe(chaptersBefore);
    });
  });

  test.describe('网络恢复后的行为', () => {
    test('网络恢复后离线编辑的数据应该保留', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 离线编辑
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      const offlineText = '离线编辑 ' + Date.now();
      await editor.type(offlineText);
      await page.waitForTimeout(1500);

      // 恢复网络
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // 验证数据仍然存在
      await expect(editor).toContainText(offlineText);
    });

    test('网络恢复后应该能够继续编辑', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 离线编辑
      await context.setOffline(true);
      await editor.type('离线内容');
      await page.waitForTimeout(1000);

      // 恢复网络
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // 继续编辑
      const onlineText = ' + 在线内容';
      await editor.type(onlineText);

      // 验证所有内容都存在
      await expect(editor).toContainText('离线内容');
      await expect(editor).toContainText('在线内容');
    });
  });

  test.describe('IndexedDB 存储验证', () => {
    test('离线时数据应该存储在 IndexedDB 中', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 模拟离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 编辑内容
      const testText = 'IndexedDB 测试内容';
      await editor.type(testText);
      await page.waitForTimeout(2000);

      // 验证数据已存储在 IndexedDB 中
      const dbContent = await page.evaluate(async () => {
        return new Promise((resolve) => {
          const request = indexedDB.open('BookCraftDB', 1);

          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['chapters'], 'readonly');
            const objectStore = transaction.objectStore('chapters');
            const getRequest = objectStore.getAll();

            getRequest.onsuccess = () => {
              resolve(JSON.stringify(getRequest.result));
            };

            getRequest.onerror = () => {
              resolve(null);
            };
          };

          request.onerror = () => {
            resolve(null);
          };
        });
      });

      // 验证数据库中有数据
      expect(dbContent).not.toBeNull();

      if (dbContent) {
        const chapters = JSON.parse(dbContent as string);
        expect(chapters.length).toBeGreaterThan(0);

        // 验证内容包含我们输入的文本
        const hasContent = chapters.some((chapter: any) =>
          chapter.content?.includes(testText)
        );
        expect(hasContent).toBe(true);
      }
    });

    test('IndexedDB 中的数据应该在离线时正确读取', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 在线时编辑
      const originalText = '原始内容';
      await editor.type(originalText);
      await page.waitForTimeout(1500);

      // 刷新页面确保数据存储
      await page.reload();
      await page.waitForLoadState('networkidle');
      await waitForEditor(page);

      // 现在离线
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      // 验证数据仍然可以从 IndexedDB 读取
      const reloadedEditor = page.locator('.ProseMirror');
      await expect(reloadedEditor).toContainText(originalText);
    });
  });

  test.describe('边界情况', () => {
    test('频繁切换网络状态不应该导致数据丢失', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 输入初始内容
      await editor.type('初始内容');

      // 频繁切换网络状态
      for (let i = 0; i < 5; i++) {
        await context.setOffline(true);
        await page.waitForTimeout(500);

        await editor.type(` 离线${i}`);

        await context.setOffline(false);
        await page.waitForTimeout(500);

        await editor.type(` 在线${i}`);
      }

      await page.waitForTimeout(2000);

      // 验证所有内容都存在
      await expect(editor).toContainText('初始内容');

      for (let i = 0; i < 5; i++) {
        await expect(editor).toContainText(`离线${i}`);
        await expect(editor).toContainText(`在线${i}`);
      }
    });

    test('离线时关闭页面再打开应该保留数据', async ({ page, context }) => {
      await clearDatabase(page);
      await createBook(page);
      await selectFirstChapter(page);
      await waitForEditor(page);

      const editor = page.locator('.ProseMirror');
      await editor.click();

      // 离线编辑
      await context.setOffline(true);
      await page.waitForTimeout(1000);

      const savedText = '离线保存的数据 ' + Date.now();
      await editor.type(savedText);
      await page.waitForTimeout(1500);

      // 关闭页面
      await page.close();

      // 打开新页面
      const newPage = await context.newPage();
      await newPage.goto('/');
      await newPage.waitForLoadState('networkidle');

      // 查找并点击书籍
      const bookCard = newPage.locator('.rounded-xl.border').first();
      if (await bookCard.count() > 0) {
        await bookCard.click();
        await newPage.waitForTimeout(1000);

        // 选择第一个章节
        const chapters = newPage.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
        const chapterCount = await chapters.count();

        if (chapterCount > 0) {
          await chapters.first().click();
          await newPage.waitForSelector('.ProseMirror', { timeout: 10000 });

          // 验证数据存在
          const newEditor = newPage.locator('.ProseMirror');
          await expect(newEditor).toContainText(savedText);
        }
      }
    });
  });
});
