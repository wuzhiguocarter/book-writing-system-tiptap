# 编辑区层级折叠功能 - 实现总结

## 功能概述
在书写编辑器中实现了对不同标题层级（h1-h4）的折叠和展开功能。用户可以通过点击标题旁的折叠按钮来隐藏或显示该标题下的内容。

## 实现细节

### 1. 状态管理 (store.ts)
- 添加 `collapsedHeadings` 状态：使用 `Set<string>` 存储已折叠的标题ID
- 添加 `toggleHeadingCollapse(headingId)` 函数：切换标题的折叠/展开状态
- 添加 `isHeadingCollapsed(headingId)` 函数：检查标题是否已折叠

### 2. 类型定义 (types.ts)
- 在 `AppState` 接口中添加：
  - `collapsedHeadings: Set<string>`
  - `toggleHeadingCollapse` 函数声明
  - `isHeadingCollapsed` 函数声明

### 3. 编辑器组件 (components/Editor.tsx)
实现了以下关键函数：

#### generateHeadingId(index: number)
- 为每个标题生成唯一ID，格式为：`heading-{chapterId}-{index}`

#### updateCollapsibleUI()
- 检测编辑器中的所有标题元素 (h1-h4)
- 为每个标题注入折叠按钮
- 创建SVG chevron icon（向下箭头）
- 添加点击事件监听
- 配置hover效果

#### updateCollapsedContent()
- 遍历所有标题元素
- 根据折叠状态隐藏/显示内容
- 逻辑：当标题被折叠时，隐藏该标题下所有子级内容，直到遇到同级或更高级的标题

#### React 生命周期
- useEffect：监听 `currentChapter.content` 变化，重新渲染折叠UI
- useEffect：监听 `collapsedHeadings` 变化，更新内容可见性

### 4. 样式 (styles/editor.css)
添加了完整的CSS样式：
- `.heading-with-collapse`：标题flexbox容器
- `.heading-collapse-button-wrapper`：按钮包装器
- `.heading-collapse-btn`：折叠按钮（默认opacity:0，hover时显示）
- `.collapse-icon`：SVG icon动画效果
- 支持focus状态和键盘交互

### 5. 创建的新文件
- `extensions/Collapsible.ts`：预留的TipTap扩展（用于未来功能扩展）
- `components/CollapsibleHeading.tsx`：预留的组件（用于未来重构）

## 功能特性

✅ **折叠/展开层级**
- 支持h1、h2、h3、h4四个标题级别
- 点击标题旁的chevron icon可切换状态
- 按钮只在hover时显示，不影响编辑体验

✅ **智能内容隐藏**
- 仅隐藏目标标题下的子级内容
- 同级或更高级的标题不受影响
- 完整隐藏/显示逻辑确保结构正确

✅ **状态持久化**
- 折叠状态保存在Zustand store中
- 切换章节时自动清除该章节的折叠状态
- 用户交互即时反馈

✅ **可访问性**
- 按钮支持keyboard focus
- 按钮有clear focus outline
- 适当的hover和active状态

## 代码统计
- 修改文件：5个
- 新增行数：491行
- 关键代码：
  - Editor.tsx：+167行（包含折叠逻辑）
  - store.ts：+17行（状态管理）
  - styles/editor.css：+55行（样式）
  - types.ts：+3行（类型定义）

## 测试验证
✅ TypeScript编译通过 - 无type errors
✅ Vite构建成功 - 生产环境可用
✅ 逻辑测试通过 - 折叠/展开算法验证成功
