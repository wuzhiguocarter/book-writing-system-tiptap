"use client";

import { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { SidebarLeft } from '@/components/sidebar/SidebarLeft';
import { SidebarRight } from '@/components/sidebar/SidebarRight';
import { Editor } from '@/components/editor/Editor';

/**
 * 编辑器页面
 *
 * 功能：
 * - 根据 bookId 加载书籍数据
 * - 保留现有的三栏编辑器布局
 * - 添加返回书架的导航
 */
function EditorPageContent() {
  const params = useParams();
  const router = useRouter();
  const bookId = parseInt(params.bookId as string);
  const { books, loadData, selectBook, currentBook, isLoading } = useStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (bookId && currentBook?.id !== bookId) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        selectBook(book);
      } else {
        // 书籍不存在，返回书架
        router.push('/');
      }
    }
  }, [bookId, currentBook, books, selectBook, router]);

  if (isLoading || !currentBook) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-[#37352F]">
      {/* 顶部导航栏（新增） */}
      <div className="absolute top-0 left-0 right-0 h-11 bg-white border-b border-notion-border flex items-center px-4 z-20">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm text-notion-text-light hover:text-notion-text transition-colors"
        >
          <span>← 返回书架</span>
        </button>
        <div className="flex-1"></div>
        <span className="text-sm font-medium text-notion-text">{currentBook.title}</span>
      </div>

      {/* 左侧栏：章节管理 */}
      <div className="mt-11">
        <SidebarLeft />
      </div>

      {/* 主内容区：编辑器 */}
      <main className="flex-1 relative min-w-[400px] flex flex-col mt-11">
        <Editor />
      </main>

      {/* 右侧栏：目录 */}
      <div className="mt-11">
        <SidebarRight />
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    }>
      <EditorPageContent />
    </Suspense>
  );
}
