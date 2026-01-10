"use client";

import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { BookCard } from './BookCard';
import { BookshelfSkeleton } from './BookshelfSkeleton';
import { EmptyState } from './EmptyState';
import { AnimatePresence, motion } from 'framer-motion';

interface BookshelfGridProps {
  onBookClick?: (bookId: number) => void;
}

/**
 * 书籍网格组件（优化版）
 *
 * 改进点：
 * - 集成骨架屏（加载状态）
 * - 使用 Framer Motion 实现布局动画
 * - 卡片入场动画（交错延迟）
 * - 优化网格间距
 * - 集成 EmptyState 组件
 */
export const BookshelfGrid: React.FC<BookshelfGridProps> = ({ onBookClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const {
    books,
    collections,
    currentCollection,
    filterConfig,
    searchQuery,
    viewMode,
    createBook,
  } = useStore();

  // 模拟加载状态（首次加载）
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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

  // 网格视图样式（优化）
  const gridClassName = useMemo(() => {
    if (viewMode === 'list') {
      return 'flex flex-col gap-3 max-w-4xl mx-auto';
    }
    // 响应式网格 + 优化间距
    return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ' +
           'lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ' +
           'gap-4 sm:gap-5 lg:gap-6 ' +
           'transition-all duration-500 ease-out';
  }, [viewMode]);

  // 骨架屏加载状态
  if (isLoading) {
    return <BookshelfSkeleton count={12} />;
  }

  // 空状态（优化）
  if (filteredBooks.length === 0) {
    const emptyType = searchQuery ? 'search' : 'empty';

    return (
      <EmptyState
        type={emptyType}
        onCreateBook={async () => {
          setIsCreating(true);
          const title = prompt('请输入书名：');
          const description = prompt('请输入描述（可选）：');
          if (title) {
            await createBook(title, description || '');
          }
          setIsCreating(false);
        }}
        onClearSearch={() => {
          useStore.getState().setSearchQuery('');
        }}
        onClearFilter={() => {
          useStore.getState().updateFilterConfig({
            filterByTags: undefined,
            filterByCollection: null,
            timeRange: 'all',
          });
        }}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      {/* 当前文件夹标题（优化） */}
      {currentCollection && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
            📁 {currentCollection.name}
          </h2>
          <p className="text-sm text-stone-500 mt-1.5 font-medium">
            {filteredBooks.length} 本书籍
          </p>
        </div>
      )}

      {/* 书籍网格（添加布局动画） */}
      <div className={gridClassName}>
        <AnimatePresence mode="popLayout">
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <BookCard
                book={book}
                onClick={onBookClick}
                index={index}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
