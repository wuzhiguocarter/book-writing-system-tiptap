import Dexie, { Table } from 'dexie';
import { Book, Chapter } from './types';

export class BookCraftDB extends Dexie {
  books!: Table<Book, number>;
  chapters!: Table<Chapter, number>;

  constructor() {
    super('BookCraftDB');
    // Casting this to any to bypass TypeScript issue where inherited methods are not recognized
    (this as any).version(1).stores({
      books: '++id, title, updatedAt',
      chapters: '++id, bookId, title, order, updatedAt'
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
