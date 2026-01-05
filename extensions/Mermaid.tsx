import React, { useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

const ensureMermaid = () => {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
    });
    mermaidInitialized = true;
  }
};

const MermaidNodeView: React.FC<NodeViewProps> = ({ node, selected }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { code } = node.attrs as { code: string };

  useEffect(() => {
    ensureMermaid();
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      containerRef.current.innerHTML = '';

      try {
        const { svg } = await mermaid.render(
          `mermaid-${Math.random().toString(36).slice(2)}`,
          code || ''
        );
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="mermaid-error">Mermaid 解析失败：${(error as Error).message}</pre>`;
        }
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <NodeViewWrapper
      className={`mermaid-block${selected ? ' is-selected' : ''}`}
      data-type="mermaid-node"
      contentEditable={false}
    >
      <div className="mermaid-diagram" ref={containerRef} />
      <div className="mermaid-caption">```mermaid```</div>
    </NodeViewWrapper>
  );
};

export const Mermaid = Node.create({
  name: 'mermaid',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      code: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid"]',
        getAttrs: dom => ({
          code: (dom as HTMLElement).dataset.code || (dom.textContent || '').trim(),
        }),
      },
      {
        tag: 'pre[data-type="mermaid"]',
        getAttrs: dom => ({
          code: (dom.textContent || '').trim(),
        }),
      },
      {
        tag: 'pre',
        getAttrs: dom => {
          const codeEl = (dom as HTMLElement).querySelector('code.language-mermaid');
          if (codeEl) {
            return {
              code: (codeEl.textContent || '').trim(),
            };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { code, ...attrs } = HTMLAttributes;
    return [
      'pre',
      mergeAttributes({ 'data-type': 'mermaid' }, attrs),
      ['code', { class: 'language-mermaid' }, code || ''],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },
});
