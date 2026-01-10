import { Page } from '@playwright/test';

/**
 * 清理 IndexedDB 中的所有数据
 *
 * 用于测试前重置应用状态
 */
export async function clearDatabase(page: Page): Promise<void> {
  // 先尝试导航到任意页面以打开数据库连接
  try {
    await page.goto('about:blank');
  } catch (e) {
    // 忽略错误
  }

  // 在 about:blank 页面执行数据库清理（避免应用代码干扰）
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      // 尝试删除旧数据库和新数据库
      const databases = ['BookWritingSystemDB', 'BookCraftDB'];
      let completed = 0;
      const timeout = setTimeout(() => {
        // 5秒后强制完成
        resolve();
      }, 5000);

      databases.forEach(dbName => {
        try {
          const request = indexedDB.deleteDatabase(dbName);

          request.onsuccess = () => {
            completed++;
            if (completed === databases.length) {
              clearTimeout(timeout);
              resolve();
            }
          };

          request.onerror = () => {
            completed++;
            if (completed === databases.length) {
              clearTimeout(timeout);
              resolve();
            }
          };

          request.onblocked = () => {
            completed++;
            if (completed === databases.length) {
              clearTimeout(timeout);
              resolve();
            }
          };
        } catch (e) {
          // 如果删除失败，继续
          completed++;
          if (completed === databases.length) {
            clearTimeout(timeout);
            resolve();
          }
        }
      });
    });
  });
}

/**
 * 创建书籍的辅助函数（用于书架首页）
 */
export async function createBookFromShelf(page: Page, title: string = 'Test Book', description: string = 'Test Description'): Promise<void> {
  // 等待书架加载
  await page.waitForLoadState('networkidle');

  // 点击"新建书籍"按钮
  const createButton = page.getByText('新建书籍').or(page.getByText('+ 新建书籍'));
  await createButton.click();

  // 处理 prompt 对话框
  page.on('dialog', dialog => {
    dialog.accept(title);
  });

  // 如果有描述输入
  await page.waitForTimeout(500);

  // 等待书籍创建
  await page.waitForTimeout(1000);
}

/**
 * 在书架首页创建书籍的辅助函数（使用 prompt）
 */
export async function createBookOnShelf(page: Page, title: string): Promise<void> {
  await page.waitForLoadState('networkidle');

  // 点击新建书籍按钮
  const createButton = page.locator('button').filter({ hasText: /新建书籍/ });
  await createButton.click();

  // 输入书名
  await page.waitForTimeout(100);

  // 等待书籍出现在页面上
  await page.waitForSelector(`text=${title}`, { timeout: 5000 });
}

/**
 * 创建文件夹的辅助函数
 */
export async function createCollection(page: Page, name: string): Promise<void> {
  await page.waitForLoadState('networkidle');

  // 点击新建文件夹按钮
  const createButton = page.locator('button').filter({ hasText: /新建文件夹/ }).or(
    page.locator('[title="新建文件夹"]')
  );

  const hasButton = await createButton.count();
  if (hasButton === 0) {
    // 尝试通过侧边栏创建
    const sidebarButton = page.locator('.bookshelf-sidebar').locator('svg').first();
    await sidebarButton.click();
  } else {
    await createButton.click();
  }

  // 处理 prompt
  page.on('dialog', dialog => {
    dialog.accept(name);
  });

  await page.waitForTimeout(1000);
}

/**
 * 从书架创建书籍并进入编辑器的完整流程
 * 用于替代旧的 createBook 函数，适配新的书架首页路由结构
 */
export async function createBookAndEnterEditor(page: Page, title: string = 'Test Book'): Promise<void> {
  // 1. 确保在书架首页
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000); // 等待 React 水合

  // 2. 先注册对话框处理程序（必须在点击之前）
  page.once('dialog', dialog => {
    dialog.accept(title);
  });

  // 3. 点击"新建书籍"按钮
  const createButton = page.locator('button').filter({ hasText: /新建书籍/ });
  await createButton.click();

  // 4. 等待书籍创建完成（prompt 处理和数据库操作）
  await page.waitForTimeout(2000);

  // 5. 点击新创建的书籍进入编辑器
  const bookCard = page.getByText(title).or(page.locator('[class*="book"]').filter({ hasText: title }));
  const bookCount = await bookCard.count();

  if (bookCount > 0) {
    await bookCard.first().click();
    await page.waitForTimeout(1000);

    // 6. 验证已进入编辑器页面
    await page.waitForURL(/\/editor\/\d+/, { timeout: 5000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // 等待编辑器组件挂载
  } else {
    throw new Error(`Failed to create or find book with title: ${title}`);
  }
}

/**
 * 旧版编辑器相关的辅助函数（保留向后兼容）
 * 注意：这些函数已被 createBookAndEnterEditor 替代
 */

/**
 * 创建书籍的辅助函数（旧版编辑器）
 * @deprecated 请使用 createBookAndEnterEditor 代替
 */
export async function createBook(page: Page, title: string = 'Test Book'): Promise<void> {
  // 使用新的函数
  await createBookAndEnterEditor(page, title);
}

/**
 * 选择章节的辅助函数
 * 用于编辑器页面，点击第一个章节以加载编辑器内容
 */
export async function selectFirstChapter(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);

  // 查找第一个章节项（包含 truncate 类的 span 元素）
  const chapters = page.locator('span.truncate').filter({ hasText: /Chapter|Untitled|测试/ });
  const chapterCount = await chapters.count();

  if (chapterCount > 0) {
    // 点击第一个章节的父容器（整个章节行）
    await chapters.first().locator('..').click();
    await page.waitForTimeout(1000);
  }
}

/**
 * 等待编辑器加载的辅助函数
 */
export async function waitForEditor(page: Page): Promise<void> {
  await page.waitForSelector('.ProseMirror', { timeout: 10000 });
}
