"use client";

interface BookshelfSkeletonProps {
  count?: number;
}

/**
 * 书架骨架屏组件
 *
 * 功能：
 * - 显示占位卡片
 * - 脉冲动画效果
 * - 交错动画延迟
 */
export const BookshelfSkeleton: React.FC<BookshelfSkeletonProps> = ({
  count = 12
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3
                    lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
                    gap-4 sm:gap-5 lg:gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="relative rounded-2xl bg-white border border-stone-200/60
                      overflow-hidden"
            style={{
              minHeight: '200px',
              animation: `skeleton-pulse 2s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {/* 置顶标记占位 */}
            <div className="absolute top-4 left-4 w-16 h-7
                          bg-stone-200/50 rounded-full" />

            {/* 操作按钮占位 */}
            <div className="absolute top-4 right-4 w-8 h-8
                          bg-stone-200/50 rounded-xl" />

            {/* 主要内容占位 */}
            <div className="p-6 h-full flex flex-col">
              {/* 标题占位 */}
              <div className="w-3/4 h-6 bg-stone-200/50 rounded-lg mb-3" />
              <div className="w-1/2 h-6 bg-stone-200/50 rounded-lg mb-4" />

              {/* 描述占位 */}
              <div className="w-full h-4 bg-stone-200/40 rounded mb-2" />
              <div className="w-2/3 h-4 bg-stone-200/40 rounded mb-4" />

              {/* 底部信息占位 */}
              <div className="mt-auto space-y-2">
                <div className="w-20 h-4 bg-stone-200/40 rounded" />
                <div className="w-24 h-4 bg-stone-200/40 rounded" />

                {/* 标签占位 */}
                <div className="flex gap-1.5 pt-2.5">
                  <div className="w-12 h-5 bg-stone-200/40 rounded-full" />
                  <div className="w-10 h-5 bg-stone-200/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
