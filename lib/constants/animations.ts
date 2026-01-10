/**
 * 动画配置系统
 *
 * 设计理念：
 * - 基于 Swiss Modernism 的数学化时长
 * - 使用标准缓动函数确保流畅性
 * - 预设常用动画组合
 */

/**
 * 动画缓动函数
 * 参考：Framer Motion 和 Apple HIG
 */
export const EASING = {
  // 标准缓动（用于大多数动画）
  standard: [0.25, 0.1, 0.25, 1] as const,

  // 传入缓动（用于进入动画）
  easeIn: [0.42, 0, 1, 1] as const,

  // 传出缓动（用于退出动画）
  easeOut: [0, 0, 0.58, 1] as const,

  // 弹性缓动（用于微交互）
  elastic: [0.68, -0.55, 0.265, 1.55] as const,
} as const;

/**
 * 动画时长（秒）
 * 基于用户体验研究的最佳实践
 */
export const DURATION = {
  /** 快速微交互（按钮点击、悬停） */
  fast: 0.15,

  /** 标准过渡（悬停、模态框、下拉菜单） */
  normal: 0.3,

  /** 慢速过渡（页面切换、复杂布局变化） */
  slow: 0.5,
} as const;

/**
 * 预设动画配置
 * 可直接用于 Framer Motion 的 transition 属性
 */
export const TRANSITIONS = {
  /** 快速交互（按钮点击） */
  fast: {
    duration: DURATION.fast,
    ease: EASING.standard,
  },

  /** 标准过渡（悬停、展开） */
  normal: {
    duration: DURATION.normal,
    ease: EASING.standard,
  },

  /** 弹性效果（微交互） */
  bouncy: {
    duration: DURATION.normal,
    ease: EASING.elastic,
  },

  /** 页面切换 */
  page: {
    duration: DURATION.slow,
    ease: EASING.easeOut,
  },
} as const;

/**
 * 预设动画组合
 * 包含 initial、animate、exit 状态
 */
export const PRESETS = {
  /** 淡入淡出 */
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  /** 从下进入 */
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  /** 缩放淡入 */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },

  /** 从左滑入（侧边栏） */
  slideLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  },
} as const;

/**
 * 卡片入场动画工厂函数
 * @param delay - 延迟时间（秒），用于交错动画
 */
export const createCardAppearAnimation = (delay: number) => ({
  initial: { opacity: 0, y: 24, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: {
    duration: DURATION.normal,
    delay,
    ease: EASING.standard,
  },
});

/**
 * 菜单/下拉框动画
 */
export const MENU_ANIMATION = {
  initial: { opacity: 0, y: -8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.95 },
  transition: {
    duration: DURATION.fast,
    ease: EASING.standard,
  },
} as const;
