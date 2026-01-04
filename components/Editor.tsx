import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useStore } from '../store';
import { MoreHorizontal, Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Code, Quote } from 'lucide-react';

export const Editor: React.FC = () => {
  const { currentChapter, updateChapterContent, setToc, isSaving, updateChapterTitle } = useStore();
  const isTypingRef = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
            levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands",
        emptyEditorClass: 'is-editor-empty',
      }),
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
    },
    onBlur: () => {
        isTypingRef.current = false;
    }
  });

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
            <span className="truncate max-w-[200px]">{currentChapter.title || "Untitled"}</span>
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