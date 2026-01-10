# app 模块 - Next.js 页面路由层

[根目录](../CLAUDE.md) > **app**

> 最后更新：2026-01-10 01:20:38

---

## 模块职责

`app/` 模块是 Next.js 16 App Router 的核心目录，负责：
- 📄 页面路由与渲染（书架首页、编辑器页面）
- 🎨 全局布局与元数据
- 🔀 客户端导航与路由参数解析
- ⚡ SSR/CSR 混合渲染（使用 Suspense）

---

## 入口与启动

### 主要页面

| 文件路径 | 路由 | 职责 |
|---------|------|------|
| `page.tsx` | `/` | 书架首页（书籍网格、搜索、筛选） |
| `editor/[bookId]/page.tsx` | `/editor/:bookId` | 编辑器页面（三栏布局） |
| `layout.tsx` | 全局 | 根布局（字体、元数据、HTML 结构） |

### 启动流程

```
用户访问 / → app/page.tsx
  ├─ 加载 Zustand store (loadData)
  ├─ 渲染 BookshelfHeader + BookshelfGrid + BookshelfSidebar
  └─ 点击书籍 → router.push('/editor/1')

用户访问 /editor/1 → app/editor/[bookId]/page.tsx
  ├─ 解析路由参数 useParams()
  ├─ 加载书籍数据 (selectBook)
  ├─ 渲染三栏布局 (SidebarLeft + Editor + SidebarRight)
  └─ 返回按钮 → router.push('/')
```

---

## 对外接口

### 页面组件

**`page.tsx` - 书架首页**
```typescript
function BookshelfPageContent() {
  const router = useRouter();
  const { loadData, isLoading } = useStore();

  // 路由跳转
  const handleBookClick = (bookId: number) => {
    router.push(`/editor/${bookId}`);
  };

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BookshelfPageContent />
    </Suspense>
  );
}
```

**`editor/[bookId]/page.tsx` - 编辑器页面**
```typescript
function EditorPageContent() {
  const params = useParams();
  const bookId = parseInt(params.bookId as string);
  const { books, loadData, selectBook, currentBook } = useStore();

  useEffect(() => {
    if (bookId && currentBook?.id !== bookId) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        selectBook(book);
      } else {
        router.push('/'); // 书籍不存在，返回书架
      }
    }
  }, [bookId, currentBook, books, selectBook, router]);

  return (
    <div className="flex h-screen">
      <SidebarLeft />
      <Editor />
      <SidebarRight />
    </div>
  );
}
```

### 布局组件

**`layout.tsx` - 全局布局**
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
```

---

## 关键依赖与配置

### 依赖项

- `next/navigation` - 路由钩子（`useRouter`, `useParams`）
- `@/lib/store` - Zustand 全局状态
- `@/components/*` - UI 组件（Bookshelf、Editor、Sidebar）

### Next.js 配置

**`next.config.ts`**
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},              // Turbopack 构建
  reactCompiler: true,        // React Compiler 自动优化
  cacheComponents: true,      // 缓存组件
};
```

### 路由元数据

- `layout.tsx` 设置全局字体（Inter）
- 使用 `Suspense` 避免路由导航闪烁
- 客户端组件标记（`"use client"`）

---

## 数据模型

### 路由参数

```typescript
// editor/[bookId]/page.tsx
interface Params {
  bookId: string;  // URL 中的书籍 ID（需转换为 number）
}
```

### 状态管理

通过 `@/lib/store` 访问：
- `loadData()` - 加载书籍、文件夹、标签
- `selectBook(book)` - 选择当前书籍
- `books` - 书籍列表
- `currentBook` - 当前选中的书籍

---

## 测试与质量

### E2E 测试覆盖

**`e2e/bookshelf.spec.ts`**
- ✅ 书架首页布局渲染
- ✅ 创建/编辑/删除书籍
- ✅ 搜索功能
- ✅ 视图切换（网格/列表）
- ✅ 导航到编辑器

**`e2e/toc-navigation.spec.ts`**
- ✅ 编辑器页面渲染
- ✅ 返回按钮导航

### 测试命令

```bash
# 测试书架首页
pnpm test -- bookshelf.spec.ts

# 测试编辑器页面
pnpm test -- toc-navigation.spec.ts
```

---

## 常见问题 (FAQ)

### Q1: 为什么使用 `Suspense` 包裹页面组件？

**A:** 避免路由导航时的闪烁，同时支持 Next.js 16 的流式渲染（Streaming SSR）。

### Q2: 如何处理无效的 `bookId`？

**A:** 在 `editor/[bookId]/page.tsx` 中检查书籍是否存在，不存在则重定向到书架首页：
```typescript
const book = books.find(b => b.id === bookId);
if (!book) {
  router.push('/');
}
```

### Q3: 为什么书架首页和编辑器页面都是客户端组件？

**A:** 需要访问浏览器 API（IndexedDB via Dexie.js）和 Zustand store，必须标记为 `"use client"`。

### Q4: 如何添加新的页面路由？

**A:** 在 `app/` 目录下创建新文件夹和 `page.tsx`：
```bash
app/
  settings/
    page.tsx  # /settings 路由
```

---

## 相关文件清单

### 核心文件

- `app/page.tsx` - 书架首页（72 行）
- `app/editor/[bookId]/page.tsx` - 编辑器页面（97 行）
- `app/layout.tsx` - 全局布局
- `app/globals.css` - 全局样式（Notion 主题、TipTap 编辑器样式）

### 依赖组件

- `@/components/bookshelf/*` - 书架 UI 组件
- `@/components/editor/*` - 编辑器组件
- `@/components/sidebar/*` - 侧边栏组件
- `@/lib/store.ts` - Zustand 状态管理
- `@/lib/db.ts` - IndexedDB 数据库

---

## 下一步优化建议

1. **错误边界（Error Boundary）**
   - 添加 `error.tsx` 和 `not-found.tsx` 处理错误状态

2. **加载状态优化**
   - 使用 `loading.tsx` 定义全局加载骨架屏

3. **元数据（Metadata）**
   - 动态生成页面标题和描述（基于书籍信息）

4. **性能优化**
   - 使用 `React.memo` 优化页面组件
   - 减少 `useEffect` 依赖项

---

**文档生成时间：** 2026-01-10 01:20:38
**模块覆盖状态：** ✅ 完整
