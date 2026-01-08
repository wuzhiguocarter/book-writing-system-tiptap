"use client";

import React from 'react';
import { useStore } from '@/lib/store';

export const SidebarRight: React.FC = () => {
  const { toc } = useStore();

  const handleScrollTo = (text: string) => {
    const editorContainer = document.getElementById('editor-scroll-container');
    if (!editorContainer) return;

    // Naive scroll to text
    const headings = editorContainer.querySelectorAll('h1, h2, h3');
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].textContent === text) {
        headings[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
    }
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
              key={index}
              onClick={() => handleScrollTo(item.text)}
              className={`
                text-[13px] cursor-pointer text-notion-text-light hover:bg-notion-hover hover:text-notion-text transition-colors rounded-sm py-1
                ${item.level === 1 ? 'pl-2 font-medium' : ''}
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
