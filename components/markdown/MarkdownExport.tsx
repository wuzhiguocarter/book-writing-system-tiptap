"use client";

import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { htmlToMarkdown, downloadMarkdown } from '@/lib/markdown-converter';

interface MarkdownExportProps {
  title: string;
  content: string;
  disabled?: boolean;
}

export function MarkdownExport({ title, content, disabled = false }: MarkdownExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 将 HTML 转换为 Markdown
      const markdown = htmlToMarkdown(content);

      // 下载 Markdown 文件
      downloadMarkdown(markdown, title || 'Untitled');
    } catch (error) {
      console.error('Markdown export failed:', error);

      // 显示错误提示
      const errorMsg = document.createElement('div');
      errorMsg.textContent = 'Markdown 导出失败，请重试';
      errorMsg.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(220, 38, 38, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
      `;
      document.body.appendChild(errorMsg);

      setTimeout(() => {
        document.body.removeChild(errorMsg);
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || disabled}
      className="p-1 text-notion-text-light hover:text-notion-text hover:bg-notion-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
      title="导出为 Markdown"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </button>
  );
}
