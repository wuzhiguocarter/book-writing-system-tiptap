"use client";

import { useStore } from '@/lib/store';
import { ArrowUpDown, X } from 'lucide-react';

interface FilterPanelProps {
  onClose?: () => void;
}

/**
 * 筛选面板组件
 *
 * 功能：
 * - 多维度筛选（按标签、文件夹、时间范围）
 * - 排序方式选择
 * - 清除筛选条件
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({ onClose }) => {
  const {
    filterConfig,
    collections,
    tags,
    updateFilterConfig,
  } = useStore();

  const hasActiveFilters =
    (filterConfig.filterByTags && filterConfig.filterByTags.length > 0) ||
    filterConfig.filterByCollection !== null ||
    filterConfig.timeRange !== 'all';

  const handleClearFilters = () => {
    updateFilterConfig({
      filterByTags: [],
      filterByCollection: null,
      timeRange: 'all',
    });
  };

  const toggleTag = (tagName: string) => {
    const currentTags = filterConfig.filterByTags || [];
    if (currentTags.includes(tagName)) {
      updateFilterConfig({
        filterByTags: currentTags.filter(t => t !== tagName),
      });
    } else {
      updateFilterConfig({
        filterByTags: [...currentTags, tagName],
      });
    }
  };

  return (
    <div className="bg-white border-b border-stone-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-stone-800">筛选和排序</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-stone-100 rounded transition-colors"
            >
              <X size={20} className="text-stone-600" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 排序方式 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              排序方式
            </label>
            <div className="space-y-2">
              <select
                value={filterConfig.sortBy}
                onChange={(e) => updateFilterConfig({ sortBy: e.target.value as any })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                <option value="updatedAt">更新时间</option>
                <option value="createdAt">创建时间</option>
                <option value="title">书名</option>
                <option value="wordCount">字数</option>
                <option value="lastReadAt">最近阅读</option>
              </select>

              <button
                onClick={() => updateFilterConfig({
                  sortOrder: filterConfig.sortOrder === 'desc' ? 'asc' : 'desc'
                })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm hover:bg-stone-100 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowUpDown size={14} />
                <span>{filterConfig.sortOrder === 'desc' ? '降序' : '升序'}</span>
              </button>
            </div>
          </div>

          {/* 时间范围 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              时间范围
            </label>
            <select
              value={filterConfig.timeRange || 'all'}
              onChange={(e) => updateFilterConfig({ timeRange: e.target.value as any })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="all">全部</option>
              <option value="today">今天</option>
              <option value="week">最近一周</option>
              <option value="month">最近一月</option>
              <option value="year">最近一年</option>
            </select>
          </div>

          {/* 文件夹 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              文件夹
            </label>
            <select
              value={filterConfig.filterByCollection || ''}
              onChange={(e) => updateFilterConfig({
                filterByCollection: e.target.value ? parseInt(e.target.value) : null
              })}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="">全部</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 标签筛选 */}
        {tags.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isSelected = filterConfig.filterByTags?.includes(tag.name);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.name)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm transition-colors
                      ${isSelected
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }
                    `}
                  >
                    #{tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 清除筛选 */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            <button
              onClick={handleClearFilters}
              className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
            >
              清除所有筛选条件
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
