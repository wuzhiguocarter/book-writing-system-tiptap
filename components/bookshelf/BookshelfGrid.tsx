"use client";

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { BookCard } from './BookCard';

interface BookshelfGridProps {
  onBookClick?: (bookId: number) => void;
}

/**
 * 书籍网格组件
 *
 * 功能：
 * - 根据筛选条件显示书籍
 * - 支持多种排序方式
 * - 支持网格和列表视图
 * - 显示空状态
 */
export const BookshelfGrid: React.FC<BookshelfGridProps> = ({ onBookClick }) => {
  const {
    books,
    collections,
    currentCollection,
    filterConfig,
    searchQuery,
    viewMode,
  } = useStore();

  // 筛选和排序书籍
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(book =>
        book.title.toLowerCase().includes(query) ||
        (book.description && book.description.toLowerCase().includes(query)) ||
        (book.tags && book.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // 文件夹过滤
    if (currentCollection) {
      result = result.filter(book => book.collectionId === currentCollection.id);
    } else if (filterConfig.filterByCollection) {
      result = result.filter(book => book.collectionId === filterConfig.filterByCollection);
    }

    // 标签过滤
    if (filterConfig.filterByTags && filterConfig.filterByTags.length > 0) {
      result = result.filter(book =>
        book.tags && filterConfig.filterByTags.every(tag => book.tags.includes(tag))
      );
    }

    // 时间范围过滤
    if (filterConfig.timeRange && filterConfig.timeRange !== 'all') {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      let startTime: number;

      switch (filterConfig.timeRange) {
        case 'today':
          startTime = now - day;
          break;
        case 'week':
          startTime = now - 7 * day;
          break;
        case 'month':
          startTime = now - 30 * day;
          break;
        case 'year':
          startTime = now - 365 * day;
          break;
        default:
          startTime = 0;
      }

      result = result.filter(book => book.updatedAt >= startTime);
    }

    // 排序
    result.sort((a, b) => {
      // 置顶优先
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const { sortBy, sortOrder } = filterConfig;
      let comparison = 0;

      switch (sortBy) {
        case 'updatedAt':
          comparison = b.updatedAt - a.updatedAt;
          break;
        case 'createdAt':
          comparison = b.createdAt - a.createdAt;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title, 'zh-CN');
          break;
        case 'wordCount':
          comparison = b.wordCount - a.wordCount;
          break;
        case 'lastReadAt':
          if (!a.lastReadAt && !b.lastReadAt) comparison = 0;
          else if (!a.lastReadAt) comparison = 1;
          else if (!b.lastReadAt) comparison = -1;
          else comparison = b.lastReadAt - a.lastReadAt;
          break;
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [books, currentCollection, filterConfig, searchQuery]);

  // 网格视图样式
  const gridClassName = useMemo(() => {
    if (viewMode === 'list') {
      return 'flex flex-col gap-2';
    }
    return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4';
  }, [viewMode]);

  // 空状态
  if (filteredBooks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-stone-600 mb-2">
            {searchQuery ? '没有找到匹配的书籍' : '还没有书籍'}
          </p>
          <p className="text-sm text-stone-500">
            {searchQuery ? '尝试其他搜索词' : '点击"新建书籍"开始创作'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      {/* 当前文件夹标题 */}
      {currentCollection && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-800">
            📁 {currentCollection.name}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {filteredBooks.length} 本书籍
          </p>
        </div>
      )}

      {/* 书籍网格 */}
      <div className={gridClassName}>
        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onClick={onBookClick}
          />
        ))}
      </div>
    </div>
  );
};
