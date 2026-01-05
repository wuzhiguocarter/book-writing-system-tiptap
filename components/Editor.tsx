import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { useStore } from '../store';
import { MoreHorizontal, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Code, Quote, ArrowLeft, ChevronDown } from 'lucide-react';
import { MarkdownPaste } from '../extensions/MarkdownPaste';

// 创建 lowlight 实例，支持常用语言高亮
const lowlight = createLowlight(common);

export const Editor: React.FC = () => {
  const { currentChapter, updateChapterContent, setToc, isSaving, updateChapterTitle, goHome, toggleHeadingCollapse, isHeadingCollapsed, collapsedHeadings } = useStore();
  const isTypingRef = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [headingIndices, setHeadingIndices] = useState<Map<string, number>>(new Map());

  // Define helper functions before useEditor
  const extractToc = (editorInstance: any) => {
    const headings: any[] = [];
    editorInstance.getJSON().content?.forEach((node: any) => {
      if (node.type === 'heading') {
        headings.push({
          level: node.attrs?.level,
          text: node.content?.[0]?.text || 'Untitled',
          id: `heading-${headings.length}`
        });
      }
    });
    setToc(headings);
  };

  const generateHeadingId = (index: number): string => {
    if (!currentChapter?.id) return '';
    return `heading-${currentChapter.id}-${index}`;
  };

  const updateCollapsibleUI = () => {
    const editorContainer = editorRef.current;
    if (!editorContainer) return;

    const headings = editorContainer.querySelectorAll('h1, h2, h3, h4');
    const newIndices = new Map<string, number>();
    
    headings.forEach((heading, index) => {
      const headingId = generateHeadingId(index);
      newIndices.set(headingId, index);

      // Add collapse button wrapper if not already present
      if (!heading.classList.contains('heading-with-collapse')) {
        heading.classList.add('heading-with-collapse');
        
        // Create and insert the collapse button
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'heading-collapse-button-wrapper';
        buttonWrapper.style.display = 'inline-flex';
        buttonWrapper.style.alignItems = 'center';
        buttonWrapper.style.gap = '0.25rem';
        
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'heading-collapse-btn';
        collapseBtn.type = 'button';
        collapseBtn.setAttribute('data-heading-id', headingId);
        collapseBtn.style.padding = '2px';
        collapseBtn.style.opacity = '0';
        collapseBtn.style.cursor = 'pointer';
        collapseBtn.style.border = 'none';
        collapseBtn.style.background = 'transparent';
        collapseBtn.style.display = 'inline-flex';
        collapseBtn.style.alignItems = 'center';
        collapseBtn.style.justifyContent = 'center';
        collapseBtn.style.transition = 'opacity 0.15s ease';
        
        const icon = document.createElement('svg');
        icon.className = 'collapse-icon';
        icon.setAttribute('width', '16');
        icon.setAttribute('height', '16');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '2');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
        icon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
        
        collapseBtn.appendChild(icon);
        collapseBtn.addEventListener('click', (e) => {
          e.preventDefault();
          toggleHeadingCollapse(headingId);
        });

        // Add hover effect to heading
        heading.addEventListener('mouseenter', () => {
          collapseBtn.style.opacity = '1';
        });
        heading.addEventListener('mouseleave', () => {
          collapseBtn.style.opacity = '0';
        });

        buttonWrapper.appendChild(collapseBtn);
        heading.insertBefore(buttonWrapper, heading.firstChild);
      }

      // Update button state
      const btn = heading.querySelector(`[data-heading-id="${headingId}"]`) as HTMLButtonElement;
      if (btn) {
        const isCollapsed = isHeadingCollapsed(headingId);
        const icon = btn.querySelector('.collapse-icon') as SVGElement;
        if (icon && isCollapsed) {
          icon.style.transform = 'rotate(-90deg)';
        } else if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });

    setHeadingIndices(newIndices);
    updateCollapsedContent();
  };

  const updateCollapsedContent = () => {
    const editorContainer = editorRef.current;
    if (!editorContainer) return;

    const headings = editorContainer.querySelectorAll('h1, h2, h3, h4');
    const headingElements: { element: Element; level: number; id: string }[] = [];

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName[1]);
      const headingId = generateHeadingId(index);
      headingElements.push({ element: heading, level, id: headingId });
    });

    // Hide/show content based on collapsed state
    headingElements.forEach((current, currentIndex) => {
      const isCollapsed = isHeadingCollapsed(current.id);
      
      if (isCollapsed) {
        // Find the next heading with same or higher level
        let nextHeadingIndex = currentIndex + 1;
        while (nextHeadingIndex < headingElements.length) {
          if (headingElements[nextHeadingIndex].level <= current.level) {
            break;
          }
          nextHeadingIndex++;
        }

        // Hide all content between current heading and next heading of same/higher level
        let sibling = current.element.nextElementSibling;
        while (sibling && (nextHeadingIndex >= headingElements.length || sibling !== headingElements[nextHeadingIndex].element)) {
          if (sibling instanceof HTMLElement) {
            sibling.style.display = 'none';
          }
          sibling = sibling?.nextElementSibling || null;
        }
      } else {
        // Show all content until next heading of same level
        let nextHeadingIndex = currentIndex + 1;
        while (nextHeadingIndex < headingElements.length) {
          if (headingElements[nextHeadingIndex].level <= current.level) {
            break;
          }
          nextHeadingIndex++;
        }

        let sibling = current.element.nextElementSibling;
        while (sibling && (nextHeadingIndex >= headingElements.length || sibling !== headingElements[nextHeadingIndex].element)) {
          if (sibling instanceof HTMLElement) {
            sibling.style.display = '';
          }
          sibling = sibling?.nextElementSibling || null;
        }
      }
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
            levels: [1, 2, 3, 4]
        },
        // 禁用 StarterKit 中的 CodeBlock，使用 CodeBlockLowlight 替代
        codeBlock: false,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
        emptyEditorClass: 'is-editor-empty',
      }),
      MarkdownPaste.configure(),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-full focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      isTypingRef.current = true;
      const html = editor.getHTML();
      if (currentChapter?.id) {
        updateChapterContent(currentChapter.id, html);
      }
      extractToc(editor);
      // Update collapsible UI after content changes
      setTimeout(() => {
        updateCollapsibleUI();
      }, 0);
    },
    onBlur: () => {
        isTypingRef.current = false;
    }
  });

  useEffect(() => {
    if (editor && currentChapter) {
      const isSameChapter = editor.getHTML() === currentChapter.content; 
      
      if (!isTypingRef.current || !isSameChapter) {
         if (editor.getHTML() !== currentChapter.content) {
             editor.commands.setContent(currentChapter.content);
             extractToc(editor);
         }
      }
      isTypingRef.current = false;
    }
  }, [currentChapter?.id, editor]);

  // Update collapsible UI when content or chapter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCollapsibleUI();
    }, 50);
    return () => clearTimeout(timer);
  }, [currentChapter?.content]);

  // Update collapsed content visibility when collapsedHeadings changes
  useEffect(() => {
    const timer = setTimeout(() => {
      updateCollapsedContent();
    }, 0);
    return () => clearTimeout(timer);
  }, [collapsedHeadings]);

  if (!editor || !currentChapter) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white text-notion-text-lighter">
        <div className="text-center">
             <p className="text-sm">Select a page to edit</p>
        </div>
      </div>
    );
  }

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }: any) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors ${isActive ? 'text-blue-500' : 'text-notion-text-light hover:bg-notion-hover hover:text-notion-text'}`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Top Header / Breadcrumb / Status */}
      <div className="h-11 px-4 flex items-center justify-between bg-white shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm text-notion-text overflow-hidden">
            <button
              type="button"
              onClick={goHome}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-notion-text-light hover:bg-notion-hover hover:text-notion-text"
              title="返回书架"
            >
              <ArrowLeft size={16} />
              <span className="text-xs">书架</span>
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="truncate max-w-[240px]">{currentChapter.title || "Untitled"}</span>
            {isSaving && <span className="text-[10px] text-notion-text-lighter uppercase tracking-wide">Saving...</span>}
        </div>

        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 px-2">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
                <div className="w-px h-3 bg-slate-200 mx-1"></div>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
                <div className="w-px h-3 bg-slate-200 mx-1"></div>
                 <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={Code} title="Code Block" />
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
            </div>
            <button className="p-1 text-notion-text-light hover:text-notion-text hover:bg-notion-hover rounded">
                <MoreHorizontal size={18} />
            </button>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div 
        ref={editorRef}
        className="flex-1 overflow-y-auto w-full"
        id="editor-scroll-container"
      >
        <div className="max-w-[800px] mx-auto px-12 pb-32 pt-12">
             {/* Cover / Icon Placeholders could go here */}
             
             {/* Title Input */}
             <div className="group relative mb-4">
                 <input 
                    type="text" 
                    value={currentChapter.title}
                    onChange={(e) => updateChapterTitle(currentChapter.id!, e.target.value)}
                    className="w-full text-4xl font-bold text-notion-text border-none focus:outline-none focus:ring-0 placeholder:text-gray-300 bg-transparent leading-tight py-2"
                    placeholder="Untitled"
                 />
             </div>
             
             {/* Editor */}
             <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};
