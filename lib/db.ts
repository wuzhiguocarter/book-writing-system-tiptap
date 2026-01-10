import Dexie, { Table } from 'dexie';
import { Book, EnhancedBook, Chapter, Collection, Tag, SearchHistory } from './types';

export class BookCraftDB extends Dexie {
  books!: Table<EnhancedBook, number>;
  chapters!: Table<Chapter, number>;
  collections!: Table<Collection, number>;
  tags!: Table<Tag, number>;
  searchHistory!: Table<SearchHistory, number>;

  constructor() {
    super('BookCraftDB');

    // Version 1: 原始 Schema（保持兼容）
    (this as any).version(1).stores({
      books: '++id, title, updatedAt',
      chapters: '++id, bookId, title, order, updatedAt'
    });

    // Version 2: 添加书架功能
    (this as any).version(2).stores({
      // 扩展 books 表索引
      books: '++id, title, updatedAt, collectionId, [collectionId+updatedAt], tags, lastReadAt, isPinned',
      chapters: '++id, bookId, title, order, updatedAt',
      // 新增表
      collections: '++id, name, order, updatedAt',
      tags: '++id, name, usageCount',
      searchHistory: '++id, query, timestamp',
    }).upgrade((tx: any) => {
      // 数据迁移：为现有书籍添加默认字段
      return tx.table('books').toCollection().modify((book: any) => {
        // 生成随机封面颜色
        const colors = ['#E8F4F8', '#FFF4E6', '#F0F8E8', '#F8F0E8', '#F8E8F4'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        // 添加书架扩展字段
        book.collectionId = null;
        book.tags = [];
        book.coverColor = randomColor;
        book.wordCount = 0;
        book.lastReadAt = null;
        book.isPinned = false;
      });
    });
  }
}

// 延迟初始化，确保仅在客户端创建
let dbInstance: BookCraftDB | null = null;

export const getDb = () => {
  if (typeof window === 'undefined') {
    throw new Error('Dexie can only be used in the browser');
  }
  if (!dbInstance) {
    dbInstance = new BookCraftDB();
  }
  return dbInstance;
};

// 向后兼容的导出
export const db = typeof window !== 'undefined' ? new BookCraftDB() : (null as unknown as BookCraftDB);
