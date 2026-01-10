"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Search, Grid3x3, List, SlidersHorizontal, Plus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';

/**
 * 书架顶部栏组件
 *
 * 功能：
 * - 显示 Logo 和标题
 * - 集成搜索框
 * - 视图切换按钮（网格/列表）
 * - 筛选按钮
 * - 新建书籍按钮
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
      <div className="h-16 bg-white border-b border-stone-200 flex items-center px-6 gap-4 shrink-0">
        {/* Logo / 标题 */}
        <div className="text-xl font-bold text-stone-800">
          📚 BookCraft
        </div>

        {/* 搜索框 */}
        <div className="flex-1 max-w-2xl">
          <SearchBar />
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              title="网格视图"
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-stone-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              title="列表视图"
            >
              <List size={18} />
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

          {/* 新建书籍按钮 */}
          <button
            onClick={handleCreateBook}
            className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium"
          >
            <Plus size={18} />
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
