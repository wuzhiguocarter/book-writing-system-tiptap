"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Search, Grid3x3, List, SlidersHorizontal, Plus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { Logo } from './Logo';

/**
 * 书架顶部栏组件（优化版）
 *
 * 改进点：
 * - 集成专业 Logo 组件（替换 emoji）
 * - 优化按钮交互效果
 * - 增强搜索框样式
 * - 提升整体视觉层次
 */
export const BookshelfHeader: React.FC = () => {
  const { viewMode, setViewMode, filterConfig, createBook } = useStore();
  const [showFilter, setShowFilter] = useState(false);

  const handleCreateBook = () => {
    const title = prompt('请输入书名：');
    const description = prompt('请输入描述（可选）：');
    if (title) {
      createBook(title, description || '');
    }
  };

  const hasActiveFilters =
    (filterConfig.filterByTags && filterConfig.filterByTags.length > 0) ||
    filterConfig.filterByCollection !== null ||
    filterConfig.timeRange !== 'all';

  return (
    <>
      <div className="h-17 bg-white/80 backdrop-blur-md border-b border-stone-200/60
                    flex items-center px-6 gap-4 shrink-0
                    shadow-sm relative z-20">
        {/* Logo */}
        <Logo variant="default" />

        {/* 搜索框 */}
        <div className="flex-1 max-w-2xl">
          <SearchBar />
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-3">
          {/* 视图切换（优化） */}
          <div className="flex items-center bg-stone-100/80 rounded-xl p-1.5
                        border border-stone-200/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-stone-800'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
              title="网格视图"
            >
              <Grid3x3 size={17} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-stone-800'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-white/50'
              }`}
              title="列表视图"
            >
              <List size={17} />
            </button>
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2 rounded-lg transition-colors relative ${
              showFilter || hasActiveFilters
                ? 'bg-blue-50 text-blue-600'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
            title="筛选"
          >
            <SlidersHorizontal size={18} />
            {hasActiveFilters && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

          {/* 新建书籍按钮（优化） */}
          <button
            onClick={handleCreateBook}
            className="flex items-center gap-2 px-5 py-2.5
                      bg-stone-800 text-white
                      rounded-xl
                      hover:bg-stone-700 hover:shadow-lg
                      active:scale-95
                      transition-all duration-200
                      font-semibold tracking-tight"
          >
            <Plus size={18} className="transform transition-transform group-hover:rotate-90" />
            <span>新建书籍</span>
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilter && (
        <FilterPanel onClose={() => setShowFilter(false)} />
      )}
    </>
  );
};
