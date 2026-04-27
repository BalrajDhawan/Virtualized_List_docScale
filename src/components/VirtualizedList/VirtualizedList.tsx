import React from 'react';
import { useVirtualizer } from '../../hooks/useVirtualizer';
import { ITEM_HEIGHT } from '../../constants';

interface VirtualizedListProps {
  pageCount: number;
  renderItem: (actualPageIndex: number, translateY: number, domIndex: number, scrollVelocity: number) => React.ReactNode;
}

export function VirtualizedList({ pageCount, renderItem }: VirtualizedListProps) {
  const {
    viewportRef,
    handlePointerDown,
    isDragging,
    thumbHeight,
    thumbY,
    virtualScrollTop,
    scrollVelocity,
    startIndex,
    visiblePageCount,
    theoreticalTotalHeight,
    viewportHeight
  } = useVirtualizer({ pageCount, itemHeight: ITEM_HEIGHT });

  return (
    <div
      ref={viewportRef}
      className="w-full max-w-[1000px] h-[80vh] overflow-hidden bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 relative z-10"
    >
      {/* CUSTOM SCROLLBAR */}
      {pageCount > 0 && theoreticalTotalHeight > viewportHeight && (
        <div className="absolute top-0 right-0 w-3 h-full bg-zinc-100 dark:bg-zinc-800/80 border-l border-zinc-200 dark:border-zinc-700/50 z-50">
          <div
            onPointerDown={handlePointerDown}
            className={`absolute top-0 left-0 w-full rounded-full bg-zinc-400 hover:bg-zinc-500 dark:bg-zinc-600 dark:hover:bg-zinc-500 cursor-grab transform transition-colors ${isDragging ? '!bg-zinc-600 dark:!bg-zinc-400 cursor-grabbing' : ''}`}
            style={{
              height: `${thumbHeight}px`,
              transform: `translateY(${thumbY}px)`,
            }}
          />
        </div>
      )}

      {/* PAGES CANVAS */}
      <div className="w-full flex flex-col items-center gap-[32px] px-4 relative h-full">
        {pageCount === 0 ? (
          <p className="text-zinc-500 italic mt-10">No pages yet. Create some above!</p>
        ) : Array.from(
          { length: Math.min(visiblePageCount, pageCount - startIndex) },
          (_, index) => index + Math.max(0, startIndex)
        ).map((actualPageIndex, domIndex) => {
          const translateY = (actualPageIndex * ITEM_HEIGHT) - virtualScrollTop;
          return renderItem(actualPageIndex, translateY, domIndex, scrollVelocity);
        })}
      </div>
    </div>
  );
}
