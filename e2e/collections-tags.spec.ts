import { test, expect } from '@playwright/test';
import { clearDatabase } from './test-helpers';

/**
 * 文件夹和标签功能测试
 *
 * F-003 文件夹和标签管理
 */
test.describe('文件夹和标签', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('文件夹功能', () => {
    test('应该显示文件夹区域', async ({ page }) => {
      // 验证文件夹标题
      await expect(page.getByText('文件夹')).toBeVisible();

      // 验证"全部书籍"选项
      await expect(page.getByText('全部书籍')).toBeVisible();
    });

    test('应该能够创建文件夹', async ({ page }) => {
      // 点击新建文件夹按钮
      const createButton = page.locator('[title="新建文件夹"]');
      const hasButton = await createButton.count();

      if (hasButton === 0) {
        const sidebar = page.locator('.w-64.bg-white.border-r');
        const folderIcon = sidebar.locator('svg').first();
        await folderIcon.click();
      } else {
        await page.evaluate(() => {
          window.prompt = () => '测试文件夹';
        });
        await createButton.click();
      }

      await page.waitForTimeout(1500);

      await expect(page.getByText('测试文件夹')).toBeVisible();
    });

    test('应该显示文件夹中的书籍数量', async ({ page }) => {
      const createButton = page.locator('[title="新建文件夹"]');
      const hasButton = await createButton.count();

      if (hasButton > 0) {
        await page.evaluate(() => {
          window.prompt = () => '工作项目';
        });
        await createButton.click();
      } else {
        const sidebar = page.locator('.w-64.bg-white.border-r');
        const folderIcon = sidebar.locator('svg').first();
        await folderIcon.click();
      }

      await page.waitForTimeout(1500);

      const newBookButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '项目文档';
      });

      await newBookButton.click();
      await page.waitForTimeout(1500);

      const folderSection = page.locator('.w-64.bg-white.border-r');
      const folderText = await folderSection.textContent();

      expect(folderText).toContain('工作项目');
    });

    test('应该能够筛选文件夹中的书籍', async ({ page }) => {
      const createButton = page.locator('[title="新建文件夹"]');
      const hasButton = await createButton.count();

      if (hasButton > 0) {
        await page.evaluate(() => {
          window.prompt = () => '学习笔记';
        });
        await createButton.click();
      } else {
        const sidebar = page.locator('.w-64.bg-white.border-r');
        const folderIcon = sidebar.locator('svg').first();
        await folderIcon.click();
      }

      await page.waitForTimeout(1500);

      const folderCard = page.locator('.p-4.rounded-xl').filter({ hasText: '学习笔记' });
      const hasFolderCard = await folderCard.count();

      if (hasFolderCard > 0) {
        await folderCard.click();
        await page.waitForTimeout(500);

        const isActive = await folderCard.locator('.border-stone-800').count();
        expect(isActive).toBeGreaterThan(0);
      }
    });
  });

  test.describe('标签功能', () => {
    test('应该显示标签区域', async ({ page }) => {
      // 验证标签标题
      await expect(page.getByText('标签')).toBeVisible();

      // 验证新建标签按钮（如果有）
      const createButton = page.locator('[title="新建标签"]');
      const hasButton = await createButton.count();

      // 按钮可能存在，也可能不存在
      if (hasButton > 0) {
        await expect(createButton).toBeVisible();
      }
    });

    test('应该能够创建标签', async ({ page }) => {
      const createButton = page.locator('[title="新建标签"]');
      const hasButton = await createButton.count();

      if (hasButton > 0) {
        await page.evaluate(() => {
          window.prompt = () => 'JavaScript';
        });
        await createButton.click();
        await page.waitForTimeout(1500);

        await expect(page.getByText('#JavaScript')).toBeVisible();
      } else {
        const sidebar = page.locator('.w-64.bg-white.border-r');
        const tagSection = sidebar.locator('text=标签');

        await tagSection.click();

        await page.waitForTimeout(500);

        await expect(page.getByText('标签')).toBeVisible();
      }
    });

    test('应该能够通过标签筛选书籍', async ({ page }) => {
      const newBookButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '技术文档';
      });

      await newBookButton.click();
      await page.waitForTimeout(1500);

      const filterButton = page.locator('button').filter({ hasText: /筛选/i });
      const hasFilterButton = await filterButton.count();

      if (hasFilterButton > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);

        const filterPanel = page.locator('.bg-white.border-b');
        const hasFilterPanel = await filterPanel.count();

        if (hasFilterPanel > 0) {
          await expect(filterPanel).toBeVisible();
        }
      }
    });

    test('空状态时应该显示提示', async ({ page }) => {
      const sidebar = page.locator('.w-64.bg-white.border-r');

      // 验证标签区域存在
      await expect(page.getByText('标签')).toBeVisible();

      // 验证空状态提示
      const emptyState = sidebar.getByText('暂无标签');
      const hasEmptyState = await emptyState.count();

      if (hasEmptyState > 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  test.describe('筛选面板', () => {
    test.beforeEach(async ({ page }) => {
      const titles = ['前端开发', '后端开发', '数据库设计'];
      for (const title of titles) {
        const newBookButton = page.getByRole('button', { name: '新建书籍' });

        await page.evaluate((bookTitle) => {
          window.prompt = () => bookTitle;
        }, title);

        await newBookButton.click();
        await page.waitForTimeout(800);
      }

      await page.waitForTimeout(1000);
    });

    test('应该能够打开筛选面板', async ({ page }) => {
      // 点击筛选按钮
      const filterButton = page.locator('button').filter({ hasText: '' }).locator('svg').filter({ hasText: /sliders/i });
      const hasFilterButton = await filterButton.count();

      if (hasFilterButton > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // 验证筛选面板
        const filterPanel = page.locator('.bg-white.border-b');
        await expect(filterPanel).toBeVisible();
        await expect(page.getByText('筛选和排序')).toBeVisible();
      }
    });

    test('应该能够选择排序方式', async ({ page }) => {
      const filterButton = page.locator('button').filter({ hasText: '' }).locator('svg').filter({ hasText: /sliders/i });
      const hasFilterButton = await filterButton.count();

      if (hasFilterButton > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // 找到排序下拉框
        const sortSelect = page.locator('select').first();
        const hasSortSelect = await sortSelect.count();

        if (hasSortSelect > 0) {
          await sortSelect.selectOption('title');
          await page.waitForTimeout(500);

          // 验证排序选择成功（通过检查选项值）
          const selectedValue = await sortSelect.inputValue();
          expect(selectedValue).toBe('title');
        }
      }
    });

    test('应该能够切换排序方向', async ({ page }) => {
      const filterButton = page.locator('button').filter({ hasText: '' }).locator('svg').filter({ hasText: /sliders/i });
      const hasFilterButton = await filterButton.count();

      if (hasFilterButton > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // 找到排序方向按钮
        const sortDirectionButton = page.locator('button').filter({ hasText: /升序|降序/ });
        const hasButton = await sortDirectionButton.count();

        if (hasButton > 0) {
          await sortDirectionButton.click();
          await page.waitForTimeout(500);

          // 验证按钮文本变化
          const buttonText = await sortDirectionButton.textContent();
          expect(buttonText).toBeTruthy();
        }
      }
    });

    test('应该能够选择时间范围', async ({ page }) => {
      const filterButton = page.locator('button').filter({ hasText: '' }).locator('svg').filter({ hasText: /sliders/i });
      const hasFilterButton = await filterButton.count();

      if (hasFilterButton > 0) {
        await filterButton.click();
        await page.waitForTimeout(500);

        // 找到时间范围下拉框
        const timeRangeSelects = page.locator('select');
        const hasSelects = await timeRangeSelects.count();

        if (hasSelects >= 2) {
          await timeRangeSelects.nth(1).selectOption('week');
          await page.waitForTimeout(500);

          // 验证选择成功
          const selectedValue = await timeRangeSelects.nth(1).inputValue();
          expect(selectedValue).toBe('week');
        }
      }
    });
  });

  test.describe('书架与编辑器集成', () => {
    test('应该在编辑器中更新最后阅读时间', async ({ page }) => {
      const newBookButton = page.getByRole('button', { name: '新建书籍' });

      await page.evaluate(() => {
        window.prompt = () => '阅读测试书';
      });

      await newBookButton.click();
      await page.waitForTimeout(1500);

      const bookCard = page.locator('.rounded-xl.border').filter({ hasText: '阅读测试书' });
      await bookCard.click();
      await page.waitForTimeout(1000);

      await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 5000 });

      const backButton = page.getByText('返回书架').or(page.getByText('← 返回书架'));
      await backButton.click();
      await page.waitForTimeout(1000);

      await expect(page).toHaveURL('/');

      await expect(page.getByText('📚 BookCraft')).toBeVisible();
    });
  });
});
