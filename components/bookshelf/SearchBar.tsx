"use client";

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Search, X, Clock } from 'lucide-react';

/**
 * 智能搜索组件
 *
 * 功能：
 * - 模糊匹配书名、文件夹名、标签名
 * - 搜索建议
 * - 搜索历史
 * - 防抖输入
 */
export const SearchBar: React.FC = () => {
  const {
    searchQuery,
    searchHistory,
    searchSuggestions,
    setSearchQuery,
    clearSearchHistory,
  } = useStore();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 防抖处理搜索输入
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue, setSearchQuery]);

  // 同步外部搜索状态
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const hasContent = inputValue.trim() || showSuggestions;

  return (
    <div className="relative">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          size={18}
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          placeholder="搜索书籍、文件夹、标签..."
          className="w-full pl-10 pr-10 py-2.5 bg-stone-100 border border-transparent rounded-lg focus:bg-white focus:border-stone-300 focus:ring-2 focus:ring-stone-200 outline-none transition-all text-sm"
        />
        {hasContent && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 下拉面板：搜索建议 + 历史 */}
      {showSuggestions && hasContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-20">
          {/* 搜索建议 */}
          {searchSuggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase">
                搜索建议
              </div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* 搜索历史 */}
          {searchHistory.length > 0 && searchSuggestions.length === 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase flex items-center justify-between">
                <span>搜索历史</span>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  清除
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item.query)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Clock size={14} className="text-stone-400" />
                  <span>{item.query}</span>
                </button>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {searchSuggestions.length === 0 && searchHistory.length === 0 && (
            <div className="p-6 text-center text-sm text-stone-500">
              暂无搜索建议
            </div>
          )}
        </div>
      )}

      {/* 点击外部关闭下拉面板 */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};
