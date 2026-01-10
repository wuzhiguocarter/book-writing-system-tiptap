"use client";

import { BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LogoProps {
  variant?: 'default' | 'compact';
}

/**
 * Logo 组件
 *
 * 设计理念：
 * - 替换 emoji 为专业 Logo
 * - 渐变背景 + 图标
 * - 悬停微交互
 */
export const Logo: React.FC<LogoProps> = ({ variant = 'default' }) => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/');
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 cursor-pointer" onClick={handleClick}>
        <div className="w-8 h-8 bg-gradient-to-br from-stone-800 to-stone-700
                       rounded-lg flex items-center justify-center
                       shadow-md hover:shadow-lg
                       transition-all duration-300
                       hover:-translate-y-0.5">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 group cursor-pointer"
      onClick={handleClick}
    >
      {/* Logo 图标 */}
      <div className="relative">
        <div className="w-9 h-9 bg-gradient-to-br from-stone-800 to-stone-700
                        rounded-xl flex items-center justify-center
                        shadow-lg group-hover:shadow-xl
                        transition-all duration-300
                        group-hover:-translate-y-0.5">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        {/* 微妙的光泽效果 */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr
                          from-white/20 to-transparent opacity-0
                          group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* 品牌名称 */}
      <div className="flex flex-col">
        <span className="text-lg font-bold text-stone-800 tracking-tight
                       group-hover:text-stone-900 transition-colors">
          BookCraft
        </span>
        <span className="text-[10px] text-stone-500 font-medium tracking-wide uppercase">
          Write Your Story
        </span>
      </div>
    </div>
  );
};
