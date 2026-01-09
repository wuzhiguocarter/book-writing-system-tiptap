import { useState, useEffect } from 'react';

/**
 * 监听编辑器滚动，自动高亮当前可见的标题
 *
 * 使用 IntersectionObserver API 监听标题元素是否进入视口
 * 当标题进入视口时，自动将其 ID 设置为活动标题
 *
 * @returns 当前活动标题的 ID
 *
 * @example
 * const activeId = useActiveHeading();
 *
 * {toc.map((item) => (
 *   <div
 *     key={item.id}
 *     className={activeId === item.id ? 'active' : ''}
 *   >
 *     {item.text}
 *   </div>
 * ))}
 */
export const useActiveHeading = () => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // 定义 IntersectionObserver 的回调
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      // 找到所有正在 intersecting 的元素
      const visibleHeadings = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => {
          // 按照在文档中的位置排序，选择最上面的可见标题
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

      if (visibleHeadings.length > 0) {
        const topVisibleHeading = visibleHeadings[0];
        const id = topVisibleHeading.target.getAttribute('data-id');
        if (id) {
          setActiveId(id);
        }
      }
    };

    // 创建 IntersectionObserver
    const observer = new IntersectionObserver(handleIntersection, {
      // 视口中间区域为有效观察区
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    });

    // 观察所有带有 data-id 属性的标题元素
    const observeHeadings = () => {
      // 清理之前的观察
      observer.disconnect();

      // 查找所有标题元素
      const headings = document.querySelectorAll('[data-id]');
      headings.forEach(heading => observer.observe(heading));
    };

    // 初始观察
    observeHeadings();

    // 使用 MutationObserver 监听 DOM 变化（用于动态添加的标题）
    const mutationObserver = new MutationObserver(() => {
      observeHeadings();
    });

    const editorContainer = document.getElementById('editor-scroll-container');
    if (editorContainer) {
      mutationObserver.observe(editorContainer, {
        childList: true,
        subtree: true
      });
    }

    // 清理函数
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  return activeId;
};

export default useActiveHeading;
