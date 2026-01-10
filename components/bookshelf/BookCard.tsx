"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Clock, FileText, Pin, MoreHorizontal, Tag, Trash2, Edit3 } from 'lucide-react';
import { EnhancedBook } from '@/lib/types';
import { generateGradient } from '@/lib/utils/color';

interface BookCardProps {
  book: EnhancedBook;
  onClick?: (bookId: number) => void;
  index?: number; // 用于交错动画
}

/**
 * 书籍卡片组件（Notion 风格极简书卡）
 *
 * 设计理念：
 * - 多级阴影系统实现层次感
 * - 悬停提升效果（Kindle 式交互）
 * - 点击缩放反馈
 * - 微妙的光泽效果
 *
 * 功能：
 * - 显示书籍封面颜色、标题、描述
 * - 显示字数、最后阅读时间
 * - 显示标签
 * - 支持置顶、编辑、删除操作
 */
export const BookCard: React.FC<BookCardProps> = ({ book, onClick, index = 0 }) => {
  const router = useRouter();
  const { deleteBook, pinBook, removeTagFromBook } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  // 动画延迟（交错效果）
  const animationDelay = `${index * 50}ms`;

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
      className="group relative rounded-2xl cursor-pointer overflow-hidden
                 bg-white backdrop-blur-sm
                 border border-stone-200/60

                 /* 悬停效果 */
                 hover:border-stone-300/80
                 hover:-translate-y-1

                 /* 点击反馈 */
                 active:scale-[0.98]

                 /* 流畅过渡 */
                 transition-all duration-300 ease-out

                 /* 入场动画 */
                 animate-card-appear"
      style={{
        animationDelay,
        minHeight: '200px',
        // 细腻的背景渐变
        background: generateGradient(book.coverColor),
      }}
    >
      {/* 微妙的顶部高光（光泽效果） */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* 置顶标记（优化） */}
      {book.isPinned && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5
                        bg-white/90 backdrop-blur-md rounded-full
                        shadow-sm border border-stone-200/60">
            <Pin size={11} className="fill-stone-600 text-stone-600" />
            <span className="text-xs font-medium text-stone-700">置顶</span>
          </div>
        </div>
      )}

      {/* 操作菜单按钮（优化） */}
      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 bg-white/90 backdrop-blur-md rounded-xl
                      shadow-sm border border-stone-200/60
                      hover:bg-white hover:shadow-md
                      active:scale-95
                      transition-all duration-200
                      opacity-0 group-hover:opacity-100"
            style={{ transitionDelay: '100ms' }}
          >
            <MoreHorizontal size={15} className="text-stone-600" />
          </button>

          {/* 下拉菜单（优化） */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-0"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52
                          bg-white/95 backdrop-blur-xl rounded-2xl
                          shadow-xl border border-stone-200/60
                          py-2 z-20 animate-menu-appear">
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

      {/* 主要内容（优化间距） */}
      <div className="p-6 h-full flex flex-col">
        {/* 书名（优化字体） */}
        <h3 className="text-xl font-semibold text-stone-800 mb-3
                     line-clamp-2 leading-snug tracking-tight">
          {book.title}
        </h3>

        {/* 描述（优化颜色） */}
        {book.description && (
          <p className="text-sm text-stone-600/80 mb-4 line-clamp-2 leading-relaxed">
            {book.description}
          </p>
        )}

        {/* 底部信息（优化） */}
        <div className="mt-auto space-y-2">
          {/* 字数 */}
          <div className="flex items-center gap-2 text-xs text-stone-500/90">
            <FileText size={11} className="text-stone-400" />
            <span className="font-medium">{formatWordCount(book.wordCount)}</span>
          </div>

          {/* 最后阅读时间 */}
          {book.lastReadAt && (
            <div className="flex items-center gap-2 text-xs text-stone-500/90">
              <Clock size={11} className="text-stone-400" />
              <span className="font-medium">{formatLastReadAt(book.lastReadAt)}</span>
            </div>
          )}

          {/* 标签（优化样式） */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2.5">
              {book.tags.slice(0, 3).map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 px-2.5 py-1
                            bg-white/70 backdrop-blur-sm rounded-full
                            text-xs font-medium text-stone-600/90
                            border border-stone-200/40
                            hover:bg-white/90 hover:border-stone-300/60
                            transition-all duration-200"
                >
                  <Tag size={9} className="text-stone-400" />
                  <span>{tag}</span>
                </div>
              ))}
              {book.tags.length > 3 && (
                <span className="text-xs font-medium text-stone-400/80 px-1">
                  +{book.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 悬停时的微妙渐变覆盖 */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-stone-900/0 via-stone-900/0 to-stone-900/[0.02]
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity duration-300"
      />
    </div>
  );
};
