import { create } from 'zustand';
import { db, getDb } from './db';
import { AppState, Book, Chapter, EnhancedBook, Collection, Tag, SearchHistory, FilterConfig } from './types';

// 默认筛选配置
const defaultFilterConfig: FilterConfig = {
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  filterByTags: [],
  filterByCollection: null,
  timeRange: 'all',
};

export const useStore = create<AppState>((set, get) => ({
  // 原有状态
  books: [],
  chapters: [],
  currentBook: null,
  currentChapter: null,
  isLoading: true,
  isSaving: false,
  toc: [],

  // 书架新增状态
  collections: [],
  tags: [],
  currentCollection: null,
  searchQuery: '',
  searchHistory: [],
  searchSuggestions: [],
  filterConfig: defaultFilterConfig,
  viewMode: 'grid',

  loadData: async () => {
    // 客户端检查
    if (typeof window === 'undefined') return;

    set({ isLoading: true });
    try {
      const database = getDb();

      // 并行加载所有数据
      const [books, collections, tags] = await Promise.all([
        database.books.toArray(),
        database.collections.toArray(),
        database.tags.toArray(),
      ]);

      // Sort books by updated recently
      books.sort((a, b) => b.updatedAt - a.updatedAt);

      set({
        books,
        collections,
        tags,
        isLoading: false
      });

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

    // 生成随机封面颜色
    const colors = ['#E8F4F8', '#FFF4E6', '#F0F8E8', '#F8F0E8', '#F8E8F4'];
    const coverColor = colors[Math.floor(Math.random() * colors.length)];

    const newBook: EnhancedBook = {
      title,
      description,
      collectionId: null,
      tags: [],
      coverColor,
      wordCount: 0,
      lastReadAt: null,
      isPinned: false,
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

  // ========== 书架功能：文件夹操作 ==========

  /**
   * 加载所有文件夹
   */
  loadCollections: async () => {
    if (typeof window === 'undefined') return;

    try {
      const database = getDb();
      const collections = await database.collections.toArray();
      set({ collections });
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  },

  /**
   * 创建新文件夹
   */
  createCollection: async (name, color) => {
    if (typeof window === 'undefined') return 0;

    const database = getDb();
    const collections = await database.collections.toArray();
    const maxOrder = collections.length > 0 ? Math.max(...collections.map(c => c.order || 0)) : 0;

    const newCollection: Collection = {
      name,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: maxOrder + 1,
    };

    const id = await database.collections.add(newCollection);
    const collectionWithId = { ...newCollection, id };

    set(state => ({
      collections: [...state.collections, collectionWithId],
    }));

    return id as number;
  },

  /**
   * 更新文件夹
   */
  updateCollection: async (id, updates) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    await database.collections.update(id, { ...updates, updatedAt: Date.now() });

    set(state => ({
      collections: state.collections.map(collection =>
        collection.id === id ? { ...collection, ...updates, updatedAt: Date.now() } : collection
      ),
    }));
  },

  /**
   * 删除文件夹
   * 删除文件夹后，该文件夹下的书籍会移到根目录
   */
  deleteCollection: async (id) => {
    if (typeof window === 'undefined') return;

    const database = getDb();

    // 将该文件夹下的书籍移到根目录
    await database.books.where({ collectionId: id }).modify({ collectionId: null });
    await database.collections.delete(id);

    set(state => ({
      collections: state.collections.filter(collection => collection.id !== id),
      books: state.books.map(book =>
        book.collectionId === id ? { ...book, collectionId: null } : book
      ),
    }));
  },

  /**
   * 选择文件夹（用于筛选）
   */
  selectCollection: (collection) => {
    set({ currentCollection: collection });
  },

  // ========== 书架功能：标签操作 ==========

  /**
   * 加载所有标签
   */
  loadTags: async () => {
    if (typeof window === 'undefined') return;

    try {
      const database = getDb();
      const tags = await database.tags.toArray();
      set({ tags });
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  },

  /**
   * 创建新标签
   */
  createTag: async (name, color) => {
    if (typeof window === 'undefined') return 0;

    const database = getDb();
    const newTag: Tag = {
      name,
      color,
      usageCount: 0,
      createdAt: Date.now(),
    };

    const id = await database.tags.add(newTag);
    const tagWithId = { ...newTag, id };

    set(state => ({
      tags: [...state.tags, tagWithId],
    }));

    return id as number;
  },

  /**
   * 更新标签
   */
  updateTag: async (id, updates) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    await database.tags.update(id, updates);

    set(state => ({
      tags: state.tags.map(tag =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    }));
  },

  /**
   * 删除标签
   * 删除标签后，所有书籍中的该标签也会被移除
   */
  deleteTag: async (id) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    const tag = await database.tags.get(id);
    if (!tag) return;

    // 从所有书籍中移除该标签
    const books = await database.books.toArray();
    for (const book of books) {
      if (book.tags && book.tags.includes(tag.name)) {
        const updatedTags = book.tags.filter(t => t !== tag.name);
        await database.books.update(book.id!, { tags: updatedTags });
      }
    }

    await database.tags.delete(id);

    set(state => ({
      tags: state.tags.filter(tag => tag.id !== id),
      books: state.books.map(book => ({
        ...book,
        tags: book.tags ? book.tags.filter(t => t !== tag.name) : [],
      })),
    }));
  },

  /**
   * 给书籍添加标签
   */
  addTagToBook: async (bookId, tagName) => {
    const book = get().books.find(b => b.id === bookId) as EnhancedBook;
    if (!book || !book.tags || book.tags.includes(tagName)) return;

    const updatedTags = [...book.tags, tagName];
    await get().updateBook(bookId, { tags: updatedTags });

    // 更新标签使用次数
    const tag = get().tags.find(t => t.name === tagName);
    if (tag) {
      await get().updateTag(tag.id!, { usageCount: tag.usageCount + 1 });
    } else {
      // 创建新标签
      const colors = ['#E8F4F8', '#FFF4E6', '#F0F8E8', '#F8F0E8', '#F8E8F4'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      await get().createTag(tagName, color);
    }
  },

  /**
   * 从书籍移除标签
   */
  removeTagFromBook: async (bookId, tagName) => {
    const book = get().books.find(b => b.id === bookId) as EnhancedBook;
    if (!book || !book.tags) return;

    const updatedTags = book.tags.filter(t => t !== tagName);
    await get().updateBook(bookId, { tags: updatedTags });

    // 更新标签使用次数
    const tag = get().tags.find(t => t.name === tagName);
    if (tag) {
      await get().updateTag(tag.id!, { usageCount: Math.max(0, tag.usageCount - 1) });
    }
  },

  // ========== 书架功能：搜索和筛选 ==========

  /**
   * 设置搜索查询
   */
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().generateSearchSuggestions(query);

    if (query.trim()) {
      get().addToSearchHistory(query);
    }
  },

  /**
   * 添加搜索历史
   */
  addToSearchHistory: async (query) => {
    if (typeof window === 'undefined') return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const database = getDb();

    // 检查是否已存在
    const existing = await database.searchHistory
      .where('query')
      .equals(trimmedQuery)
      .first();

    if (existing) {
      await database.searchHistory.update(existing.id!, { timestamp: Date.now() });
    } else {
      await database.searchHistory.add({
        query: trimmedQuery,
        timestamp: Date.now(),
      });
    }

    // 重新加载历史记录（保留最近 20 条）
    const history = await database.searchHistory
      .orderBy('timestamp')
      .reverse()
      .limit(20)
      .toArray();

    set({ searchHistory: history });
  },

  /**
   * 清除搜索历史
   */
  clearSearchHistory: async () => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    await database.searchHistory.clear();
    set({ searchHistory: [] });
  },

  /**
   * 生成搜索建议
   */
  generateSearchSuggestions: async (query) => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      set({ searchSuggestions: [] });
      return;
    }

    const books = get().books as EnhancedBook[];
    const collections = get().collections;
    const tags = get().tags;

    const suggestions = new Set<string>();

    // 从书名中匹配
    books.forEach(book => {
      if (book.title.toLowerCase().includes(trimmedQuery)) {
        suggestions.add(book.title);
      }
    });

    // 从文件夹名称中匹配
    collections.forEach(collection => {
      if (collection.name.toLowerCase().includes(trimmedQuery)) {
        suggestions.add(collection.name);
      }
    });

    // 从标签名称中匹配
    tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(trimmedQuery)) {
        suggestions.add(tag.name);
      }
    });

    set({ searchSuggestions: Array.from(suggestions).slice(0, 5) });
  },

  /**
   * 更新筛选配置
   */
  updateFilterConfig: (config) => {
    set(state => ({
      filterConfig: { ...state.filterConfig, ...config },
    }));
  },

  /**
   * 设置视图模式
   */
  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  // ========== 书架功能：书籍扩展操作 ==========

  /**
   * 更新书籍信息
   */
  updateBook: async (id, updates) => {
    if (typeof window === 'undefined') return;

    const database = getDb();
    await database.books.update(id, { ...updates, updatedAt: Date.now() });

    set(state => ({
      books: state.books.map(book =>
        book.id === id ? { ...book, ...updates, updatedAt: Date.now() } : book
      ),
    }));
  },

  /**
   * 置顶/取消置顶书籍
   */
  pinBook: async (id, isPinned) => {
    await get().updateBook(id, { isPinned });
  },

  /**
   * 更新书籍字数统计
   */
  updateBookWordCount: async (id, wordCount) => {
    await get().updateBook(id, { wordCount });
  },

  /**
   * 更新书籍最后阅读时间
   */
  updateLastReadAt: async (id) => {
    await get().updateBook(id, { lastReadAt: Date.now() });
  },

  /**
   * 将书籍移到文件夹
   */
  moveBookToCollection: async (bookId, collectionId) => {
    await get().updateBook(bookId, { collectionId });
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
