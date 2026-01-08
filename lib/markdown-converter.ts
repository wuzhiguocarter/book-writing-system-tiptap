/**
 * 将 TipTap HTML 内容转换为 Markdown
 * @param html - TipTap 编辑器的 HTML 内容
 * @returns Markdown 格式的文本
 */
export function htmlToMarkdown(html: string): string {
  // 创建临时 DOM 元素
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let markdown = '';

  // 遍历所有子元素
  Array.from(tempDiv.childNodes).forEach((node) => {
    markdown += nodeToMarkdown(node);
  });

  return markdown.trim();
}

/**
 * 递归转换 DOM 节点为 Markdown
 */
function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case 'h1':
      return `# ${element.textContent}\n\n`;
    case 'h2':
      return `## ${element.textContent}\n\n`;
    case 'h3':
      return `### ${element.textContent}\n\n`;
    case 'h4':
      return `#### ${element.textContent}\n\n`;
    case 'h5':
      return `##### ${element.textContent}\n\n`;
    case 'h6':
      return `###### ${element.textContent}\n\n`;
    case 'strong':
    case 'b':
      return `**${element.textContent}**`;
    case 'em':
    case 'i':
      return `*${element.textContent}*`;
    case 'code':
      return `\`${element.textContent}\``;
    case 'pre':
      const code = element.querySelector('code');
      return `\`\`\`\n${code ? code.textContent : element.textContent}\n\`\`\`\n\n`;
    case 'a':
      const href = element.getAttribute('href') || '';
      return `[${element.textContent}](${href})`;
    case 'img':
      const alt = element.getAttribute('alt') || '';
      const src = element.getAttribute('src') || '';
      return `![${alt}](${src})`;
    case 'ul':
      return Array.from(element.children)
        .map((li) => `- ${li.textContent}`)
        .join('\n') + '\n\n';
    case 'ol':
      return Array.from(element.children)
        .map((li, index) => `${index + 1}. ${li.textContent}`)
        .join('\n') + '\n\n';
    case 'blockquote':
      return `> ${element.textContent}\n\n`;
    case 'p':
      return `${element.textContent}\n\n`;
    case 'br':
      return '\n';
    case 'hr':
      return '---\n\n';
    default:
      // 递归处理子节点
      return Array.from(element.childNodes)
        .map((child) => nodeToMarkdown(child))
        .join('');
  }
}

/**
 * 将 Markdown 转换为 HTML（简化版）
 * 注意：这是一个基础实现，建议在生产环境中使用专业的 Markdown 解析库
 * @param markdown - Markdown 格式的文本
 * @returns HTML 字符串
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // 转义 HTML 特殊字符
  html = html.replace(/&/g, '&amp;');
  html = html.replace(/</g, '&lt;');
  html = html.replace(/>/g, '&gt;');

  // 标题
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // 代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>');

  // 链接和图片
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // 引用
  html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // 分割线
  html = html.replace(/^---$/gm, '<hr />');

  // 无序列表
  html = html.replace(/^\-\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // 有序列表
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');

  // 段落
  html = html.replace(/^(?!<[a-z]).+$/gm, '<p>$&</p>');

  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/**
 * 下载内容为 Markdown 文件
 * @param content - Markdown 内容
 * @param filename - 文件名（不含扩展名）
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 读取上传的 Markdown 文件
 * @param file - 文件对象
 * @returns Promise<string> - Markdown 内容
 */
export function readMarkdownFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    reader.onerror = (e) => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}
