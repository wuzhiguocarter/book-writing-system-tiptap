export interface Book {
  id?: number;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

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
  books: Book[];
  chapters: Chapter[];
  currentBook: Book | null;
  currentChapter: Chapter | null;
  view: 'home' | 'editor';
  isLoading: boolean;
  isSaving: boolean;
  toc: TocItem[];
  collapsedHeadings: Set<string>; // Track collapsed headings by their ID (chapter-id-heading-index)
  
  // Actions
  loadData: () => Promise<void>;
  createBook: (title: string, description: string) => Promise<void>;
  deleteBook: (id: number) => Promise<void>;
  selectBook: (book: Book) => void;
  openBook: (book: Book) => Promise<void>;
  goHome: () => void;
  createChapter: (bookId: number, title: string) => Promise<void>;
  deleteChapter: (id: number) => Promise<void>;
  selectChapter: (chapter: Chapter) => void;
  updateChapterContent: (id: number, content: string) => Promise<void>;
  updateChapterTitle: (id: number, title: string) => Promise<void>;
  reorderChapter: (chapterId: number, targetId: number, position: 'before' | 'after' | 'inside') => Promise<void>;
  setToc: (toc: TocItem[]) => void;
  toggleHeadingCollapse: (headingId: string) => void;
  isHeadingCollapsed: (headingId: string) => boolean;
}
