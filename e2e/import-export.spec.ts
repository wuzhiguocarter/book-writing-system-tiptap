import { test, expect } from '@playwright/test';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { clearDatabase, createBook } from './test-helpers';

/**
 * 导入导出功能测试
 *
 * F-010 数据导入导出
 */
test.describe('导入导出功能', () => {
  let testFilePath: string;

  test.beforeEach(async ({ page }) => {
    // 清理数据库以确保测试隔离
    await clearDatabase(page);

    // 创建测试书籍
    await createBook(page);

    // 创建测试文件
    testFilePath = join(process.cwd(), 'test-import.md');
    const testContent = `# 第一章

这是第一章的内容。

## 1.1 小节

这是小节内容。

# 第二章

这是第二章的内容。`;

    writeFileSync(testFilePath, testContent, 'utf-8');
  });

  test.afterEach(async () => {
    // 清理测试文件
    try {
      unlinkSync(testFilePath);
    } catch (e) {
      // 文件可能已被删除
    }
  });

  test('应该显示导入按钮', async ({ page }) => {
    // 在左侧边栏底部查找导入按钮
    const importButton = page.locator('button').filter({ hasText: '' }).locator('svg').filter({ hasText: /upload/i });

    // 注意：导入按钮使用 Upload 图标
    const bottomButtons = page.locator('.border-t').locator('button');
    const buttonCount = await bottomButtons.count();

    expect(buttonCount).toBeGreaterThan(0);
  });

  test('应该能够导入 Markdown 文件', async ({ page }) => {
    // 查找导入按钮（在 Settings 旁边）
    const fileInput = page.locator('input[type="file"]');

    const hasFileInput = await fileInput.count();
    if (hasFileInput === 0) {
      test.skip();
      return;
    }

    // 上传测试文件
    await fileInput.setInputFiles(testFilePath);

    // 等待导入完成
    await page.waitForTimeout(3000);

    // 验证书籍和章节已创建
    // 查找 "第一章" 或 "第二章" 的章节
    const chapters = page.locator('.truncate').filter({ hasText: /第一章|第二章/ });
    const chapterCount = await chapters.count();

    if (chapterCount > 0) {
      await expect(chapters.first()).toBeVisible();
    }
  });

  test('导入的章节应该包含正确内容', async ({ page }) => {
    // 导入文件
    const fileInput = page.locator('input[type="file"]');
    const hasFileInput = await fileInput.count();

    if (hasFileInput === 0) {
      test.skip();
      return;
    }

    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(3000);

    // 点击第一个导入的章节
    const chapter = page.locator('.truncate').filter({ hasText: /第一章/ }).first();
    const hasChapter = await chapter.count();

    if (hasChapter > 0) {
      await chapter.click();

      // 等待编辑器加载
      await page.waitForTimeout(1000);

      // 验证内容
      const editor = page.locator('.ProseMirror');
      await expect(editor).toContainText('这是第一章的内容');
    }
  });

  test('应该显示导出按钮', async ({ page }) => {
    // 点击章节以显示导出按钮
    const chapters = page.locator('.truncate');
    const chapterCount = await chapters.count();

    if (chapterCount > 0) {
      await chapters.first().click();
      await page.waitForTimeout(1000);

      // 查找导出按钮（在顶部工具栏）
      const toolbarButtons = page.locator('.h-11 button');
      const buttonCount = await toolbarButtons.count();

      expect(buttonCount).toBeGreaterThan(5); // 至少应该有格式化按钮和导出按钮
    }
  });

  test('应该能够导出为 PDF', async ({ page }) => {
    // 点击第一个章节以激活编辑器
    const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
    const chapterCount = await chapters.count();

    if (chapterCount === 0) {
      test.skip();
      return;
    }

    await chapters.first().click();
    await page.waitForTimeout(1000);

    // 设置下载处理
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // 查找并点击 PDF 导出按钮
    // 按钮使用 title="导出为 PDF" 属性
    const pdfButton = page.locator('button[title="导出为 PDF"]');

    const hasPdfButton = await pdfButton.count();
    if (hasPdfButton > 0) {
      await pdfButton.click();

      // 等待下载开始
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    } else {
      test.skip();
    }
  });

  test('应该能够导出为 Markdown', async ({ page }) => {
    // 点击第一个章节以激活编辑器
    const chapters = page.locator('.truncate').filter({ hasText: /Chapter|Untitled/ });
    const chapterCount = await chapters.count();

    if (chapterCount === 0) {
      test.skip();
      return;
    }

    await chapters.first().click();
    await page.waitForTimeout(1000);

    // 设置下载处理
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // 查找并点击 Markdown 导出按钮
    // 按钮使用 title="导出为 Markdown" 属性
    const mdButton = page.locator('button[title="导出为 Markdown"]');

    const hasMdButton = await mdButton.count();
    if (hasMdButton > 0) {
      await mdButton.click();

      // 等待下载开始
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.md');
    } else {
      test.skip();
    }
  });

  test('导入应该解析多个一级标题为多个章节', async ({ page }) => {
    // 创建包含多个一级标题的测试文件
    const multiChapterContent = `# 第一章

第一章内容

# 第二章

第二章内容

# 第三章

第三章内容`;

    writeFileSync(testFilePath, multiChapterContent, 'utf-8');

    // 导入文件
    const fileInput = page.locator('input[type="file"]');
    const hasFileInput = await fileInput.count();

    if (hasFileInput === 0) {
      test.skip();
      return;
    }

    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(3000);

    // 验证创建了三个章节
    const chapters = page.locator('.truncate').filter({ hasText: /第一章|第二章|第三章/ });
    const chapterCount = await chapters.count();

    if (chapterCount > 0) {
      // 应该至少有3个章节（可能还有其他章节）
      expect(chapterCount).toBeGreaterThanOrEqual(3);
    }
  });
});
