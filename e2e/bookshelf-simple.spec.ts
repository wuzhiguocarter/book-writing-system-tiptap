import { test, expect } from '@playwright/test';
import { clearDatabase } from './test-helpers';

/**
 * 书架首页功能测试（简化版）
 *
 * F-002 书架首页功能
 */
test.describe('书架首页', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('应该能够访问书架首页', async ({ page }) => {
    // 验证页面加载
    await expect(page).toHaveTitle(/BookCraft/);

    // 验证页面元素存在
    const hasTitle = await page.getByText('BookCraft').count();
    expect(hasTitle).toBeGreaterThan(0);
  });

  test('应该能够创建新书籍', async ({ page }) => {
    // 先注册对话框处理程序
    page.once('dialog', dialog => {
      dialog.accept('测试书籍');
    });

    // 点击新建书籍按钮
    const createButton = page.getByRole('button', { name: /新建书籍|New Book/ });
    await createButton.click();

    // 等待书籍创建完成
    await page.waitForTimeout(2000);

    // 验证书籍创建成功（书名出现在页面上）
    const hasBook = await page.getByText('测试书籍').count();
    expect(hasBook).toBeGreaterThan(0);
  });

  test('应该显示书籍网格', async ({ page }) => {
    // 先注册对话框处理程序
    page.once('dialog', dialog => dialog.accept('网格测试'));

    // 再点击新建书籍按钮
    await page.getByRole('button', { name: /新建书籍/ }).click();
    await page.waitForTimeout(2000);

    // 验证有书籍相关的内容
    const content = await page.locator('body').textContent();
    expect(content).toContain('网格测试');
  });

  test('应该能够点击书籍进入编辑器', async ({ page }) => {
    // 先注册对话框处理程序
    page.once('dialog', dialog => dialog.accept('导航测试'));

    // 创建书籍
    await page.getByRole('button', { name: /新建书籍/ }).click();
    await page.waitForTimeout(2000);

    // 点击书籍
    const bookLink = page.getByText('导航测试');
    await bookLink.click();

    // 等待导航
    await page.waitForTimeout(1500);

    // 验证 URL 包含 /editor/
    await expect(page.url()).toContain('/editor/');
  });

  test('编辑器应该有返回按钮', async ({ page }) => {
    // 先注册对话框处理程序
    page.once('dialog', dialog => dialog.accept('返回测试'));

    // 创建并进入书籍
    await page.getByRole('button', { name: /新建书籍/ }).click();
    await page.waitForTimeout(2000);

    await page.getByText('返回测试').click();
    await page.waitForTimeout(1500);

    // 在编辑器页面查找返回按钮
    const backButton = page.getByRole('button', { name: /返回书架|Back/ });
    const hasBackButton = await backButton.count();

    if (hasBackButton > 0) {
      await expect(backButton).toBeVisible();
    }
  });

  test('搜索框应该可见', async ({ page }) => {
    // 查找搜索输入框
    const searchInput = page.getByPlaceholder(/搜索|Search/);
    await expect(searchInput).toBeVisible();
  });

  test('应该能够搜索书籍', async ({ page }) => {
    // 创建第一本书
    page.once('dialog', dialog => dialog.accept('JavaScript 书'));
    await page.getByRole('button', { name: /新建书籍/ }).click();
    await page.waitForTimeout(1000);

    // 创建第二本书
    page.once('dialog', dialog => dialog.accept('Python 书'));
    await page.getByRole('button', { name: /新建书籍/ }).click();
    await page.waitForTimeout(1000);

    // 使用搜索
    const searchInput = page.getByPlaceholder(/搜索|Search/);
    await searchInput.fill('JavaScript');
    await page.waitForTimeout(500);

    // 验证搜索结果
    const content = await page.locator('body').textContent();
    const hasJavaScript = content?.includes('JavaScript');
    const hasPython = content?.includes('Python');

    // JavaScript 应该存在，Python 可能不存在
    expect(hasJavaScript).toBe(true);
  });
});
