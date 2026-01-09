"use client";

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface MarkdownImportProps {
  onImport: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Markdown 导入组件
 *
 * 功能：
 * - 支持单个或多个 Markdown 文件导入
 * - 触发文件选择对话框
 * - 通过回调函数返回选中的文件列表
 *
 * @example
 * <MarkdownImport
 *   onImport={(files) => {
 *     files.forEach(file => {
 *       console.log(file.name, file.size);
 *     });
 *   }}
 *   disabled={false}
 * />
 */
export const MarkdownImport: React.FC<MarkdownImportProps> = ({ onImport, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // 过滤出 Markdown 文件
    const markdownFiles = Array.from(files).filter(file =>
      file.name.endsWith('.md') ||
      file.type === 'text/markdown' ||
      file.type === 'text/x-markdown'
    );

    if (markdownFiles.length === 0) {
      alert('请选择 Markdown 文件（.md）');
      return;
    }

    // 触发导入回调
    onImport(markdownFiles);

    // 重置文件输入，允许再次选择相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,text/markdown,text/x-markdown"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        title="导入 Markdown"
        className={`p-1 transition-colors ${
          disabled
            ? 'text-notion-text-lighter cursor-not-allowed'
            : 'text-notion-text-light hover:text-notion-text hover:bg-notion-hover'
        } rounded-sm`}
      >
        <Upload size={18} strokeWidth={2} />
      </button>
    </>
  );
};

export default MarkdownImport;
