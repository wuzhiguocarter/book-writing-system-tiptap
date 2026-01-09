/**
 * 生成简单的字符串哈希值
 *
 * @param str - 输入字符串
 * @returns 哈希值（数字）
 *
 * @example
 * hash('Hello World') // => 123456789
 */
export function hash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * 生成标题的唯一 ID
 *
 * @param text - 标题文本
 * @param level - 标题级别 (1-6)
 * @param index - 标题索引（用于处理重复标题）
 * @returns 唯一 ID 字符串
 *
 * @example
 * generateHeadingId('Introduction', 1, 0) // => "heading-1-123456789-0"
 */
export function generateHeadingId(text: string, level: number, index: number): string {
  const hashValue = hash(text);
  return `heading-${level}-${hashValue}-${index}`;
}
