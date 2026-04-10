"use client";

import React, { useState } from "react";

export default function Home() {
  const [pageCount, setPageCount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [startIndex, setStartIndex] = useState<number>(0);

  const handleSetPages = () => {
    const num = parseInt(inputValue, 10);
    if (!isNaN(num) && num >= 0) {
      setPageCount(num);
      setInputValue(""); // Clear input after setting
    }
  };

  const incrementPages = () => setPageCount(prev => prev + 1);
  const decrementPages = () => setPageCount(prev => (prev > 0 ? prev - 1 : 0));

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = 732; // 700px height + 32px gap
    const newStartIndex = Math.floor(scrollTop / itemHeight);
    
    // React inherently bails out of re-renders if the state value is unchanged.
    // This acts as a perfect, free "throttle" without needing a setTimeout/debounce.
    // We only re-render when the user physically crosses an exact page boundary!
    setStartIndex((prev) => {
      if (prev !== newStartIndex) {
        console.log("Page boundary crossed. Rendering offset:", newStartIndex);
        return newStartIndex;
      }
      return prev;
    });
  };

  const height = pageCount > 10 ? (pageCount * 700) + ((pageCount - 1) * 32) : 0;

  return (
    <div 
      className="flex flex-col flex-1 items-center justify-start min-h-screen py-5 bg-zinc-100 font-sans dark:bg-zinc-900 dark:text-zinc-100"
      >
      {/* Top Header Bar */}
      <div className="w-full max-w-[1000px] flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 px-6">
        
        {/* Left: Title */}
        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
          Virtualized List
        </h1>

        {/* Center: Controls */}
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

        {/* Right: Total Pages */}
        <div className="text-lg font-medium whitespace-nowrap">
          Total: <span className="font-bold text-blue-600 dark:text-blue-400">{pageCount}</span>
        </div>
      </div>

      {/* Pages Render Viewport (The box that actually scrolls) */}
      <div 
        className="w-full max-w-[1000px] h-[80vh] overflow-y-auto bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800"
        onScroll={handleScroll}
      >
        {/* Pages Canvas (The invisible tall box that forces the scrollbar) */}
        <div 
          className="w-full flex flex-col items-center gap-[32px] px-4 relative"
          style={{ height: pageCount > 10 ? `${height}px` : 'auto' }}
        >
          {/* Pages */}
          {pageCount <= 10 ? Array.from({ length: pageCount }).map((_, index) => (
            <div 
              key={index} 
              contentEditable={true} 
              dangerouslySetInnerHTML={{ __html: "Page: "+(index+1).toString() }} 
              className="bg-white border border-zinc-300 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black" 
            >
            </div>
          )) : Array.from(
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
                // This forcefully pushes the unmounted div DOWN the page exactly where it belongs
                transform: `translateY(${actualPageIndex * 732}px)`,
              }}
              className="bg-white border border-zinc-300 p-8 w-full m9ax-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black" 
            ></div>
          ))}
          {/* No Pages found */}
          {pageCount === 0 && (
            <p className="text-zinc-500 italic mt-10">No pages yet. Create some above!</p>
          )}
        </div>
      </div>
    </div>
  );
}
