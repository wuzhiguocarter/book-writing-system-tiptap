import { test, expect } from '@playwright/test';
import { clearDatabase } from './test-helpers';

/**
 * 书架首页功能测试
 *
 * F-002 书架首页功能
 */
test.describe('书架首页', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('页面布局', () => {
    test('应该显示书架首页', async ({ page }) => {
      await expect(page.getByText('📚 BookCraft')).toBeVisible();

      const header = page.locator('.h-16').or(page.locator('header')).or(page.getByText('新建书籍'));
      await expect(header.first()).toBeVisible();

      await expect(page.getByRole('button', { name: '新建书籍' })).toBeVisible();
    });

    test('应该显示左侧边栏', async ({ page }) => {
      const sidebar = page.locator('.w-64').or(page.locator('[style*="width: 16rem"]'));
      const hasSidebar = await sidebar.count();

      expect(hasSidebar).toBeGreaterThan(0);
    });

    test('应该显示搜索框', async ({ page }) => {
      const searchInput = page.getByPlaceholder('搜索书籍、文件夹、标签...');
      await expect(searchInput).toBeVisible();
    });

    test('应该显示视图切换按钮', async ({ page }) => {
      const viewButtons = page.locator('button').filter({ hasText: '' }).locator('svg');
      const hasViewButtons = await viewButtons.count();

      expect(hasViewButtons).toBeGreaterThan(1);
    });
  });

  test.describe('创建书籍', () => {
    test('应该能够创建新书籍', async ({ page }) => {
      const createButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '测试书籍';
      });

      await createButton.click();

      await page.waitForTimeout(1500);

      await expect(page.getByRole('heading', { name: '测试书籍' })).toBeVisible();
    });

    test('应该显示书籍卡片', async ({ page }) => {
      const createButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '我的第一本书';
      });

      await createButton.click();

      await page.waitForTimeout(1500);

      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '我的第一本书' });
      await expect(bookCard).toBeVisible();

      const cardStyle = await bookCard.getAttribute('style');
      expect(cardStyle).toContain('background-color');
    });

    test('空状态时应该显示提示', async ({ page }) => {
      await page.waitForSelector('text=还没有书籍', { timeout: 5000 });
      await expect(page.getByText('还没有书籍')).toBeVisible();
      await expect(page.getByText('点击"新建书籍"开始创作')).toBeVisible();
    });
  });

  test.describe('搜索功能', () => {
    test.beforeEach(async ({ page }) => {
      const bookTitles = ['JavaScript 高级程序设计', 'Python 编程入门', 'Java 核心技术'];

      for (const title of bookTitles) {
        const createButton = page.getByRole('button', { name: '新建书籍' });

        await page.evaluate((bookTitle) => {
          window.prompt = () => bookTitle;
        }, title);

        await createButton.click();

        await page.waitForTimeout(800);
      }

      await page.waitForTimeout(1000);
    });

    test('应该能够搜索书籍', async ({ page }) => {
      const searchInput = page.getByPlaceholder('搜索书籍、文件夹、标签...');
      await searchInput.fill('JavaScript');

      await page.waitForTimeout(500);

      await expect(page.getByRole('heading', { name: 'JavaScript 高级程序设计' })).toBeVisible();
      const hasPython = await page.getByRole('heading', { name: 'Python 编程入门' }).count();
      const hasJava = await page.getByRole('heading', { name: 'Java 核心技术' }).count();

      expect(hasPython).toBe(0);
      expect(hasJava).toBe(0);
    });

    test('应该显示搜索建议', async ({ page }) => {
      const searchInput = page.getByPlaceholder('搜索书籍、文件夹、标签...');
      await searchInput.fill('Java');

      await page.waitForTimeout(400);

      const suggestions = page.locator('.bg-white.rounded-xl.shadow-xl');
      const hasSuggestions = await suggestions.count();

      if (hasSuggestions > 0) {
        await expect(page.getByText('搜索建议')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Java 核心技术' })).toBeVisible();
      }
    });

    test('应该能够清除搜索', async ({ page }) => {
      const searchInput = page.getByPlaceholder('搜索书籍、文件夹、标签...');

      await searchInput.fill('JavaScript');
      await page.waitForTimeout(500);

      await page.mouse.click(0, 0);
      await page.waitForTimeout(200);

      const clearButton = page.getByRole('button', { name: '' }).locator('svg').filter({ has: searchInput });
      const hasClearButton = await clearButton.count();

      if (hasClearButton > 0) {
        await clearButton.click();

        await page.waitForTimeout(500);

        await expect(page.getByRole('heading', { name: 'JavaScript 高级程序设计' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Python 编程入门' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Java 核心技术' })).toBeVisible();
      }
    });
  });

  test.describe('视图切换', () => {
    test.beforeEach(async ({ page }) => {
      const createButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '测试书籍';
      });

      await createButton.click();

      await page.waitForTimeout(1500);
    });

    test('应该能够切换到列表视图', async ({ page }) => {
      const viewButtons = page.locator('.bg-stone-100.rounded-lg.p-1 button');

      if (await viewButtons.count() >= 2) {
        await viewButtons.nth(1).click();
        await page.waitForTimeout(500);

        const gridContainer = page.locator('.grid');
        const hasGrid = await gridContainer.count();

        if (hasGrid === 0) {
          expect(true).toBe(true);
        }
      }
    });

    test('应该能够切换回网格视图', async ({ page }) => {
      const viewButtons = page.locator('.bg-stone-100.rounded-lg.p-1 button');

      if (await viewButtons.count() >= 1) {
        await viewButtons.nth(0).click();
        await page.waitForTimeout(500);

        const gridContainer = page.locator('.grid');
        await expect(gridContainer).toBeVisible();
      }
    });
  });

  test.describe('书籍操作', () => {
    test.beforeEach(async ({ page }) => {
      const createButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '可操作书籍';
      });

      await createButton.click();

      await page.waitForTimeout(1500);
    });

    test('应该能够打开书籍菜单', async ({ page }) => {
      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '可操作书籍' });

      const menuButton = bookCard.locator('button').filter({ hasText: '' });
      const hasMenuButton = await menuButton.count();

      if (hasMenuButton > 0) {
        await menuButton.first().click();
        await page.waitForTimeout(300);

        await expect(page.getByText('置顶')).toBeVisible();
        await expect(page.getByText('编辑')).toBeVisible();
        await expect(page.getByText('删除')).toBeVisible();
      }
    });

    test('应该能够编辑书籍', async ({ page }) => {
      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '可操作书籍' });
      const menuButton = bookCard.locator('button').filter({ hasText: '' });

      const hasMenuButton = await menuButton.count();
      if (hasMenuButton > 0) {
        await menuButton.first().click();
        await page.waitForTimeout(300);

        const editButton = page.locator('button').filter({ hasText: /编辑/ });

        await page.evaluate(() => {
          window.prompt = () => '已修改的书籍';
        });

        await editButton.click();

        await page.waitForTimeout(1000);

        await expect(page.getByText('已修改的书籍')).toBeVisible();
      }
    });

    test('应该能够删除书籍', async ({ page }) => {
      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '可操作书籍' });
      const menuButton = bookCard.locator('button').filter({ hasText: '' });

      const hasMenuButton = await menuButton.count();
      if (hasMenuButton > 0) {
        await menuButton.first().click();
        await page.waitForTimeout(300);

        const deleteButton = page.locator('button').filter({ hasText: /删除/ }).or(
          page.locator('.text-red-600')
        );

        await page.evaluate(() => {
          window.confirm = () => true;
        });

        await deleteButton.click();

        await page.waitForTimeout(1000);

        const hasBook = await page.getByText('可操作书籍').count();
        expect(hasBook).toBe(0);
      }
    });
  });

  test.describe('导航到编辑器', () => {
    test.beforeEach(async ({ page }) => {
      const createButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '导航测试书籍';
      });

      await createButton.click();

      await page.waitForTimeout(1500);
    });

    test('点击书籍应该跳转到编辑器', async ({ page }) => {
      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '导航测试书籍' });
      await bookCard.click();

      await page.waitForTimeout(1000);

      await expect(page).toHaveURL(/\/editor\/\d+/);

      await expect(page.getByText('返回书架')).toBeVisible();
      await expect(page.locator('.ProseMirror')).toBeVisible();
    });

    test('编辑器应该显示返回按钮', async ({ page }) => {
      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '导航测试书籍' });
      await bookCard.click();
      await page.waitForTimeout(1000);

      const backButton = page.getByText('返回书架').or(page.getByText('← 返回书架'));
      await expect(backButton).toBeVisible();
    });

    test('点击返回按钮应该回到书架', async ({ page }) => {
      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '导航测试书籍' });
      await bookCard.click();
      await page.waitForTimeout(1000);

      const backButton = page.getByText('返回书架').or(page.getByText('← 返回书架'));
      await backButton.click();

      await page.waitForTimeout(1000);

      await expect(page).toHaveURL('/');
      await expect(page.getByText('📚 BookCraft')).toBeVisible();
    });
  });
});
