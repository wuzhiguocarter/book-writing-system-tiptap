import { useRef, useCallback, useEffect } from 'react';

/**
 * 防抖 Hook - 延迟执行函数，避免频繁调用
 *
 * @param callback - 需要防抖的回调函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 *
 * @example
 * const debouncedSave = useDebounce((content) => {
 *   saveContent(content);
 * }, 1000);
 */
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 返回防抖函数
  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      // 清除之前的定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 设置新的定时器
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedFunction;
}

export default useDebounce;
