"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Clock, FileText, Pin, MoreHorizontal, Tag, Trash2, Edit3 } from 'lucide-react';
import { EnhancedBook } from '@/lib/types';

interface BookCardProps {
  book: EnhancedBook;
  onClick?: (bookId: number) => void;
}

/**
 * 书籍卡片组件（Kindle 风格简约文字卡）
 *
 * 功能：
 * - 显示书籍封面颜色、标题、描述
 * - 显示字数、最后阅读时间
 * - 显示标签
 * - 支持置顶、编辑、删除操作
 */
export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const router = useRouter();
  const { deleteBook, pinBook, removeTagFromBook } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(book.id!);
    } else {
      router.push(`/editor/${book.id}`);
    }
  };

  const formatWordCount = (count: number) => {
    if (count < 1000) return `${count} 字`;
    return `${(count / 1000).toFixed(1)}k 字`;
  };

  const formatLastReadAt = (timestamp: number | null) => {
    if (!timestamp) return null;
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 周前`;
    return `${Math.floor(days / 30)} 月前`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除《${book.title}》吗？`)) {
      await deleteBook(book.id!);
    }
    setShowMenu(false);
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await pinBook(book.id!, !book.isPinned);
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: 打开编辑模态框
    const newTitle = prompt('编辑书名：', book.title);
    if (newTitle && newTitle !== book.title) {
      useStore.getState().updateBook(book.id!, { title: newTitle });
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      style={{
        backgroundColor: book.coverColor,
        minHeight: '200px',
      }}
    >
      {/* 置顶标记 */}
      {book.isPinned && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-medium text-stone-600">
            <Pin size={12} className="fill-current" />
            <span>置顶</span>
          </div>
        </div>
      )}

      {/* 操作菜单按钮 */}
      <div className="absolute top-3 right-3 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
          >
            <MoreHorizontal size={16} className="text-stone-600" />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-0"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-20">
                <button
                  onClick={handleTogglePin}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                >
                  <Pin size={14} />
                  <span>{book.isPinned ? '取消置顶' : '置顶'}</span>
                </button>
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  <span>编辑</span>
                </button>
                <hr className="my-1 border-stone-200" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  <span>删除</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 主要内容 */}
      <div className="p-6 h-full flex flex-col">
        {/* 书名 */}
        <h3 className="text-xl font-bold text-stone-800 mb-3 line-clamp-2 leading-tight">
          {book.title}
        </h3>

        {/* 描述 */}
        {book.description && (
          <p className="text-sm text-stone-600 mb-4 line-clamp-2">
            {book.description}
          </p>
        )}

        {/* 底部信息 */}
        <div className="mt-auto space-y-2">
          {/* 字数 */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <FileText size={12} />
            <span>{formatWordCount(book.wordCount)}</span>
          </div>

          {/* 最后阅读时间 */}
          {book.lastReadAt && (
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Clock size={12} />
              <span>{formatLastReadAt(book.lastReadAt)}</span>
            </div>
          )}

          {/* 标签 */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {book.tags.slice(0, 3).map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs text-stone-600"
                >
                  <Tag size={10} />
                  <span>{tag}</span>
                </div>
              ))}
              {book.tags.length > 3 && (
                <span className="text-xs text-stone-500">+{book.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 悬停效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};
