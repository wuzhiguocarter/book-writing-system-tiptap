import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
import { isMarkdownContent, markdownToHTML } from '../utils/markdown';

/**
 * Markdown 粘贴扩展
 *
 * 检测粘贴的 Markdown 格式文本，自动转换为渲染后的 HTML 内容
 */
export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addOptions() {
    return {
      // 是否在粘贴时转换 Markdown
      transformOnPaste: true,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const text = event.clipboardData?.getData('text/plain');

            // 检测是否为 Markdown 内容
            if (text && isMarkdownContent(text)) {
              event.preventDefault();

              // 将 Markdown 转换为 HTML
              const html = markdownToHTML(text);

              // 使用 ProseMirror 的 DOMParser 解析 HTML
              const { state, dispatch } = view;
              const { from, to } = state.selection;

              // 创建一个临时 div 来解析 HTML
              const dom = document.createElement('div');
              dom.innerHTML = html;

              // 使用 ProseMirror 的 DOMParser 解析
              const parser = ProseMirrorDOMParser.fromSchema(view.state.schema);
              const slice = parser.parseSlice(dom);

              // 替换选中的内容
              const tr = state.tr.replaceWith(from, to, slice.content);
              dispatch(tr);

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});
