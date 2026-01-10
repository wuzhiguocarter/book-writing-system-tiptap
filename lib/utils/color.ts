/**
 * 颜色工具函数
 */

/**
 * 调整颜色亮度
 * 用于生成渐变色和悬停效果
 *
 * @param hex - 颜色值（格式：#RRGGBB）
 * @param percent - 亮度调整百分比（-100 到 100）
 * @returns 调整后的颜色值
 *
 * @example
 * adjustColorBrightness('#FF0000', 20) // 亮红色
 * adjustColorBrightness('#FF0000', -20) // 暗红色
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  // 移除 # 号
  const hexValue = hex.replace('#', '');

  // 转换为 RGB
  const num = parseInt(hexValue, 16);
  const r = (num >> 16) + Math.round(2.55 * percent);
  const g = ((num >> 8) & 0x00FF) + Math.round(2.55 * percent);
  const b = (num & 0x0000FF) + Math.round(2.55 * percent);

  // 限制在 0-255 范围内
  const R = Math.max(0, Math.min(255, r));
  const G = Math.max(0, Math.min(255, g));
  const B = Math.max(0, Math.min(255, b));

  // 转换回十六进制
  return '#' + (
    0x1000000 +
    R * 0x10000 +
    G * 0x100 +
    B
  ).toString(16).slice(1);
}

/**
 * 为颜色添加透明度
 *
 * @param hex - 颜色值（格式：#RRGGBB）
 * @param alpha - 透明度（0 到 1）
 * @returns RGBA 颜色值
 *
 * @example
 * addAlphaToColor('#FF0000', 0.5) // 'rgba(255, 0, 0, 0.5)'
 */
export function addAlphaToColor(hex: string, alpha: number): string {
  const hexValue = hex.replace('#', '');
  const r = parseInt(hexValue.substring(0, 2), 16);
  const g = parseInt(hexValue.substring(2, 4), 16);
  const b = parseInt(hexValue.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * 生成渐变背景
 * 用于卡片背景
 *
 * @param color - 基础颜色
 * @param angle - 渐变角度（默认 135deg）
 * @returns CSS 渐变字符串
 *
 * @example
 * generateGradient('#FAF5FF') // 'linear-gradient(135deg, #FAF5FF 0%, #FCFAFF 5%)'
 */
export function generateGradient(
  color: string,
  angle: number = 135
): string {
  const lighterColor = adjustColorBrightness(color, 5);
  return `linear-gradient(${angle}deg, ${color} 0%, ${lighterColor} 100%)`;
}
