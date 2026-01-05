import { marked } from 'marked';

const renderer = new marked.Renderer();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

renderer.code = (code, infostring) => {
  const language = (infostring || '').trim();
  const escaped = escapeHtml(code ?? '');

  if (language === 'mermaid') {
    return `<pre data-type="mermaid"><code class="language-mermaid">${escaped}</code></pre>`;
  }

  const className = language ? ` class="language-${language}"` : '';
  return `<pre><code${className}>${escaped}</code></pre>`;
};

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
  renderer,
});

// 利用 marked 做更全面的 Markdown -> HTML 转换，支持 GFM 表格、代码块等
export function markdownToHTML(markdown: string): string {
  if (!markdown) return '';
  return marked.parse(markdown) as string;
}

/**
 * 检测剪贴板内容是否包含 Markdown
 */
export function isMarkdownContent(text: string): boolean {
  if (!text) return false;

  // 检测常见 Markdown 语法特征
  const markdownPatterns = [
    /^#{1,6}\s/,           // 标题
    /\*\*.*\*\*/,          // 粗体
    /__.*__/,              // 粗体
    /\*.*\*/,              // 斜体
    /_.*_/,                // 斜体
    /^\s*[-*]\s/,          // 无序列表
    /^\s*\d+\.\s/,         // 有序列表
    /^\s*>/,               // 引用
    /\[.*\]\(.*\)/,        // 链接
    /```/,                 // 代码块
    /`[^`]+`/,             // 行内代码
    /^\|.*\|/,             // 表格
    /```mermaid/,          // Mermaid 代码块
  ];

  return markdownPatterns.some(pattern => pattern.test(text));
}

/**
 * 从剪贴板事件中获取纯文本内容
 */
export function getTextFromClipboard(event: ClipboardEvent): string | null {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (const item of Array.from(items)) {
    if (item.type === 'text/plain') {
      const blob = item.getAsFile();
      if (blob) {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(blob);
        }) as any;
      }
    }
  }

  // 尝试直接从 getData 获取
  return event.clipboardData?.getData('text/plain') || null;
}
