"use client";

import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { generatePDFFromDOM } from '@/lib/pdf-generator';

interface PDFExportProps {
  title: string;
  disabled?: boolean;
}

export function PDFExport({ title, disabled = false }: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 获取编辑器内容区域
      const element = document.getElementById('editor-scroll-container');
      if (!element) {
        throw new Error('Editor content not found');
      }

      // 生成 PDF
      await generatePDFFromDOM(title, element);
    } catch (error) {
      console.error('PDF export failed:', error);
      // 错误提示已在 generatePDFFromDOM 中处理
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || disabled}
      className="p-1 text-notion-text-light hover:text-notion-text hover:bg-notion-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
      title="导出为 PDF"
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  );
}
