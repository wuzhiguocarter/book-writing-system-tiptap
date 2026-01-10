# hooks 模块 - React 自定义 Hooks

[根目录](../CLAUDE.md) > **hooks**

> 最后更新：2026-01-10 01:20:38

---

## 模块职责

`hooks/` 模块包含可复用的 React 自定义 Hooks：
- ⏱️ **useDebounce** - 防抖 Hook（延迟执行函数）
- 🎯 **useActiveHeading** - 滚动同步 Hook（监听标题位置）

---

## Hook 索引

| Hook 名 | 文件 | 用途 | 使用场景 |
|---------|------|------|----------|
| `useDebounce` | `useDebounce.ts` | 防抖延迟执行 | 编辑器自动保存、搜索输入 |
| `useActiveHeading` | `useActiveHeading.ts` | 监听滚动位置，高亮当前标题 | 右侧目录栏滚动同步 |

---

## 1. useDebounce - 防抖 Hook

### 职责

延迟执行函数，避免频繁调用（如编辑器输入、搜索输入）。

### 签名

```typescript
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T
```

### 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `callback` | `Function` | 需要防抖的回调函数 |
| `delay` | `number` | 延迟时间（毫秒） |

### 返回值

- `T` - 防抖后的函数（类型与原函数相同）

### 使用示例

```typescript
import useDebounce from '@/hooks/useDebounce';

const Editor = () => {
  const { updateChapterContent } = useStore();

  // 创建防抖保存函数（1 秒延迟）
  const debouncedSave = useDebounce((html: string) => {
    if (currentChapter?.id) {
      updateChapterContent(currentChapter.id, html);
    }
  }, 1000);

  const handleEditorChange = (content: string) => {
    // 立即更新 UI，延迟保存到数据库
    debouncedSave(content);
  };

  return <Editor onChange={handleEditorChange} />;
};
```

### 实现原理

```typescript
import { useRef, useCallback, useEffect } from 'react';

function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器（组件卸载时）
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 返回防抖函数
  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedFunction;
}
```

### 关键特性

- ✅ **类型安全** - 使用泛型保留原函数类型
- ✅ **内存安全** - 组件卸载时自动清理定时器
- ✅ **性能优化** - 使用 `useCallback` 避免重新创建函数

---

## 2. useActiveHeading - 滚动同步 Hook

### 职责

监听编辑器滚动位置，自动高亮当前可见的标题（用于右侧目录栏）。

### 签名

```typescript
function useActiveHeading(): string
```

### 返回值

- `string` - 当前活动标题的 ID（如 `heading-1-h2-0`）

### 使用示例

```typescript
import { useActiveHeading } from '@/hooks/useActiveHeading';

const SidebarRight = () => {
  const { toc } = useStore();
  const activeId = useActiveHeading();

  return (
    <div>
      {toc.map((item) => (
        <div
          key={item.id}
          className={activeId === item.id ? 'active' : ''}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
};
```

### 实现原理

```typescript
import { useState, useEffect } from 'react';

export const useActiveHeading = () => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // IntersectionObserver 回调
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // 找到所有可见的标题
      const visibleHeadings = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleHeadings.length > 0) {
        const topVisibleHeading = visibleHeadings[0];
        const id = topVisibleHeading.target.getAttribute('data-id');
        if (id) {
          setActiveId(id);
        }
      }
    };

    // 创建 IntersectionObserver
    const observer = new IntersectionObserver(handleIntersection, {
      // 视口中间区域为有效观察区
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    });

    // 观察所有带有 data-id 属性的标题
    const observeHeadings = () => {
      observer.disconnect();
      const headings = document.querySelectorAll('[data-id]');
      headings.forEach(heading => observer.observe(heading));
    };

    // 初始观察
    observeHeadings();

    // 监听 DOM 变化（动态添加的标题）
    const mutationObserver = new MutationObserver(() => {
      observeHeadings();
    });

    const editorContainer = document.getElementById('editor-scroll-container');
    if (editorContainer) {
      mutationObserver.observe(editorContainer, {
        childList: true,
        subtree: true
      });
    }

    // 清理函数
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  return activeId;
};
```

### 关键特性

