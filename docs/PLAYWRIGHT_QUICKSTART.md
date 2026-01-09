# 📚 Playwright E2E 测试快速入门指南

## 🎯 什么是端到端测试？

端到端测试（E2E Testing）模拟真实用户操作，从头到尾测试整个应用程序流程。

**示例场景**：
1. 用户打开应用
2. 创建一本新书
3. 添加章节
4. 输入内容
5. 保存并导出

## 🚀 快速开始

### 1️⃣ 安装依赖（已完成）
```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

### 2️⃣ 运行第一个测试
```bash
# 运行所有测试
npm test

# 运行特定文件
npx playwright test e2e/book-management.spec.ts

# 有头模式（可以看到浏览器）
npm run test:headed
```

### 3️⃣ 查看测试报告
```bash
npm run test:report
```

## 📝 测试文件结构

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能组名称', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前执行
    await page.goto('/');
  });

  test('测试用例名称', async ({ page }) => {
    // 1. 操作页面
    await page.click('button');
    await page.fill('input', 'text');

    // 2. 断言结果
    await expect(page.getByText('成功')).toBeVisible();
  });
});
```

## 🔍 常用选择器

```typescript
// 文本选择
page.getByText('提交')
page.getByRole('button', { name: '提交' })

// Placeholder 选择
page.getByPlaceholder('请输入用户名')

// CSS 选择器
page.locator('.submit-button')
page.locator('#username')

// 测试 ID（推荐）
page.getByTestId('submit-button')
```

## ⏳ 等待策略

```typescript
// 等待元素可见
await expect(page.getByText('加载完成')).toBeVisible();

// 等待元素消失
await expect(page.getByText('加载中')).not.toBeVisible();

// 等待导航完成
await page.waitForURL('/dashboard');

// 等待网络请求
await page.waitForResponse('**/api/data');

// 固定等待（不推荐，仅在必要时使用）
await page.waitForTimeout(1000);
```

## 🎭 模拟用户操作

```typescript
// 点击
await page.click('button')

// 输入文本
await page.fill('input', 'Hello')

// 键盘操作
await page.keyboard.press('Enter')

// 选择下拉
await page.selectOption('select', 'option1')

// 上传文件
await page.setInputFiles('input[type="file"]', 'file.pdf')

// 悬停
await page.hover('.menu-item')

// 拖拽
await page.dragAndDrop('#source', '#target')
```

## 📸 调试技巧

### 1. 使用有头模式
```bash
npm run test:headed
```

### 2. 使用调试模式
```bash
npm run test:debug
```

### 3. 添加断点
```typescript
test('测试', async ({ page }) => {
  await page.pause(); // 暂停执行，打开 Playwright Inspector
});
```

### 4. 截图
```typescript
await page.screenshot({ path: 'screenshot.png' });
```

### 5. 录制视频
```typescript
// 配置文件中已自动配置
// 失败的测试会自动录制视频
```

## 🎨 Playwright Inspector

```bash
# 启动 Inspector
npx playwright open

# 在代码中使用
await page.pause();
```

**功能**：
- 实时查看页面
- 选择元素
- 录制操作
- 生成代码

## 📊 断言方法

```typescript
// 元素存在
await expect(locator).toBeVisible();
await expect(locator).toBeAttached();

// 元素不存在
await expect(locator).not.toBeVisible();

// 文本内容
await expect(locator).toHaveText('Hello');
await expect(locator).toContainText('World');

// 属性值
await expect(locator).toHaveAttribute('href', '/home');

// 输入框值
await expect(locator).toHaveValue('text');

// 计数
await expect(locator).toHaveCount(3);

// 页面 URL
await expect(page).toHaveURL('/dashboard');
```

## 🔧 实用技巧

### 1. 测试辅助函数
```typescript
// e2e/helpers.ts
export async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// 在测试中使用
test('用户登录', async ({ page }) => {
  await login(page, 'user@example.com', 'password');
});
```

### 2. 测试数据清理
```typescript
test.afterEach(async ({ page }) => {
  // 清理测试数据
  await page.evaluate(() => {
    localStorage.clear();
    indexedDB.deleteDatabase('my-db');
  });
});
```

### 3. 重试策略
```typescript
test.configure({ retries: 3 }); // 失败后重试3次
```

### 4. 超时设置
```typescript
test.configure({ timeout: 60000 }); // 60秒超时
```

## 🎯 最佳实践

### ✅ DO（推荐）
1. **使用语义化选择器**
   ```typescript
   page.getByRole('button', { name: '提交' })
   page.getByTestId('submit-button')
   ```

2. **添加明确的等待**
   ```typescript
   await expect(page.getByText('成功')).toBeVisible();
   ```

3. **测试隔离**
   ```typescript
   test.beforeEach(async ({ page }) => {
     // 每个测试独立运行
     await setupTestData(page);
   });
   ```

4. **使用测试步骤**
   ```typescript
   await test.step('创建书籍', async () => {
     await page.click('button');
   });
   ```

### ❌ DON'T（不推荐）
1. **使用脆弱的 CSS 选择器**
   ```typescript
   page.locator('div > div > span:nth-child(3)') // ❌
   ```

2. **硬编码等待时间**
   ```typescript
   await page.waitForTimeout(5000); // ❌ 除非必要
   ```

3. **测试依赖**
   ```typescript
   test('测试2依赖测试1的数据') // ❌ 测试应该独立
   ```

## 🐛 常见问题

### Q1: 测试超时
```typescript
// 解决方案：增加超时时间
test.configure({ timeout: 60000 });
```

### Q2: 元素找不到
```typescript
// 解决方案：添加等待
await page.waitForSelector('.my-element');
await expect(page.getByText('内容')).toBeVisible();
```

### Q3: 测试不稳定
```typescript
// 解决方案：添加重试
test.configure({ retries: 3 });
```

### Q4: 网络请求慢
```typescript
// 解决方案：等待网络空闲
await page.waitForLoadState('networkidle');
```

## 📚 学习资源

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [选择器指南](https://playwright.dev/docs/selectors)
- [断言列表](https://playwright.dev/docs/test-assertions)

## 💡 示例测试场景

### 场景1：创建并保存文档
```typescript
test('创建并保存文档', async ({ page }) => {
  await page.goto('/');

  // 创建书籍
  await createTestBook(page, '我的第一本书');

  // 添加章节
  await createTestChapter(page, '第一章');

  // 输入内容
  await typeInEditor(page, '这是我的第一本书的内容');

  // 等待保存
  await page.waitForTimeout(2000);

  // 验证保存成功
  await expect(page.getByText('我的第一本书')).toBeVisible();
});
```

### 场景2：导入 Markdown 文件
```typescript
test('导入 Markdown', async ({ page }) => {
  await page.goto('/');

  // 准备测试文件
  const filePath = 'test-import.md';

  // 上传文件
  await page.setInputFiles('input[type="file"]', filePath);

  // 等待导入完成
  await page.waitForTimeout(3000);

  // 验证导入成功
  await expect(page.getByText('第一章')).toBeVisible();
});
```

### 场景3：目录导航
```typescript
test('目录点击跳转', async ({ page }) => {
  await page.goto('/');

  // 添加内容
  await addHeading(page, 1, '第一章');
  await page.keyboard.press('Enter');
  await typeInEditor(page, '内容');

  // 等待目录更新
  await waitForTocUpdate(page);

  // 点击目录
  await page.getByText('第一章').click();

  // 验证跳转成功
  const heading = page.locator('h1').filter({ hasText: '第一章' });
  await expect(heading).toBeInViewport();
});
```

---

**开始编写你的第一个测试吧！** 🎉
