"use client";

import React, { useState, useRef, useEffect } from "react";

export default function Home() {
  const [pageCount, setPageCount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [startIndex, setStartIndex] = useState<number>(0);
  
  // Custom Scroll State
  const [virtualScrollTop, setVirtualScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(800);
  
  // Scrollbar Dragging State
  const [isDragging, setIsDragging] = useState(false);
  
  // React refs for accessing DOM without re-renders during dragging
  const dragStartY = useRef<number>(0);
  const dragStartScrollTop = useRef<number>(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const handleSetPages = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num >= 0) {
      setPageCount(num);
      setInputValue("");
    }
  };

  const incrementPages = () => setPageCount(prev => prev + 1);
  const decrementPages = () => setPageCount(prev => (prev > 0 ? prev - 1 : 0));

  // Get dynamic viewport height on mount and resize
  useEffect(() => {
    if (viewportRef.current) {
      setViewportHeight(viewportRef.current.clientHeight);
    }
  }, [pageCount]);

  // Compute boundaries mathematically
  const ITEM_HEIGHT = 732;
  const theoreticalTotalHeight = pageCount > 0 ? (pageCount * 700) + ((pageCount - 1) * 32) : 0;
  const maxPossibleScroll = Math.max(0, theoreticalTotalHeight - viewportHeight);

  // We are completely destroying native scrolling and replacing it with pure mathematical tracking
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (pageCount === 0) return;
    if (theoreticalTotalHeight <= viewportHeight) return;
    
    // Normalize Wheel Speed (OS/Browser discrepancies)
    let deltaY = e.deltaY;
    if (e.deltaMode === 1) deltaY *= 33; // Line mode (Windows)
    else if (e.deltaMode === 2) deltaY *= viewportHeight; // Page mode

    setVirtualScrollTop((prev) => {
      const newScroll = prev + deltaY;
      const clampedScroll = Math.max(0, Math.min(newScroll, maxPossibleScroll));
      
      // Update startIndex mathematically based on our virtual scroll
      const newStartIndex = Math.floor(clampedScroll / ITEM_HEIGHT);
      setStartIndex((prevIndex) => prevIndex !== newStartIndex ? newStartIndex : prevIndex);
      
      return clampedScroll;
    });
  };

  // --- Custom Scrollbar Drag Physics ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = virtualScrollTop;
    document.body.style.userSelect = "none"; // prevent text selection while dragging
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      // How far did the physical mouse move down the screen?
      const physicalDeltaY = e.clientY - dragStartY.current;
      
      // Convert physical mouse movement into theoretical document scroll
      const scrollbarTrackHeight = viewportHeight;
      const thumbHeight = Math.max(40, (viewportHeight / theoreticalTotalHeight) * viewportHeight);
      const scrollablePixels = theoreticalTotalHeight - viewportHeight;
      const availableTrackSpace = scrollbarTrackHeight - thumbHeight;
      
      // Calculate multiplier: 1 pixel of mouse drag = X pixels of document scroll
      const scrollRatio = availableTrackSpace > 0 ? scrollablePixels / availableTrackSpace : 0;
      const theoreticalDelta = physicalDeltaY * scrollRatio;
      
      const newScroll = dragStartScrollTop.current + theoreticalDelta;
      const clampedScroll = Math.max(0, Math.min(newScroll, maxPossibleScroll));
      
      setVirtualScrollTop(clampedScroll);
      
      const newStartIndex = Math.floor(clampedScroll / ITEM_HEIGHT);
      setStartIndex((prevIndex) => prevIndex !== newStartIndex ? newStartIndex : prevIndex);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, viewportHeight, theoreticalTotalHeight, maxPossibleScroll]);

  // Thumb Positioning Math
  const thumbHeight = theoreticalTotalHeight > 0 
    ? Math.max(40, (viewportHeight / theoreticalTotalHeight) * viewportHeight)
    : 0;
  const thumbY = maxPossibleScroll > 0 
    ? (virtualScrollTop / maxPossibleScroll) * (viewportHeight - thumbHeight)
    : 0;

  return (
    <div className="flex flex-col flex-1 items-center justify-start min-h-screen py-5 bg-zinc-100 font-sans dark:bg-zinc-900 dark:text-zinc-100">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 px-6">
        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
          Virtualized List
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="0"
              className="border border-zinc-300 dark:border-zinc-700 bg-transparent rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28" 
              placeholder="Enter pages"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button 
              onClick={handleSetPages}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Create
            </button>
          </div>

          <div className="hidden md:block h-6 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={decrementPages}
              className="w-10 h-10 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded font-bold text-lg transition-colors"
              title="Remove page"
            >
              −
            </button>
            <button 
              onClick={incrementPages}
              className="w-10 h-10 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded font-bold text-lg transition-colors"
              title="Add page"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-lg font-medium whitespace-nowrap">
          Total: <span className="font-bold text-blue-600 dark:text-blue-400">{pageCount}</span>
        </div>
      </div>

      {/* VIEWPORT: Native scrolling disabled (overflow-hidden) */}
      <div 
        ref={viewportRef}
        className="w-full max-w-[1000px] h-[80vh] overflow-hidden bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 relative z-10"
        onWheel={handleWheel}
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

        {/* PAGES CANVAS: No calculated height! */}
        <div className="w-full flex flex-col items-center gap-[32px] px-4 relative h-full">
          {pageCount === 0 ? (
            <p className="text-zinc-500 italic mt-10">No pages yet. Create some above!</p>
          ) : Array.from(
            { length: Math.min(10, pageCount - startIndex) }, 
            (_, index) => index + startIndex
          ).map((actualPageIndex, index) => (
            <div 
              key={index} 
              contentEditable={true} 
              dangerouslySetInnerHTML={{ __html: "Page: " + (actualPageIndex + 1).toString() }} 
              style={{
                position: 'absolute',
                top: 0,
                // Pages are physically positioned mathematically against the virtual scroll!
                transform: `translateY(${(actualPageIndex * 732) - virtualScrollTop}px)`,
              }}
              className="bg-white border border-zinc-300 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black" 
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
