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

export const db = new BookCraftDB();