- ✅ **IntersectionObserver API** - 高性能滚动监听
- ✅ **MutationObserver** - 自动监听 DOM 变化（动态标题）
- ✅ **视口区域判定** - 只高亮视口中间区域的标题（`rootMargin: '-80px 0px -70% 0px'`）
- ✅ **自动清理** - 组件卸载时断开观察器

### IntersectionObserver 参数说明

| 参数 | 值 | 说明 |
|------|------|------|
| `rootMargin` | `'-80px 0px -70% 0px'` | 上方 80px、下方 30% 为无效区（只高亮中间区域） |
| `threshold` | `0` | 标题进入视口即触发（无需完全可见） |

---

## 关键依赖与配置

### 无外部依赖

所有 Hooks 仅使用 React 内置 API：
- `useState` - 状态管理
- `useEffect` - 副作用处理
- `useRef` - 引用保存
- `useCallback` - 函数缓存

### 浏览器 API

- `setTimeout` / `clearTimeout` - 定时器（useDebounce）
- `IntersectionObserver` - 滚动监听（useActiveHeading）
- `MutationObserver` - DOM 变化监听（useActiveHeading）

---

## 测试与质量

### 单元测试（待补充）

**`useDebounce` 测试用例：**
- ✅ 延迟执行函数
- ✅ 多次调用只执行最后一次
- ✅ 组件卸载时清理定时器

**`useActiveHeading` 测试用例：**
- ✅ 初始状态为空字符串
- ✅ 滚动时高亮对应标题
- ✅ 组件卸载时断开观察器

### E2E 测试覆盖

Hooks 功能通过 E2E 测试间接验证：
- `e2e/toc-navigation.spec.ts` - 滚动同步功能
- `e2e/editor.spec.ts` - 自动保存功能

---

## 常见问题 (FAQ)

### Q1: 为什么使用 IntersectionObserver 而不是 scroll 事件？

**A:** IntersectionObserver 性能更好，不会阻塞主线程，支持异步监听多个元素。

### Q2: 如何调整防抖延迟时间？

**A:** 根据使用场景调整：
```typescript
// 编辑器自动保存：1 秒
const debouncedSave = useDebounce(saveContent, 1000);

// 搜索输入：300 毫秒
const debouncedSearch = useDebounce(performSearch, 300);
```

### Q3: 如何处理标题 ID 重复？

**A:** 在 `lib/utils/hash.ts` 中生成唯一 ID：
```typescript
generateHeadingId(text, level, index)
// 示例：heading-1-h2-0, heading-2-h2-1
```

### Q4: 为什么 useActiveHeading 使用空依赖数组？

**A:** 只在组件挂载时设置一次观察器，避免重复创建。使用 `MutationObserver` 自动监听 DOM 变化。

### Q5: 如何添加新的 Hook？

**A:** 在 `hooks/` 目录下创建新文件，导出自定义 Hook：
```typescript
// hooks/useXXX.ts
import { useState, useEffect } from 'react';

export function useXXX() {
  const [state, setState] = useState(null);

  useEffect(() => {
    // 逻辑
  }, []);

  return state;
}
```

---

## 相关文件清单

### 核心 Hooks

- `hooks/useDebounce.ts` - 防抖 Hook（50 行）
- `hooks/useActiveHeading.ts` - 滚动同步 Hook（90 行）

### 使用场景

- `components/editor/Editor.tsx` - 使用 `useDebounce` 自动保存
- `components/sidebar/SidebarRight.tsx` - 使用 `useActiveHeading` 滚动同步

### 依赖模块

- `@/lib/store.ts` - Zustand 状态（调用 Hook 的组件）
- `@/lib/utils/hash.ts` - 标题 ID 生成（配合 useActiveHeading）

---

## 下一步优化建议

1. **性能优化**
   - 使用 `requestAnimationFrame` 优化滚动同步
   - 节流滚动事件（如果改用 scroll 事件）

2. **功能增强**
   - 添加 `useThrottle` Hook（节流）
   - 添加 `useLocalStorage` Hook（本地存储）
   - 添加 `useMediaQuery` Hook（响应式）

3. **测试覆盖**
   - 单元测试（React Hooks Testing Library）
   - 集成测试（配合组件测试）

4. **文档完善**
   - 添加使用示例（Storybook）
   - 添加性能基准测试

---

**文档生成时间：** 2026-01-10 01:20:38
**模块覆盖状态：** ✅ 完整
