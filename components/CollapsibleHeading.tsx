import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleHeadingProps {
  level: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  headingId: string;
}

export const CollapsibleHeading: React.FC<CollapsibleHeadingProps> = ({
  level,
  isCollapsed,
  onToggleCollapse,
  headingId,
}) => {
  return (
    <div
      className={`group relative flex items-center gap-1 heading-wrapper heading-${level}`}
      data-heading-id={headingId}
      data-collapsed={isCollapsed}
    >
      <button
        onClick={onToggleCollapse}
        className="flex-shrink-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-200"
        title={isCollapsed ? 'Expand' : 'Collapse'}
        aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
      >
        <ChevronDown
          size={16}
          className={`transition-transform ${
            isCollapsed ? '-rotate-90' : ''
          }`}
        />
      </button>
    </div>
  );
};
