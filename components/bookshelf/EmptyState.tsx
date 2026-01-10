"use client";

import { BookOpen, Search, FilterX, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

type EmptyStateType = 'empty' | 'search' | 'filtered';

interface EmptyStateProps {
  type: EmptyStateType;
  onCreateBook?: () => void;
  onClearSearch?: () => void;
  onClearFilter?: () => void;
}

/**
 * 空状态组件
 *
 * 设计理念：
 * - Notion 风格的极简设计
 * - 友好的引导文案
 * - 入场动画
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onCreateBook,
  onClearSearch,
  onClearFilter,
}) => {
  const content = {
    empty: {
      icon: BookOpen,
      title: '还没有书籍',
      description: '点击"新建书籍"开始您的创作之旅',
      actionLabel: '新建第一本书',
      onAction: onCreateBook,
    },
    search: {
      icon: Search,
      title: '没有找到匹配的书籍',
      description: '尝试其他搜索词或清除筛选条件',
      actionLabel: '清除搜索',
      onAction: onClearSearch,
    },
    filtered: {
      icon: FilterX,
      title: '没有符合条件的书籍',
      description: '调整筛选条件或切换到其他文件夹',
      actionLabel: '清除筛选',
      onAction: onClearFilter,
    },
  };

  const { icon: Icon, title, description, actionLabel, onAction } = content[type];

  return (
    <div className="flex-1 flex items-center justify-center p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* 图标背景 */}
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-stone-200/30 rounded-3xl blur-2xl" />
          <div className="relative w-20 h-20 bg-gradient-to-br from-stone-100 to-stone-50
                        rounded-2xl flex items-center justify-center
                        border border-stone-200/60 shadow-lg
                        mx-auto">
            <Icon size={36} className="text-stone-400" />
          </div>
        </div>

        {/* 标题和描述 */}
        <h3 className="text-xl font-semibold text-stone-800 mb-2">
          {title}
        </h3>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          {description}
        </p>

        {/* 操作按钮 */}
        {onAction && (
          <button
            onClick={onAction}
            className="
              inline-flex items-center gap-2 px-5 py-2.5
              bg-stone-800 text-white rounded-xl
              hover:bg-stone-700 hover:shadow-lg
              active:scale-95
              transition-all duration-200
              font-semibold
            "
          >
            <Plus size={18} />
            <span>{actionLabel}</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
