import { Page } from '@playwright/test';

/**
 * 测试辅助函数
 */

/**
 * 创建测试书籍
 */
export async function createTestBook(page: Page, title: string = '测试书籍') {
  // 点击创建书籍按钮（如果存在）
  const createButton = page.getByText('Create a book');
  const hasCreateButton = await createButton.count();

  if (hasCreateButton > 0) {
    await createButton.click();
    await page.waitForTimeout(1000);
  }

  // 点击书籍切换器
  const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|^[A-Z]/ }).first();
  await bookSwitcher.click();
  await page.waitForTimeout(500);

  // 点击 "Create new book"
  const createNewBookButton = page.getByText('Create new book');
  await createNewBookButton.click();

  // 输入书籍标题
  const input = page.getByPlaceholder('Book Title');
  await input.fill(title);

  // 提交
  await input.press('Enter');

  // 等待创建完成
  await page.waitForTimeout(1000);

  return title;
}

/**
 * 创建测试章节
 */
export async function createTestChapter(page: Page, title?: string) {
  // 点击 "Add a page" 按钮
  const addButton = page.getByText('Add a page');
  await addButton.click();

  // 等待章节创建
  await page.waitForTimeout(1000);

  // 如果提供了标题，编辑章节标题
  if (title) {
    const chapters = page.locator('.truncate').filter({ hasText: /Untitled|Chapter/ });
    const lastChapter = chapters.last();
    await lastChapter.click();

    const titleInput = page.getByPlaceholder('Untitled');
    await titleInput.fill(title);
    await page.waitForTimeout(1000);
  }

  return true;
}

/**
 * 在编辑器中输入内容
 */
export async function typeInEditor(page: Page, text: string) {
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await editor.type(text);
  await page.waitForTimeout(500);
}

/**
 * 在编辑器中添加标题
 */
export async function addHeading(page: Page, level: number, text: string) {
  const editor = page.locator('.ProseMirror');
  await editor.click();

  const headingPrefix = '#'.repeat(level);
  await editor.type(`${headingPrefix} ${text}`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
}

/**
 * 等待目录更新
 */
export async function waitForTocUpdate(page: Page, timeout: number = 2000) {
  await page.waitForTimeout(timeout);
}

/**
 * 切换到指定章节
 */
export async function selectChapter(page: Page, chapterTitle: string) {
  const chapter = page.locator('.truncate').filter({ hasText: chapterTitle }).first();
  await chapter.click();
  await page.waitForTimeout(1000);
}

/**
 * 清空编辑器内容
 */
export async function clearEditor(page: Page) {
  const editor = page.locator('.ProseMirror');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Delete');
  await page.waitForTimeout(500);
}

/**
 * 获取目录项数量
 */
export async function getTocItemCount(page: Page): Promise<number> {
  const tocItems = page.locator('li');
  return await tocItems.count();
}

/**
 * 检查是否有书籍
 */
export async function hasBooks(page: Page): Promise<boolean> {
  const createButton = page.getByText('Create a book');
  const count = await createButton.count();
  return count === 0;
}

/**
 * 检查是否有章节
 */
export async function hasChapters(page: Page): Promise<boolean> {
  const chapters = page.locator('.truncate');
  const count = await chapters.count();
  return count > 0;
}
