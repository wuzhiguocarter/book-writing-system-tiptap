"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Folder, FolderOpen, MoreHorizontal, Trash2, Edit3 } from 'lucide-react';
import { Collection } from '@/lib/types';

interface CollectionCardProps {
  collection: Collection;
  bookCount?: number;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * 文件夹卡片组件
 *
 * 功能：
 * - 显示文件夹名称、图标、颜色
 * - 显示包含的书籍数量
 * - 支持编辑、删除操作
 * - 支持选中状态
 */
export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  bookCount = 0,
  isActive = false,
  onClick,
}) => {
  const { deleteCollection, updateCollection } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除文件夹"${collection.name}"吗？该文件夹下的书籍将移到根目录。`)) {
      await deleteCollection(collection.id!);
    }
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt('编辑文件夹名称：', collection.name);
    if (newName && newName !== collection.name) {
      updateCollection(collection.id!, { name: newName });
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative p-4 rounded-xl border-2 transition-all cursor-pointer
        ${isActive
          ? 'border-stone-800 bg-stone-100'
          : 'border-transparent hover:border-stone-300 hover:bg-stone-50'
        }
      `}
      style={{ backgroundColor: collection.color }}
    >
      {/* 文件夹图标 */}
      <div className="flex items-center gap-3 mb-2">
        {isActive ? (
          <FolderOpen size={24} className="text-stone-700" />
        ) : (
          <Folder size={24} className="text-stone-600" />
        )}
        <h3 className="font-semibold text-stone-800 truncate flex-1">
          {collection.name}
        </h3>
      </div>

      {/* 书籍数量 */}
      <p className="text-sm text-stone-600 ml-9">
        {bookCount} 本书籍
      </p>

      {/* 悬停操作 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
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
          <div className="absolute right-2 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-20">
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
  );
};
