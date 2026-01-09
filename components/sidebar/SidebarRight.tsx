"use client";

import React from 'react';
import { useStore } from '@/lib/store';
import { useActiveHeading } from '@/hooks/useActiveHeading';

export const SidebarRight: React.FC = () => {
  const { toc } = useStore();
  const activeId = useActiveHeading();

  const handleScrollTo = (itemId: string) => {
    const element = document.querySelector(`[data-id="${itemId}"]`);
    if (!element) return;

    // 使用 scrollIntoView 进行平滑滚动
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest'
    });
  };

  // If empty, we can hide it or show empty state. Notion doesn't show TOC unless you add a block.
  // We will keep it but make it very subtle.
  if (toc.length === 0) return null;

  return (
    <div className="hidden lg:flex flex-col w-[200px] py-8 pr-4 h-full bg-white select-none">
      <div className="text-[11px] font-semibold text-notion-text-light uppercase tracking-wide mb-2 pl-2">
        In this page
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-0.5">
          {toc.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleScrollTo(item.id)}
              className={`
                text-[13px] cursor-pointer transition-colors rounded-xs py-1
                ${activeId === item.id
                  ? 'bg-blue-50 text-blue-600 font-medium'  // 活动标题样式
                  : 'text-notion-text-light hover:bg-notion-hover hover:text-notion-text'
                }
                ${item.level === 1 ? 'pl-2' : ''}
                ${item.level === 2 ? 'pl-5' : ''}
                ${item.level === 3 ? 'pl-8' : ''}
              `}
            >
              <div className="truncate">{item.text}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
