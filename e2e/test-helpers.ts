import { Page } from '@playwright/test';

/**
 * 清理 IndexedDB 中的所有数据
 *
 * 用于测试前重置应用状态
 */
export async function clearDatabase(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('BookWritingSystemDB');

      request.onsuccess = () => resolve(null);
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        // 如果数据库被阻塞，等待一下再试
        setTimeout(() => {
          const retryRequest = indexedDB.deleteDatabase('BookWritingSystemDB');
          retryRequest.onsuccess = () => resolve(null);
          retryRequest.onerror = () => reject(retryRequest.error);
        }, 100);
      };
    });
  });
}

/**
 * 创建书籍的辅助函数
 */
export async function createBook(page: Page, title: string = 'Test Book'): Promise<void> {
  // 等待页面加载
  await page.waitForLoadState('networkidle');

  // 点击创建书籍按钮（如果存在）
  const createButton = page.getByText('Create a book');
  const hasCreateButton = await createButton.count();

  if (hasCreateButton > 0) {
    await createButton.click();
    await page.waitForTimeout(500);
  } else {
    // 如果没有 "Create a book" 按钮，说明已经有书籍了，打开书籍切换器
    const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|^[A-Z]/ }).first();
    await bookSwitcher.click();
    await page.waitForTimeout(500);

    // 点击 "Create new book"
    const createNewBookButton = page.getByText('Create new book');
    await createNewBookButton.click();
  }

  // 输入书籍标题
  const input = page.getByPlaceholder('Book Title');
  await input.fill(title);

  // 提交表单
  await input.press('Enter');

  // 等待书籍和初始章节创建完成
  await page.waitForTimeout(1500);
}

/**
 * 选择章节的辅助函数
 */
export async function selectFirstChapter(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');

  // 查找第一个章节
  const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
  const chapterCount = await chapters.count();

  if (chapterCount > 0) {
    await chapters.first().click();
    // 等待编辑器加载
    await page.waitForTimeout(1000);
  }
}

/**
 * 等待编辑器加载的辅助函数
 */
export async function waitForEditor(page: Page): Promise<void> {
  await page.waitForSelector('.ProseMirror', { timeout: 10000 });
}
