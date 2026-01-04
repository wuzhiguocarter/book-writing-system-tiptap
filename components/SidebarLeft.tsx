import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, FileText, ChevronRight, ChevronDown, Book, Settings, MoreHorizontal } from 'lucide-react';
import { Chapter } from '../types';

interface TreeNode extends Chapter {
  children: TreeNode[];
}

export const SidebarLeft: React.FC = () => {
  const { 
    books, 
    chapters, 
    currentBook, 
    currentChapter, 
    createBook, 
    deleteBook, 
    selectBook,
    createChapter,
    selectChapter,
    deleteChapter,
    reorderChapter
  } = useStore();

  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [showBookList, setShowBookList] = useState(false);
  
  // Drag and Drop State
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Toggle tree expansion
  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build Tree
  const chapterTree = useMemo(() => {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];
    
    // Sort flat list first
    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

    // Initialize map
    sortedChapters.forEach(c => {
      map.set(c.id!, { ...c, children: [] });
    });

    // Build hierarchy
    sortedChapters.forEach(c => {
      const node = map.get(c.id!)!;
      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [chapters]);

  // Expand node if we drag something over it for a while? 
  // For now, let's auto-expand parent of current chapter on load
  React.useEffect(() => {
    if (currentChapter?.parentId) {
      setExpandedNodes(prev => new Set(prev).add(currentChapter.parentId!));
    }
  }, [currentChapter?.parentId]);


  // DND Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.stopPropagation();
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Create a ghost image if needed, or rely on browser default
  };

  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedId === null || draggedId === id) return;

    // Cycle detection: cannot drag parent into its own child
    // Simple check: if we are dragging X, we cannot drop onto X's children.
    // However, handling this efficiently in a flat structure implies we just shouldn't do it.
    // For now, let's assume `reorderChapter` or simple logic handles valid moves.
    // But we need to prevent visual feedback if invalid.
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    // Split into 3 zones: top 25% (before), bottom 25% (after), middle 50% (inside)
    if (y < height * 0.25) {
      setDragPosition('before');
    } else if (y > height * 0.75) {
      setDragPosition('after');
    } else {
      setDragPosition('inside');
    }
    setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we actually left the target, not entered a child.
    // Native DND is tricky here. Usually we clear on drop or end.
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedId !== null && draggedId !== targetId && dragPosition) {
      await reorderChapter(draggedId, targetId, dragPosition);
      // Auto expand target if dropped inside
      if (dragPosition === 'inside') {
          setExpandedNodes(prev => new Set(prev).add(targetId));
      }
    }
    
    setDraggedId(null);
    setDragOverId(null);
    setDragPosition(null);
  };

  // --- Rendering ---

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id!);
    const hasChildren = node.children.length > 0;
    
    // Styling for DND feedback
    const isOver = dragOverId === node.id;
    const isDragging = draggedId === node.id;
    
    let borderClass = '';
    if (isOver) {
      if (dragPosition === 'before') borderClass = 'border-t-2 border-blue-500';
      else if (dragPosition === 'after') borderClass = 'border-b-2 border-blue-500';
      else if (dragPosition === 'inside') borderClass = 'bg-blue-50 ring-1 ring-blue-300 ring-inset';
    }

    return (
      <div 
        key={node.id} 
        className={`relative ${isDragging ? 'opacity-50' : ''}`}
        style={{ paddingLeft: depth === 0 ? 0 : '12px' }} // Indent children
      >
        <div 
          className={`
            group flex items-center gap-1.5 px-2 py-1 rounded min-h-[28px] cursor-pointer text-sm transition-colors select-none
            ${currentChapter?.id === node.id ? 'bg-notion-active text-notion-text font-medium' : 'text-notion-text-light hover:bg-notion-hover'}
            ${borderClass}
          `}
          onClick={() => selectChapter(node)}
          draggable
          onDragStart={(e) => handleDragStart(e, node.id!)}
          onDragOver={(e) => handleDragOver(e, node.id!)}
          onDrop={(e) => handleDrop(e, node.id!)}
        >
            {/* Expand Toggle */}
            <div 
              className={`w-5 h-5 flex items-center justify-center rounded hover:bg-slate-300/50 text-notion-text-lighter transition-transform ${hasChildren ? 'opacity-100' : 'opacity-0'}`}
              onClick={(e) => toggleExpand(e, node.id!)}
            >
               {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </div>

            {/* Icon */}
            <div className="text-notion-text-lighter">
               <FileText size={15} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <span className="truncate flex-1">{node.title || "Untitled"}</span>

            {/* Actions */}
            <div className={`opacity-0 group-hover:opacity-100 flex items-center ${currentChapter?.id === node.id ? 'opacity-100' : ''}`}>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteChapter(node.id!); }}
                  className="text-notion-text-lighter hover:text-red-600 p-0.5 rounded"
                >
                  <Trash2 size={13} />
                </button>
            </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-slate-200 ml-[15px]"> 
            {/* The border-l creates a nice guide line, adjusted margin to align with chevron center approx */}
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const startCreatingBook = () => {
    setShowBookList(true);
    setIsCreatingBook(true);
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBookTitle.trim()) {
      await createBook(newBookTitle, 'No description');
      setNewBookTitle('');
      setIsCreatingBook(false);
      setShowBookList(false);
    }
  };
  
  const handleDeleteBook = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm("Delete this book?")) {
      await deleteBook(id);
    }
  };

  const handleCreateChapter = async () => {
    if (currentBook?.id) {
        await createChapter(currentBook.id, "Untitled");
    }
  };

  return (
    <div className="h-full bg-notion-sidebar border-r border-notion-border flex flex-col w-[260px] transition-all duration-300 ease-in-out">
      {/* Workspace Switcher */}
      <div className="p-3">
        <div 
          className="flex items-center gap-2 p-1.5 rounded-md hover:bg-notion-hover cursor-pointer transition-colors"
          onClick={() => setShowBookList(!showBookList)}
        >
           <div className="w-5 h-5 rounded bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
              {currentBook ? currentBook.title.charAt(0).toUpperCase() : 'B'}
           </div>
           <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate text-notion-text">
                  {currentBook ? currentBook.title : 'Select Book'}
              </div>
           </div>
           <div className="text-notion-text-light">
               <ChevronDown size={14} />
           </div>
        </div>
      </div>

      {/* Book List Dropdown */}
      {showBookList && (
        <div className="mx-3 mb-2 bg-white border border-notion-border rounded-lg shadow-lg overflow-hidden z-20">
           <div className="p-1 max-h-[250px] overflow-y-auto">
               <div className="text-[11px] font-semibold text-notion-text-light px-2 py-1.5 uppercase">Switch Book</div>
               {books.map(book => (
                 <div 
                   key={book.id}
                   onClick={() => { selectBook(book); setShowBookList(false); }}
                   className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-notion-hover cursor-pointer text-sm"
                 >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="w-4 h-4 rounded-sm bg-slate-200 flex items-center justify-center text-[9px] text-slate-600">
                            {book.title.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate">{book.title}</span>
                    </div>
                    {books.length > 1 && (
                        <button 
                            onClick={(e) => handleDeleteBook(e, book.id!)}
                            className="text-notion-text-lighter hover:text-red-600 p-1"
                        >
                        <Trash2 size={12} />
                        </button>
                    )}
                 </div>
               ))}
               
               {!isCreatingBook ? (
                 <div 
                    onClick={() => setIsCreatingBook(true)}
                    className="flex items-center gap-2 px-2 py-1.5 mt-1 rounded hover:bg-notion-hover cursor-pointer text-sm text-notion-text-light"
                 >
                    <Plus size={14} /> <span>Create new book</span>
                 </div>
               ) : (
                 <form onSubmit={handleCreateBook} className="p-2">
                   <input 
                     autoFocus
                     type="text" 
                     placeholder="Book Title" 
                     className="w-full text-sm p-1.5 bg-notion-hover border border-transparent focus:bg-white focus:border-blue-400 rounded outline-none"
                     value={newBookTitle}
                     onChange={(e) => setNewBookTitle(e.target.value)}
                     onBlur={() => { if(!newBookTitle) setIsCreatingBook(false); }}
                   />
                 </form>
               )}
           </div>
        </div>
      )}

      {/* Navigation / Chapters */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {currentBook ? (
          <>
            <div className="px-2 py-1 text-[11px] font-semibold text-notion-text-light mt-2 mb-1">
                PAGES
            </div>
            
            <div className="space-y-0.5 pb-4">
                {chapterTree.length > 0 ? (
                    chapterTree.map(node => renderNode(node))
                ) : (
                    <div className="px-2 py-4 text-xs text-notion-text-lighter italic">
                        No pages yet.
                    </div>
                )}
            </div>

            <div 
                onClick={handleCreateChapter}
                className="flex items-center gap-2 px-2 py-1.5 mt-1 rounded hover:bg-notion-hover cursor-pointer text-sm text-notion-text-light group"
            >
                <div className="flex items-center justify-center w-4 h-4 text-notion-text-lighter group-hover:text-notion-text">
                    <Plus size={14} />
                </div>
                <span className="group-hover:text-notion-text">Add a page</span>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-notion-text-lighter text-sm">
            <Book size={24} className="mb-2 opacity-50"/>
            <p className="mb-2">No book selected</p>
            <button 
                onClick={startCreatingBook}
                className="text-xs bg-white px-3 py-1.5 rounded shadow-sm border border-notion-border text-notion-text hover:bg-notion-hover transition-colors"
            >
                Create a book
            </button>
          </div>
        )}
      </div>
      
      {/* Bottom Actions */}
      <div className="p-3 border-t border-notion-border mt-auto">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-notion-hover cursor-pointer text-sm text-notion-text-light">
            <Settings size={15} />
            <span>Settings</span>
        </div>
      </div>
    </div>
  );
};
