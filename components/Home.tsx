import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useStore } from '../store';
import { Book } from '../types';

function formatUpdatedAt(ts: number) {
  try {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).format(ts);
  } catch {
    return new Date(ts).toLocaleDateString();
  }
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function coverTheme(book: Book) {
  const seeds = [
    { from: '#1F2937', to: '#111827', accent: '#FDE68A' }, // slate + amber
    { from: '#0F766E', to: '#115E59', accent: '#99F6E4' }, // teal
    { from: '#7C2D12', to: '#9A3412', accent: '#FDBA74' }, // orange
    { from: '#1D4ED8', to: '#1E40AF', accent: '#BFDBFE' }, // blue
    { from: '#6D28D9', to: '#5B21B6', accent: '#DDD6FE' }, // violet
    { from: '#9F1239', to: '#881337', accent: '#FECDD3' }, // rose
  ];
  const key = book.id ? String(book.id) : book.title;
  const idx = hashString(key) % seeds.length;
  return seeds[idx];
}

const BookCoverCard: React.FC<{ book: Book; onOpen: (b: Book) => void }> = ({ book, onOpen }) => {
  const theme = coverTheme(book);

  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      className="group relative w-[148px] select-none"
      title={book.title}
    >
      <div className="relative h-[212px] w-[148px]">
        {/* Book */}
        <div
          className="absolute inset-0 rounded-[12px] shadow-[0_18px_40px_-22px_rgba(0,0,0,0.55)] transition-transform duration-200 ease-out group-hover:-translate-y-1"
          style={{
            background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
            transform: 'perspective(700px) rotateY(-10deg)',
          }}
        >
          {/* Spine */}
          <div
            className="absolute left-0 top-0 h-full w-[18px] rounded-l-[12px] opacity-70"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(0,0,0,0.22))' }}
          />

          {/* Gloss */}
          <div
            className="absolute inset-0 rounded-[12px]"
            style={{
              background:
                'linear-gradient(120deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0) 55%)',
            }}
          />

          {/* Title */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-white/85">
              <BookOpen size={16} />
              <span className="text-[11px] tracking-wide uppercase font-semibold opacity-90">Book</span>
            </div>

            <div>
              <div
                className="text-white font-semibold leading-snug overflow-hidden"
                style={{
                  textShadow: '0 1px 0 rgba(0,0,0,0.25)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {book.title || 'Untitled'}
              </div>
              <div
                className="mt-2 text-[11px] text-white/75 overflow-hidden"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {book.description || 'No description'}
              </div>
              <div className="mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white/90" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                Updated {formatUpdatedAt(book.updatedAt)}
              </div>
              <div className="mt-3 h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accent, opacity: 0.9 }} />
            </div>
          </div>
        </div>

        {/* Drop shadow on shelf */}
        <div className="absolute -bottom-2 left-3 right-3 h-3 rounded-full blur-md opacity-40 bg-black/30 group-hover:opacity-50 transition-opacity" />
      </div>

      {/* Label under cover */}
      <div className="mt-2 px-1">
        <div className="text-[12px] font-medium text-notion-text truncate">{book.title || 'Untitled'}</div>
      </div>
    </button>
  );
};

export const Home: React.FC = () => {
  const { books, openBook, createBook } = useStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(b => (b.title || '').toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q));
  }, [books, query]);

  const handleCreate = async () => {
    const title = window.prompt('书名');
    if (!title || !title.trim()) return;
    const description = window.prompt('简介（可选）') ?? '';
    await createBook(title.trim(), description.trim());
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F6F3EE] text-notion-text">
      {/* Top bar */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-black/5 bg-white/60 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">B</div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">BookCraft</div>
            <div className="text-[12px] text-notion-text-light">你的书架</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-text-lighter" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索书名或简介"
              className="w-[260px] rounded-full bg-white/80 border border-black/10 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 active:bg-slate-950"
          >
            <Plus size={16} />
            新建书籍
          </button>
        </div>
      </div>

      {/* Shelves */}
      <div className="h-[calc(100vh-56px)] overflow-y-auto">
        <div
          className="min-h-full px-6 py-8"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 252px, rgba(0,0,0,0.06) 252px, rgba(0,0,0,0.06) 256px, rgba(156,98,53,0.45) 256px, rgba(115,72,39,0.55) 270px)',
          }}
        >
          {filtered.length === 0 ? (
            <div className="h-[60vh] flex items-center justify-center">
              <div className="max-w-md text-center">
                <div className="text-lg font-semibold">书架还是空的</div>
                <div className="mt-1 text-sm text-notion-text-light">创建一本书，像 Kindle 一样把项目摆上书架。</div>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-2 text-sm font-medium hover:bg-slate-800"
                >
                  <Plus size={16} />
                  新建书籍
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-x-8 gap-y-14 items-end">
              {filtered.map(book => (
                <div key={book.id ?? book.title} className="flex justify-center">
                  <BookCoverCard book={book} onOpen={openBook} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
