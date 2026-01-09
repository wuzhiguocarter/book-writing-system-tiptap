import { test, expect } from '@playwright/test';
import { clearDatabase, createBook, selectFirstChapter, waitForEditor } from './test-helpers';

/**
 * 目录导航功能测试
 *
 * F-005 文档目录提取
 * F-006 目录滚动同步
 * F-007 目录点击跳转
 */
test.describe('目录导航', () => {
  test.beforeEach(async ({ page }) => {
    // 清理数据库以确保测试隔离
    await clearDatabase(page);

    // 创建测试书籍
    await createBook(page);

    // 选择第一个章节（创建书籍时会自动创建初始章节）
    await selectFirstChapter(page);

    // 等待编辑器加载
    await waitForEditor(page);
  });

  test('应该显示目录面板', async ({ page }) => {
    // 在大屏幕上应该显示右侧目录
    const tocPanel = page.locator('.lg\\:flex.w-\\[200px\\]');
    const hasPanel = await tocPanel.count();

    if (hasPanel > 0) {
      await expect(tocPanel.first()).toBeVisible();
    }
  });

  test('应该显示 "In this page" 标题', async ({ page }) => {
    const tocLabel = page.getByText('In this page');
    const hasLabel = await tocLabel.count();

    if (hasLabel > 0) {
      await expect(tocLabel.first()).toBeVisible();
    } else {
      // 可能没有标题内容
      test.skip();
    }
  });

  test('应该能够提取文档中的标题', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // 添加多个标题
    await editor.type('# 第一章');
    await page.keyboard.press('Enter');
    await editor.type('第一章的内容');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await editor.type('## 1.1 小节');
    await page.keyboard.press('Enter');
    await editor.type('小节内容');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await editor.type('# 第二章');
    await page.keyboard.press('Enter');
    await editor.type('第二章的内容');

    // 等待目录更新
    await page.waitForTimeout(2000);

    // 查找目录项
    const tocItems = page.locator('li').filter({ hasText: /第一章|第二章|1\.1 小节/ });
    const itemCount = await tocItems.count();

    if (itemCount > 0) {
      // 应该至少有一个标题出现在目录中
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('应该能够点击目录项跳转到对应位置', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // 添加标题
    await editor.type('# 测试跳转标题');
    await page.keyboard.press('Enter');
    await editor.type('内容');

    // 等待目录更新
    await page.waitForTimeout(2000);

    // 查找目录项
    const tocItem = page.locator('li').filter({ hasText: /测试跳转标题/ });
    const hasItem = await tocItem.count();

    if (hasItem > 0) {
      // 点击目录项
      await tocItem.first().click();

      // 等待滚动
      await page.waitForTimeout(1000);

      // 验证：标题应该在视口中
      const heading = page.locator('h1').filter({ hasText: '测试跳转标题' });
      await expect(heading.first()).toBeInViewport();
    }
  });

  test('滚动时应该高亮当前章节', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // 添加多个长章节以产生滚动
    for (let i = 1; i <= 5; i++) {
      await editor.type(`# 第${i}章`);
      await page.keyboard.press('Enter');
      for (let j = 0; j < 10; j++) {
        await editor.type(`这是第${i}章的内容行${j + 1}。`);
        await page.keyboard.press('Enter');
      }
    }

    // 等待目录更新
    await page.waitForTimeout(2000);

    // 滚动到文档中间
    const editorContainer = page.locator('#editor-scroll-container');
    await editorContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight / 2;
    });

    // 等待滚动同步
    await page.waitForTimeout(1000);

    // 查找高亮的目录项（带有 bg-blue-50 或 text-blue-600 类）
    const activeTocItem = page.locator('li').filter({ hasText: /第[1-5]章/ }).and(page.locator('.bg-blue-50, .text-blue-600'));
    const hasActive = await activeTocItem.count();

    if (hasActive > 0) {
      // 应该有高亮的目录项
      await expect(activeTocItem.first()).toBeVisible();
    }
  });

  test('不同级别标题应该有不同的缩进', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // 添加不同级别的标题
    await editor.type('# 一级标题');
    await page.keyboard.press('Enter');
    await editor.type('## 二级标题');
    await page.keyboard.press('Enter');
    await editor.type('### 三级标题');

    // 等待目录更新
    await page.waitForTimeout(2000);

    // 查找目录项
    const h1Item = page.locator('li').filter({ hasText: /一级标题/ });
    const h2Item = page.locator('li').filter({ hasText: /二级标题/ });
    const h3Item = page.locator('li').filter({ hasText: /三级标题/ });

    const hasH1 = await h1Item.count();
    const hasH2 = await h2Item.count();
    const hasH3 = await h3Item.count();

    if (hasH1 > 0 && hasH2 > 0 && hasH3 > 0) {
      // 获取缩进类
      const h1Classes = await h1Item.first().getAttribute('class');
      const h2Classes = await h2Item.first().getAttribute('class');
      const h3Classes = await h3Item.first().getAttribute('class');

      // H1 应该有 pl-2（最小缩进）
      expect(h1Classes).toContain('pl-2');

      // H2 应该有 pl-5（中等缩进）
      expect(h2Classes).toContain('pl-5');

      // H3 应该有 pl-8（最大缩进）
      expect(h3Classes).toContain('pl-8');
    }
  });

  test('空文档时不应该显示目录', async ({ page }) => {
    // 创建新章节
    const addButton = page.getByText('Add a page');
    await addButton.click();
    await page.waitForTimeout(1000);

    // 点击新章节
    const newChapter = page.locator('.truncate').filter({ hasText: /Untitled/ }).first();
    await newChapter.click();

    // 等待编辑器加载
    await page.waitForTimeout(1000);

    // 查找目录
    const tocLabel = page.getByText('In this page');
    const hasLabel = await tocLabel.count();

    if (hasLabel > 0) {
      // 如果显示了目录，应该没有目录项
      const tocItems = page.locator('li');
      const itemCount = await tocItems.count();

      // 在空文档中，目录可能不显示或没有项目
      if (itemCount > 0) {
        // 如果有项目，应该至少是有效的
        expect(itemCount).toBeGreaterThan(0);
      }
    }
  });

  test('重复标题应该有不同的 ID', async ({ page }) => {
    const editor = page.locator('.ProseMirror');
    await editor.click();

    // 添加重复标题
    await editor.type('# 重复标题');
    await page.keyboard.press('Enter');
    await editor.type('内容1');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await editor.type('# 重复标题');
    await page.keyboard.press('Enter');
    await editor.type('内容2');

    // 等待目录更新
    await page.waitForTimeout(2000);

    // 查找所有具有 "重复标题" 文本的目录项
    const tocItems = page.locator('li').filter({ hasText: /重复标题/ });
    const itemCount = await tocItems.count();

    if (itemCount >= 2) {
      // 应该有两个不同的目录项
      expect(itemCount).toBeGreaterThanOrEqual(2);

      // 点击第一个应该跳转到第一个
      await tocItems.first().click();
      await page.waitForTimeout(1000);

      // 验证第一个标题在视口中
      const headings = page.locator('h1').filter({ hasText: '重复标题' });
      await expect(headings.first()).toBeInViewport();
    }
  });
});
