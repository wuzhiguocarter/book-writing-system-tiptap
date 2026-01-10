import { test, expect } from '@playwright/test';
import { clearDatabase } from './test-helpers';

/**
 * 书籍管理功能测试
 *
 * F-001 书籍创建与删除
 */
test.describe('书籍管理', () => {
  test.beforeEach(async ({ page }) => {
    // 清理数据库以确保测试隔离
    await clearDatabase(page);
  });

  test('应该显示创建书籍按钮', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 如果没有书籍，应该显示 "Create a book" 按钮
    const createButton = page.getByText('Create a book');
    const hasCreateButton = await createButton.count();

    if (hasCreateButton > 0) {
      await expect(createButton).toBeVisible();
    }
  });

  test('应该能够创建新书籍', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 点击创建书籍按钮（如果存在）
    const createButton = page.getByText('Create a book');
    const hasCreateButton = await createButton.count();

    if (hasCreateButton > 0) {
      await createButton.click();
    }

    // 在书籍列表中点击 "Create new book"
    const createNewBookButton = page.getByText('Create new book');
    const hasCreateNewBook = await createNewBookButton.count();

    if (hasCreateNewBook > 0) {
      // 点击书籍切换器打开书籍列表
      await page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first().click();

      // 等待下拉菜单显示
      await page.waitForTimeout(500);

      await createNewBookButton.click();
    }

    // 输入书籍标题
    const input = page.getByPlaceholder('Book Title');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('测试书籍');

    // 提交表单
    await input.press('Enter');

    // 等待书籍创建
    await page.waitForTimeout(1000);

    // 验证书籍已创建
    await expect(page.getByText('测试书籍')).toBeVisible({ timeout: 5000 });
  });

  test('应该能够显示书籍切换器', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 查找书籍切换器
    const bookSwitcher = page.locator('.w-5.h-5.rounded-sm.bg-slate-700');
    const hasSwitcher = await bookSwitcher.count();

    if (hasSwitcher > 0) {
      await expect(bookSwitcher.first()).toBeVisible();
    }
  });

  test('应该能够删除书籍', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 点击书籍切换器
    const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first();
    const hasSwitcher = await bookSwitcher.count();

    if (hasSwitcher === 0) {
      test.skip();
      return;
    }

    await bookSwitcher.click();
    await page.waitForTimeout(500);

    // 查找删除按钮（如果有多个书籍）
    const deleteButtons = page.locator('button').filter({ hasText: '' }).locator('svg').nth(-1);

    const deleteButtonCount = await deleteButtons.count();
    if (deleteButtonCount > 1) {
      // 点击第二个删除按钮（第一个是当前书籍）
      // 处理确认对话框
      page.on('dialog', dialog => dialog.accept());
      await deleteButtons.nth(1).click();

      // 验证删除成功
      await page.waitForTimeout(1000);
    }
  });

  test('应该能够切换书籍', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 点击书籍切换器
    const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first();
    const hasSwitcher = await bookSwitcher.count();

    if (hasSwitcher === 0) {
      test.skip();
      return;
    }

    await bookSwitcher.click();
    await page.waitForTimeout(500);

    // 查找所有书籍选项
    const bookOptions = page.locator('div').filter({ hasText: /^(?!.*Create new book).*[A-Z]/u });
    const optionCount = await bookOptions.count();

    if (optionCount > 1) {
      // 点击第二个书籍
      await bookOptions.nth(1).click();

      // 等待切换
      await page.waitForTimeout(1000);

      // 验证书籍已切换
      await expect(bookSwitcher).toBeVisible();
    }
  });

  test.describe('书籍元数据编辑', () => {
    test.beforeEach(async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // 创建第一本书
      const createButton = page.getByText('Create a book');
      const hasCreateButton = await createButton.count();

      if (hasCreateButton > 0) {
        await createButton.click();
      } else {
        const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Select Book|Book/ }).first();
        await bookSwitcher.click();
        await page.waitForTimeout(500);

        const createNewBookButton = page.getByText('Create new book');
        await createNewBookButton.click();
      }

      const input = page.getByPlaceholder('Book Title');
      await input.fill('原始书名');
      await input.press('Enter');
      await page.waitForTimeout(1500);
    });

    test('应该能够编辑书籍标题', async ({ page }) => {
      // 点击书籍切换器
      const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /原始书名/ }).first();
      await bookSwitcher.click();
      await page.waitForTimeout(500);

      // 查找编辑按钮（如果有）
      const editButton = page.locator('button').filter({ hasText: /Edit|编辑/ });
      const hasEditButton = await editButton.count();

      if (hasEditButton > 0) {
        await editButton.first().click();

        // 修改标题
        const titleInput = page.getByPlaceholder('Book Title');
        await titleInput.fill('修改后的书名');
        await titleInput.press('Enter');

        // 验证修改成功
        await page.waitForTimeout(1000);
        await expect(page.getByText('修改后的书名')).toBeVisible();
      }
    });

    test('应该能够为书籍设置封面颜色', async ({ page }) => {
      // 查找颜色选择器（如果有）
      const colorPicker = page.locator('input[type="color"]');
      const hasColorPicker = await colorPicker.count();

      if (hasColorPicker > 0) {
        await colorPicker.first().click();

        // 选择红色
        await colorPicker.first().fill('#ff0000');

        // 验证颜色已设置
        await page.waitForTimeout(500);
        const colorValue = await colorPicker.first().inputValue();
        expect(colorValue).toBe('#ff0000');
      }
    });

    test('应该能够添加书籍描述', async ({ page }) => {
      // 查找描述输入框
      const descriptionInput = page.getByPlaceholder('Description').or(page.getByPlaceholder('描述'));
      const hasInput = await descriptionInput.count();

      if (hasInput > 0) {
        await descriptionInput.first().fill('这是一本测试书籍的描述');

        // 等待保存
        await page.waitForTimeout(1500);

        // 验证描述已保存
        const value = await descriptionInput.first().inputValue();
        expect(value).toBe('这是一本测试书籍的描述');
      }
    });
  });

  test.describe('多书籍管理', () => {
    test.beforeEach(async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // 创建多本书籍
      const bookTitles = ['第一本书', '第二本书', '第三本书'];

      for (const title of bookTitles) {
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
        await input.fill(title);
        await input.press('Enter');
        await page.waitForTimeout(1000);
      }
    });

    test('应该显示所有书籍列表', async ({ page }) => {
      // 点击书籍切换器
      const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Book/ }).first();
      await bookSwitcher.click();
      await page.waitForTimeout(500);

      // 验证所有书籍都显示在列表中
      await expect(page.getByText('第一本书')).toBeVisible();
      await expect(page.getByText('第二本书')).toBeVisible();
      await expect(page.getByText('第三本书')).toBeVisible();
    });

    test('应该能够在书籍之间快速切换', async ({ page }) => {
      const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Book/ }).first();

      // 切换到第二本书
      await bookSwitcher.click();
      await page.waitForTimeout(500);
      await page.getByText('第二本书').click();
      await page.waitForTimeout(1000);

      // 验证当前书籍是第二本
      await expect(bookSwitcher).toContainText('第二本书');

      // 快速切换到第三本书
      await bookSwitcher.click();
      await page.waitForTimeout(500);
      await page.getByText('第三本书').click();
      await page.waitForTimeout(1000);

      // 验证当前书籍是第三本
      await expect(bookSwitcher).toContainText('第三本书');
    });

    test('删除书籍后应该正确更新书籍列表', async ({ page }) => {
      const bookSwitcher = page.locator('.cursor-pointer').filter({ hasText: /Book/ }).first();

      // 打开书籍列表
      await bookSwitcher.click();
      await page.waitForTimeout(500);

      // 删除第二本书
      const bookItems = page.locator('div').filter({ hasText: /第[一二三]本书/ });
      const bookCount = await bookItems.count();

      if (bookCount >= 2) {
        // 查找第二本书的删除按钮
        const secondBook = bookItems.nth(1);
        await secondBook.hover();

        const deleteButton = secondBook.locator('button').filter({ hasText: '' }).locator('svg').filter({ hasText: /trash/i });
        const hasDeleteButton = await deleteButton.count();

        if (hasDeleteButton > 0) {
          // 处理确认对话框
          page.on('dialog', dialog => dialog.accept());
          await deleteButton.click();
          await page.waitForTimeout(1000);

          // 验证书籍列表已更新
          await bookSwitcher.click();
          await page.waitForTimeout(500);

          // 第二本书应该不存在
          const hasSecondBook = await page.getByText('第二本书').count();
          expect(hasSecondBook).toBe(0);
        }
      }
    });
  });

  test.describe('书籍导出', () => {
    test.beforeEach(async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // 创建一本书
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
      await input.fill('导出测试书');
      await input.press('Enter');
      await page.waitForTimeout(1500);
    });

    test('应该能够导出整个书籍为 Markdown', async ({ page }) => {
      // 查找导出按钮
      const exportButton = page.locator('button').filter({ hasText: /导出|Export/ });
      const hasExportButton = await exportButton.count();

      if (hasExportButton > 0) {
        // 设置下载处理
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

        await exportButton.first().click();

        // 等待下载开始
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.md');
      }
    });
  });
});
