"use client";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { BookshelfHeader } from '@/components/bookshelf/BookshelfHeader';
import { BookshelfGrid } from '@/components/bookshelf/BookshelfGrid';
import { BookshelfSidebar } from '@/components/bookshelf/BookshelfSidebar';

/**
 * 书架首页
 *
 * 功能：
 * - 展示所有书籍和文件夹
 * - 提供搜索、筛选、排序功能
 * - 点击书籍跳转到编辑器
 */
function BookshelfPageContent() {
  const router = useRouter();
  const { loadData, isLoading } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookClick = (bookId: number) => {
    router.push(`/editor/${bookId}`);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin"></div>
          <p className="text-sm text-stone-500">加载书架中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-stone-50">
      {/* 左侧边栏：文件夹和标签 */}
      <BookshelfSidebar />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏：搜索、筛选、排序 */}
        <BookshelfHeader />

        {/* 书籍网格 */}
        <BookshelfGrid onBookClick={handleBookClick} />
      </div>
    </div>
  );
}

export default function BookshelfPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin"></div>
          <p className="text-sm text-stone-500">加载中...</p>
        </div>
      </div>
    }>
      <BookshelfPageContent />
    </Suspense>
  );
}
