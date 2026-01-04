/**
 * Markdown 粘贴处理工具
 * 将粘贴的 Markdown 文本转换为 Tiptap 可识别的格式
 */

/**
 * 解析 Markdown 表格
 * 支持 GitHub 风格的表格语法
 */
function parseTable(lines: string[], startIndex: number): { tableHTML: string; nextIndex: number } {
  const rows: string[][] = [];
  let i = startIndex;

  // 解析表头
  if (i < lines.length && lines[i].includes('|')) {
    const headerCells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
    rows.push(headerCells);
    i++;
  }

  // 跳过分隔行 (| --- | --- |)
  if (i < lines.length && lines[i].includes('|') && lines[i].includes('---')) {
    i++;
  }

  // 解析表格内容行
  while (i < lines.length && lines[i].trim() !== '' && lines[i].includes('|')) {
    const cells = lines[i].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
    if (cells.length > 0) {
      rows.push(cells);
    }
    i++;
  }

  // 构建 HTML
  let html = '<table>\n';

  // 表头
  if (rows.length > 0) {
    html += '  <thead>\n    <tr>\n';
    rows[0].forEach(cell => {
      html += `      <th>${cell}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
  }

  // 表体
  if (rows.length > 1) {
    html += '  <tbody>\n';
    for (let r = 1; r < rows.length; r++) {
      html += '    <tr>\n';
      rows[r].forEach(cell => {
        html += `      <td>${cell}</td>\n`;
      });
      html += '    </tr>\n';
    }
    html += '  </tbody>\n';
  }

  html += '</table>';
  return { tableHTML: html, nextIndex: i };
}

// 简单的 Markdown 到 HTML 转换器
export function markdownToHTML(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // 转义 HTML 特殊字符（在处理 markdown 语法之前）
  html = html.replace(/&/g, '&amp;')
             .replace(/</g, '&lt;')
             .replace(/>/g, '&gt;');

  // 代码块 ```code``` - 需要在转义后处理
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    // 还原代码中的 HTML 实体
    const restoredCode = code
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    return `<pre><code class="language-${lang}">${restoredCode}</code></pre>`;
  });

  // 行内代码 `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 标题 # ## ###
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 粗体 **text** 或 __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 斜体 *text* 或 _text_
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // 删除线 ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // 引用 > text
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // 链接 [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 图片 ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // 水平线 --- 或 ***
  html = html.replace(/^[\-\*]{3,}$/gm, '<hr />');

  // 段落和列表处理（表格需要特殊处理）
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inParagraph = false;
  let paragraphContent: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 检测表格起始行
    if (line.includes('|') && line.trim().startsWith('|')) {
      // 结束当前段落
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent.join('<br>')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      // 结束当前列表
      if (inList) {
        processedLines.push(`</${listType}>`);
        inList = false;
        listType = null;
      }

      const { tableHTML, nextIndex } = parseTable(lines, i);
      processedLines.push(tableHTML);
      i = nextIndex;
      continue;
    }

    // 无序列表
    if (/^[\*\-] /.test(line)) {
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent.join('<br>')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      if (!inList || listType !== 'ul') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      const content = line.replace(/^[\*\-] /, '');
      processedLines.push(`<li>${content}</li>`);
      i++;
      continue;
    }

    // 有序列表
    if (/^\d+\. /.test(line)) {
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent.join('<br>')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      if (!inList || listType !== 'ol') {
        if (inList) processedLines.push(`</${listType}>`);
        processedLines.push('<ol>');
        inList = true;
        listType = 'ol';
      }
      const content = line.replace(/^\d+\. /, '');
      processedLines.push(`<li>${content}</li>`);
      i++;
      continue;
    }

    // 结束列表
    if (inList && (!line.trim() || line.match(/^<(h[1-6]|blockquote|pre|table|hr)/))) {
      processedLines.push(`</${listType}>`);
      inList = false;
      listType = null;
    }

    // 跳过已经是 HTML 块级元素的行
    if (line.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|table|hr|div|p)/)) {
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent.join('<br>')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      processedLines.push(line);
    }
    // 空行
    else if (line.trim() === '') {
      if (inParagraph) {
        processedLines.push(`<p>${paragraphContent.join('<br>')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      processedLines.push('');
    }
    // 普通文本行
    else if (line.trim() !== '') {
      inParagraph = true;
      paragraphContent.push(line);
    }

    i++;
  }

  // 结束未关闭的列表
  if (inList) {
    processedLines.push(`</${listType}>`);
  }

  // 处理最后一个段落
  if (inParagraph) {
    processedLines.push(`<p>${paragraphContent.join('<br>')}</p>`);
  }

  return processedLines.join('\n');
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
