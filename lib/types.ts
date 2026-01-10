export interface Book {
  id?: number;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 增强的书籍模型（用于书架功能）
 * 继承 Book 基础字段，添加书架所需扩展字段
 */
export interface EnhancedBook extends Book {
  id?: number;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;

  // 书架扩展字段
  collectionId?: number | null;      // 所属文件夹 ID
  tags: string[];                     // 标签数组
  coverColor: string;                 // 封面颜色（简约文字卡）
  wordCount: number;                  // 字数统计
  lastReadAt: number | null;          // 最后阅读时间
  isPinned: boolean;                  // 是否置顶
}

/**
 * 文件夹/分组模型
 */
export interface Collection {
  id?: number;
  name: string;
  color: string;                      // 文件夹颜色标识
  icon?: string;                      // 图标名称（可选）
  createdAt: number;
  updatedAt: number;
  order: number;                      // 排序顺序
}

/**
 * 标签模型
 */
export interface Tag {
  id?: number;
  name: string;
  color: string;                      // 标签颜色
  usageCount: number;                 // 使用次数
  createdAt: number;
}

/**
 * 搜索历史记录
 */
export interface SearchHistory {
  id?: number;
  query: string;
  timestamp: number;
}

/**
 * 筛选和排序配置
 */
export interface FilterConfig {
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'wordCount' | 'lastReadAt';
  sortOrder: 'asc' | 'desc';
  filterByTags: string[];             // 按标签筛选
  filterByCollection: number | null;  // 按文件夹筛选
  timeRange?: 'all' | 'today' | 'week' | 'month' | 'year';
}

/**
 * 书架视图模式
 */
export type ViewMode = 'grid' | 'list';

export interface Chapter {
  id?: number;
  bookId: number;
  title: string;
  content: string; // HTML content from Tiptap
  order: number;
  parentId?: number | null;
  updatedAt: number;
}

export interface TocItem {
  id: string;
  level: number;
  text: string;
  elementId?: string;
}

export interface AppState {
  // 原有状态（保持兼容）
  books: EnhancedBook[];
  chapters: Chapter[];
  currentBook: EnhancedBook | null;
  currentChapter: Chapter | null;
  isLoading: boolean;
  isSaving: boolean;
  toc: TocItem[];

  // 书架新增状态
  collections: Collection[];
  tags: Tag[];
  currentCollection: Collection | null;
  searchQuery: string;
  searchHistory: SearchHistory[];
  searchSuggestions: string[];
  filterConfig: FilterConfig;
  viewMode: ViewMode;

  // 原有操作方法（保持兼容）
  loadData: () => Promise<void>;
  createBook: (title: string, description: string) => Promise<void>;
  deleteBook: (id: number) => Promise<void>;
  selectBook: (book: EnhancedBook) => void;
  createChapter: (bookId: number, title: string) => Promise<void>;
  deleteChapter: (id: number) => Promise<void>;
  selectChapter: (chapter: Chapter) => void;
  updateChapterContent: (id: number, content: string) => Promise<void>;
  updateChapterTitle: (id: number, title: string) => Promise<void>;
  reorderChapter: (chapterId: number, targetId: number, position: 'before' | 'after' | 'inside') => Promise<void>;
  setToc: (toc: TocItem[]) => void;
  importMarkdown: (bookId: number, content: string) => Promise<void>;
  importMultipleFiles: (files: File[]) => Promise<void>;

  // 书架新增操作方法
  // 文件夹操作
  loadCollections: () => Promise<void>;
  createCollection: (name: string, color: string) => Promise<number>;
  updateCollection: (id: number, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: number) => Promise<void>;
  selectCollection: (collection: Collection | null) => void;

  // 标签操作
  loadTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<number>;
  updateTag: (id: number, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  addTagToBook: (bookId: number, tagName: string) => Promise<void>;
  removeTagFromBook: (bookId: number, tagName: string) => Promise<void>;

  // 搜索和筛选
  setSearchQuery: (query: string) => void;
  addToSearchHistory: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  generateSearchSuggestions: (query: string) => Promise<void>;
  updateFilterConfig: (config: Partial<FilterConfig>) => void;
  setViewMode: (mode: ViewMode) => void;

  // 书籍扩展操作
  updateBook: (id: number, updates: Partial<EnhancedBook>) => Promise<void>;
  pinBook: (id: number, isPinned: boolean) => Promise<void>;
  updateBookWordCount: (id: number, wordCount: number) => Promise<void>;
  updateLastReadAt: (id: number) => Promise<void>;
  moveBookToCollection: (bookId: number, collectionId: number | null) => Promise<void>;
}
