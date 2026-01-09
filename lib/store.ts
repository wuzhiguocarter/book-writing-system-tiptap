import { create } from 'zustand';
import { db, getDb } from './db';
import { AppState, Book, Chapter } from './types';

export const useStore = create<AppState>((set, get) => ({
  books: [],
  chapters: [],
  currentBook: null,
  currentChapter: null,
  isLoading: true,
  isSaving: false,
  toc: [],

  loadData: async () => {
    // 客户端检查
    if (typeof window === 'undefined') return;

    set({ isLoading: true });
    try {
      const database = getDb();
      const books = await database.books.toArray();
      // Sort books by updated recently
      books.sort((a, b) => b.updatedAt - a.updatedAt);

      set({ books, isLoading: false });

      // If we have books but none selected, select the first one
      if (books.length > 0 && !get().currentBook) {
        get().selectBook(books[0]);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      set({ isLoading: false });
    }
  },

  createBook: async (title, description) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    const newBook: Book = {
      title,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const id = await database.books.add(newBook);
    const bookWithId = { ...newBook, id };

    set(state => ({
      books: [bookWithId, ...state.books],
      currentBook: bookWithId
    }));

    // Create an initial chapter
    await get().createChapter(id as number, "Chapter 1");
  },

  deleteBook: async (id) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    // Cast db to any to avoid TypeScript error where transaction method is not recognized
    await (database as any).transaction('rw', database.books, database.chapters, async () => {
      await database.chapters.where({ bookId: id }).delete();
      await database.books.delete(id);
    });

    set(state => {
      const newBooks = state.books.filter(b => b.id !== id);
      return {
        books: newBooks,
        currentBook: newBooks.length > 0 ? newBooks[0] : null,
        currentChapter: null,
        chapters: []
      };
    });

    const currentBook = get().currentBook;
    if (currentBook) {
      get().selectBook(currentBook);
    }
  },

  selectBook: async (book) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    set({ currentBook: book, isLoading: true });
    const chapters = await database.chapters.where({ bookId: book.id! }).sortBy('order');
    set({ chapters, currentChapter: chapters.length > 0 ? chapters[0] : null, isLoading: false });
  },

  createChapter: async (bookId, title) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    const chapters = await database.chapters.where({ bookId }).toArray();
    const nextOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) + 1 : 1;

    const newChapter: Chapter = {
      bookId,
      title,
      content: '<h1>' + title + '</h1><p>Start writing here...</p>',
      order: nextOrder,
      updatedAt: Date.now(),
      parentId: null
    };

    const id = await database.chapters.add(newChapter);
    const chapterWithId = { ...newChapter, id };

    set(state => ({
      chapters: [...state.chapters, chapterWithId],
      currentChapter: chapterWithId
    }));
  },

  deleteChapter: async (id) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    await database.chapters.delete(id);

    set(state => {
      const newChapters = state.chapters.filter(c => c.id !== id);
      // If we deleted the current chapter, select another one if available
      let newCurrentChapter = state.currentChapter;
      if (state.currentChapter?.id === id) {
        newCurrentChapter = newChapters.length > 0 ? newChapters[0] : null;
      }
      return {
        chapters: newChapters,
        currentChapter: newCurrentChapter
      };
    });
  },

  selectChapter: (chapter) => {
    set({ currentChapter: chapter });
  },

  updateChapterContent: async (id, content) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    set({ isSaving: true });
    // Optimistic update
    set(state => ({
      chapters: state.chapters.map(c => c.id === id ? { ...c, content, updatedAt: Date.now() } : c)
    }));

    await database.chapters.update(id, { content, updatedAt: Date.now() });

    const currentBookId = get().currentBook?.id;
    if (currentBookId) {
      await database.books.update(currentBookId, { updatedAt: Date.now() });
    }

    set({ isSaving: false });
  },

  updateChapterTitle: async (id, title) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    await database.chapters.update(id, { title, updatedAt: Date.now() });

    set(state => ({
      chapters: state.chapters.map(c => c.id === id ? { ...c, title } : c),
      currentChapter: state.currentChapter?.id === id ? { ...state.currentChapter, title } : state.currentChapter
    }));
  },

  reorderChapter: async (chapterId, targetId, position) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    const { chapters } = get();
    if (chapterId === targetId) return;

    const movedChapter = chapters.find(c => c.id === chapterId);
    const targetChapter = chapters.find(c => c.id === targetId);

    if (!movedChapter || !targetChapter) return;

    let newParentId: number | null = movedChapter.parentId ?? null;
    let siblings: Chapter[] = [];

    if (position === 'inside') {
      newParentId = targetChapter.id!;
      // Get children of target
      siblings = chapters.filter(c => c.parentId === newParentId && c.id !== chapterId);
      // Sort existing children
      siblings.sort((a, b) => a.order - b.order);
      // Append to end
      siblings.push(movedChapter);
    } else {
      newParentId = targetChapter.parentId ?? null;
      // Get siblings of target (excluding the moved one if it was already in this level)
      const currentSiblings = chapters.filter(c => c.parentId === newParentId && c.id !== chapterId);
      currentSiblings.sort((a, b) => a.order - b.order);

      const targetIndex = currentSiblings.findIndex(c => c.id === targetId);
      if (targetIndex === -1) return;

      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

      // Construct new array
      siblings = [
        ...currentSiblings.slice(0, insertIndex),
        movedChapter,
        ...currentSiblings.slice(insertIndex)
      ];
    }

    // Create update map for DB and State
    const idToOrder = new Map<number, number>();
    siblings.forEach((c, index) => {
      idToOrder.set(c.id!, index + 1);
    });

    const updates: Promise<any>[] = [];
    const updatedChapters = chapters.map(c => {
      if (idToOrder.has(c.id!)) {
        const newOrder = idToOrder.get(c.id!)!;
        const isMoved = c.id === chapterId;

        // Only update if changed
        if (c.order !== newOrder || (isMoved && c.parentId !== newParentId)) {
          const updatePayload: any = { order: newOrder };
          if (isMoved) updatePayload.parentId = newParentId;

          updates.push(database.chapters.update(c.id!, updatePayload));
          return { ...c, ...updatePayload };
        }
      }
      return c;
    });

    // Optimistic update
    set({ chapters: updatedChapters });

    // Persist
    await Promise.all(updates);
  },

  setToc: (toc) => set({ toc }),

  /**
   * 导入 Markdown 内容到指定书籍
   *
   * 功能：
   * - 解析 Markdown 文件，将一级标题作为章节标题
   * - 创建对应的章节数据
   * - 自动设置章节顺序
   *
   * @param bookId - 目标书籍 ID
   * @param content - Markdown 文件内容
   */
  importMarkdown: async (bookId, content) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    const lines = content.split('\n');

    // 获取当前书籍的最大 order 值
    const chapters = await database.chapters.where({ bookId }).toArray();
    const maxOrder = chapters.length > 0 ? Math.max(...chapters.map(c => c.order)) : 0;

    let currentTitle = 'Untitled Chapter';
    let currentContent = '';
    let chapterCount = 0;
    const chaptersToAdd: any[] = [];

    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        // 保存之前的章节
        if (chapterCount > 0) {
          chaptersToAdd.push({
            bookId,
            title: currentTitle,
            content: currentContent.trim(),
            order: maxOrder + chapterCount,
            updatedAt: Date.now(),
            parentId: null
          });
        }

        // 开始新章节
        currentTitle = line.substring(2).trim();
        currentContent = '';
        chapterCount++;
      } else {
        // 累积内容
        currentContent += line + '\n';
      }
    });

    // 添加最后一个章节
    if (chapterCount > 0) {
      chaptersToAdd.push({
        bookId,
        title: currentTitle,
        content: currentContent.trim(),
        order: maxOrder + chapterCount,
        updatedAt: Date.now(),
        parentId: null
      });
    }

    // 批量添加到数据库
    if (chaptersToAdd.length > 0) {
      // 逐个添加章节，获取每个章节的 ID
      const chaptersWithIds: any[] = [];
      for (const chapter of chaptersToAdd) {
        const id = await database.chapters.add(chapter);
        chaptersWithIds.push({
          ...chapter,
          id
        });
      }

      // 更新状态
      set(state => ({
        chapters: [...state.chapters, ...chaptersWithIds]
      }));

      // 如果这是第一个章节，选中它
      if (chaptersToAdd.length === 1 && chaptersWithIds.length > 0) {
        set({ currentChapter: chaptersWithIds[0] });
      }
    }
  },

  /**
   * 批量导入 Markdown 文件
   *
   * 功能：
   * - 为每个文件创建新书籍
   * - 导入文件内容到对应书籍
   * - 自动选中新导入的书籍
   *
   * @param files - Markdown 文件列表
   */
  importMultipleFiles: async (files) => {
    if (typeof window === 'undefined') return;

    for (const file of files) {
      try {
        // 读取文件内容
        const content = await file.text();

        // 创建新书籍（使用文件名作为标题）
        const bookTitle = file.name.replace('.md', '').replace(/[-_]/g, ' ');
        await get().createBook(bookTitle, `Imported from ${file.name}`);

        // 获取刚创建的书籍
        const currentBook = get().currentBook;
        if (currentBook) {
          // 导入内容到该书籍
          await get().importMarkdown(currentBook.id!, content);
        }
      } catch (error) {
        console.error(`Failed to import file: ${file.name}`, error);
      }
    }
  },
}));

// SSR 兼容的包装器 - 用于 Server Components
export const useClientStore = () => {
  if (typeof window === 'undefined') {
    return {
      books: [],
      chapters: [],
      currentBook: null,
      currentChapter: null,
      isLoading: true,
      isSaving: false,
      toc: [],
      loadData: async () => {},
      createBook: async () => {},
      deleteBook: async () => {},
      selectBook: () => {},
      createChapter: async () => {},
      deleteChapter: async () => {},
      selectChapter: () => {},
      updateChapterContent: async () => {},
      updateChapterTitle: async () => {},
      reorderChapter: async () => {},
      setToc: () => {},
      importMarkdown: async () => {},
      importMultipleFiles: async () => {},
    };
  }
  return useStore();
};
