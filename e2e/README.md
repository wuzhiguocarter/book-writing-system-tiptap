# 端到端测试 (E2E Tests)

本项目使用 Playwright 进行端到端测试。

## 测试覆盖范围

### 1. 书籍管理测试 (`book-management.spec.ts`)
- ✅ 创建书籍
- ✅ 删除书籍
- ✅ 切换书籍
- ✅ 显示书籍切换器

### 2. 章节管理测试 (`chapter-management.spec.ts`)
- ✅ 添加章节
- ✅ 删除章节
- ✅ 选择章节
- ✅ 编辑章节标题
- ✅ 拖拽排序章节

### 3. 编辑器功能测试 (`editor.spec.ts`)
- ✅ 显示编辑器
- ✅ 输入文本
- ✅ 标题格式
- ✅ 粗体/斜体格式
- ✅ 列表创建
- ✅ 自动保存（防抖）

### 4. 导入导出测试 (`import-export.spec.ts`)
- ✅ 导入 Markdown 文件
- ✅ 导出为 PDF
- ✅ 导出为 Markdown
- ✅ 批量导入

### 5. 目录导航测试 (`toc-navigation.spec.ts`)
- ✅ 提取文档标题
- ✅ 目录点击跳转
- ✅ 滚动同步高亮
- ✅ 标题层级缩进
- ✅ 重复标题处理

## 运行测试

### 运行所有测试
```bash
npm test
```

### 以有头模式运行（显示浏览器窗口）
```bash
npm run test:headed
```

### 调试模式
```bash
npm run test:debug
```

### UI 模式（交互式测试界面）
```bash
npm run test:ui
```

### 查看测试报告
```bash
npm run test:report
```

## 测试文件结构

```
e2e/
├── book-management.spec.ts    # 书籍管理测试
├── chapter-management.spec.ts  # 章节管理测试
├── editor.spec.ts              # 编辑器功能测试
├── import-export.spec.ts       # 导入导出测试
├── toc-navigation.spec.ts      # 目录导航测试
├── helpers.ts                  # 测试辅助函数
└── README.md                   # 本文件
```

## 配置

测试配置位于 `playwright.config.ts`：

- **基础 URL**: `http://localhost:3000`
- **浏览器**: Chromium
- **测试超时**: 30 秒
- **失败重试**: CI 环境下 2 次
- **报告格式**: HTML、List、JUnit

## 注意事项

1. **测试数据隔离**: 每个测试都会创建独立的测试数据
2. **异步等待**: 使用 `waitForTimeout` 确保状态更新完成
3. **CI/CD**: 在 CI 环境中运行时，自动禁用有头模式
4. **视频录制**: 失败的测试会自动录制视频

## 编写新测试

参考 `helpers.ts` 中的辅助函数：

```typescript
import { test, expect } from '@playwright/test';
import { createTestBook, createTestChapter, addHeading } from './helpers';

test('我的测试用例', async ({ page }) => {
  await page.goto('/');

  // 创建测试书籍
  await createTestBook(page, '测试书籍');

  // 创建测试章节
  await createTestChapter(page);

  // 在编辑器中添加标题
  await addHeading(page, 1, '第一章');

  // 断言
  await expect(page.getByText('第一章')).toBeVisible();
});
```

## 故障排查

### 测试超时
- 检查开发服务器是否正常运行
- 增加 `playwright.config.ts` 中的超时时间

### 元素未找到
- 使用 `page.waitForTimeout()` 增加等待时间
- 检查选择器是否正确
- 使用 Playwright Inspector 检查元素

### 测试不稳定
- 使用 `test.step()` 组织测试步骤
- 添加明确的等待和断言
- 检查是否有竞态条件

## 相关资源

- [Playwright 文档](https://playwright.dev)
- [Playwright 测试最佳实践](https://playwright.dev/docs/best-practices)
- [项目功能文档](../README.md)
