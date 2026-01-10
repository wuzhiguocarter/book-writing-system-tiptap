"use client";

import { useStore } from '@/lib/store';
import { CollectionCard } from './CollectionCard';
import { Hash, FolderPlus, Plus } from 'lucide-react';

/**
 * 书架侧边栏组件（优化版）
 *
 * 改进点：
 * - 优化"全部书籍"卡片样式
 * - 增强标签列表交互效果
 * - 提升按钮反馈
 * - 优化空状态显示
 */
export const BookshelfSidebar = () => {
  const {
    collections,
    tags,
    books,
    currentCollection,
    selectCollection,
    filterConfig,
    updateFilterConfig,
    createCollection,
    createTag,
  } = useStore();

  // 计算每个文件夹的书籍数量
  const collectionBookCounts = collections.reduce((counts, collection) => {
    counts[collection.id!] = books.filter(book => book.collectionId === collection.id).length;
    return counts;
  }, {} as Record<number, number>);

  // 计算每个标签的书籍数量
  const tagBookCounts = tags.reduce((counts, tag) => {
    counts[tag.name] = books.filter(book => book.tags && book.tags.includes(tag.name)).length;
    return counts;
  }, {} as Record<string, number>);

  const handleCreateCollection = () => {
    const name = prompt('请输入文件夹名称：');
    if (name) {
      const colors = ['#E8F4F8', '#FFF4E6', '#F0F8E8', '#F8F0E8', '#F8E8F4'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      createCollection(name, color);
    }
  };

  const handleCreateTag = () => {
    const name = prompt('请输入标签名称：');
    if (name) {
      const colors = ['#E8F4F8', '#FFF4E6', '#F0F8E8', '#F8F0E8', '#F8E8F4'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      createTag(name, color);
    }
  };

  const handleSelectCollection = (collection: typeof collections[0] | null) => {
    selectCollection(collection);
    updateFilterConfig({ filterByCollection: collection?.id || null });
  };

  const handleFilterByTag = (tagName: string) => {
    const currentTags = filterConfig.filterByTags || [];
    if (currentTags.includes(tagName)) {
      updateFilterConfig({ filterByTags: currentTags.filter(t => t !== tagName) });
    } else {
      updateFilterConfig({ filterByTags: [...currentTags, tagName] });
    }
  };

  return (
    <div className="w-64 bg-white border-r border-stone-200 flex flex-col overflow-hidden">
      {/* 文件夹区域 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
            文件夹
          </h3>
          <button
            onClick={handleCreateCollection}
            className="p-1.5 hover:bg-stone-100 rounded-lg transition-all duration-200
                     hover:shadow-sm active:scale-95"
            title="新建文件夹"
          >
            <FolderPlus size={16} className="text-stone-600" />
          </button>
        </div>

        <div className="space-y-2">
          {/* 全部书籍（优化） */}
          <div
            onClick={() => handleSelectCollection(null)}
            className={`
              p-4 rounded-xl cursor-pointer transition-all duration-200
              ${!currentCollection
                ? 'bg-stone-100/80 text-stone-800 shadow-sm border border-stone-200/60'
                : 'hover:bg-stone-50/80 text-stone-600 hover:shadow-sm border-2 border-transparent hover:border-stone-200/60'
              }
            `}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                !currentCollection ? 'bg-white shadow-sm' : 'bg-white/60'
              }`}>
                <FolderPlus size={18} />
              </div>
              <span className="font-semibold text-sm">全部书籍</span>
            </div>
            <p className="text-xs text-stone-500/90 font-medium ml-9">
              {books.length} 本书籍
            </p>
          </div>

          {/* 文件夹列表 */}
          {collections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              bookCount={collectionBookCounts[collection.id!] || 0}
              isActive={currentCollection?.id === collection.id}
              onClick={() => handleSelectCollection(collection)}
            />
          ))}
        </div>
      </div>

      {/* 标签区域 */}
      <div className="border-t border-stone-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-700 uppercase tracking-wide">
            标签
          </h3>
          <button
            onClick={handleCreateTag}
            className="p-1.5 hover:bg-stone-100 rounded-lg transition-all duration-200
                     hover:shadow-sm active:scale-95"
            title="新建标签"
          >
            <Plus size={16} className="text-stone-600" />
          </button>
        </div>

        <div className="space-y-1.5">
          {tags.length === 0 ? (
            <div className="text-center py-6 px-3">
              <Hash size={24} className="mx-auto text-stone-300 mb-2" />
              <p className="text-sm text-stone-500 font-medium">暂无标签</p>
              <p className="text-xs text-stone-400 mt-1">点击 + 创建</p>
            </div>
          ) : (
            tags.map(tag => {
              const isSelected = filterConfig.filterByTags?.includes(tag.name);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleFilterByTag(tag.name)}
                  className={`
                    w-full px-3.5 py-2.5 rounded-xl text-left
                    transition-all duration-200
                    flex items-center gap-2.5 group
                    ${isSelected
                      ? 'bg-stone-100/80 text-stone-800 shadow-sm border border-stone-200/60'
                      : 'hover:bg-stone-50/80 text-stone-600 hover:shadow-sm'
                    }
                  `}
                >
                  <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                    isSelected ? 'bg-white shadow-sm' : 'bg-white/60 group-hover:bg-white/80'
                  }`}>
                    <Hash size={12} className="text-stone-500" />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium">
                    {tag.name}
                  </span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full font-semibold
                    ${isSelected
                      ? 'bg-stone-200/80 text-stone-700'
                      : 'bg-stone-200/50 text-stone-500'
                    }
                  `}>
                    {tagBookCounts[tag.name] || 0}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
