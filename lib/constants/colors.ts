/**
 * 颜色和阴影系统
 *
 * 设计理念：
 * - Notion 风格的极简配色
 * - 多级阴影系统实现层次感
 * - 语义化颜色命名
 */

/**
 * 封面颜色调色板（Notion 风格）
 * 使用柔和的 pastel 色系，避免过于鲜艳
 */
export const COVER_COLORS = {
  // 基础色系（柔和粉彩）
  pastels: [
    '#FAF5FF', // 浅紫
    '#FFF5F5', // 浅粉
    '#F0FFF4', // 浅绿
    '#FFFAF0', // 浅橙
    '#F0F9FF', // 浅蓝
    '#FEFCE8', // 浅黄
    '#F5F5F5', // 浅灰
    '#FAF9F6', // 象牙白
  ],

  // 语义化颜色（用于标签、状态）
  accent: {
    blue: '#E0F2FE',
    green: '#DCFCE7',
    purple: '#F3E8FF',
    pink: '#FCE7F3',
    orange: '#FFEDD5',
    yellow: '#FEF9C3',
  }
};

/**
 * 多级阴影系统
 * 基于 Dimensional Layering 设计理念
 */
export const SHADOW_LEVELS = {
  // 基础卡片
  card: {
    default: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    hover: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
    active: '0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.06)',
  },

  // 浮动元素（菜单、下拉）
  floating: {
    default: '0 10px 25px rgba(0, 0, 0, 0.1), 0 6px 10px rgba(0, 0, 0, 0.05)',
    hover: '0 15px 35px rgba(0, 0, 0, 0.12), 0 8px 12px rgba(0, 0, 0, 0.06)',
  },

  // 置顶卡片（增强阴影）
  pinned: {
    default: '0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04)',
    hover: '0 8px 20px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)',
  }
};

/**
 * Notion 风格颜色规范
 */
export const NOTION_COLORS = {
  // 背景色
  bg: {
    base: '#FFFFFF',
    secondary: '#F7F7F5',
    hover: '#EFEFED',
    active: 'rgba(55, 53, 47, 0.08)',
  },

  // 文字色
  text: {
    primary: '#37352F',
    secondary: 'rgba(55, 53, 47, 0.65)',
    tertiary: 'rgba(55, 53, 47, 0.45)',
  },

  // 边框色
  border: {
    default: '#E9E9E7',
    hover: '#D6D6D4',
  }
};
