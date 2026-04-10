"use client";

import React, { useState, useRef } from "react";

export default function Home() {
  const [pageCount, setPageCount] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>("");
  const [startIndex, setStartIndex] = useState<number>(0);
  const [virtualOffset, setVirtualOffset] = useState<number>(0);
  const [debugActualScroll, setDebugActualScroll] = useState<number>(0);
  const viewportRef = useRef<HTMLDivElement>(null);

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
    const actualScrollTop = e.currentTarget.scrollTop;
    setDebugActualScroll(actualScrollTop);

    // Treadmill Teleportation Physics Constraints
    const LIMIT_DOWN = 40000;
    const LIMIT_UP = 5000;
    const JUMP_DISTANCE = 30000;

    let currentVirtualOffset = virtualOffset;
    let newActualScrollTop = actualScrollTop;

    const theoreticalTotalHeight = pageCount > 0 ? (pageCount * 700) + ((pageCount - 1) * 32) : 0;

    // Jump Logic!
    if (actualScrollTop > LIMIT_DOWN && (theoreticalTotalHeight - currentVirtualOffset) > 50000) {
      if (viewportRef.current) {
        newActualScrollTop = actualScrollTop - JUMP_DISTANCE;
        viewportRef.current.scrollTop = newActualScrollTop; // Forcing teleport physically
        currentVirtualOffset += JUMP_DISTANCE;
        setVirtualOffset(currentVirtualOffset);
      }
    } else if (actualScrollTop < LIMIT_UP && currentVirtualOffset > 0) {
      if (viewportRef.current) {
        newActualScrollTop = actualScrollTop + JUMP_DISTANCE;
        viewportRef.current.scrollTop = newActualScrollTop; // Forcing teleport physically
        currentVirtualOffset -= JUMP_DISTANCE;
        setVirtualOffset(currentVirtualOffset);
      }
    }

    const theoreticalScrollTop = newActualScrollTop + currentVirtualOffset;
    const itemHeight = 732; // 700px height + 32px gap
    const newStartIndex = Math.floor(theoreticalScrollTop / itemHeight);
    
    // Automatic Throttle Bailout
    setStartIndex((prev) => {
      if (prev !== newStartIndex) {
        return newStartIndex;
      }
      return prev;
    });
  };

  const theoreticalTotalHeight = pageCount > 0 ? (pageCount * 700) + ((pageCount - 1) * 32) : 0;
  // This physically crushes the massive container to legally be no larger than 50K max height
  const physicalCanvasHeight = Math.max(0, Math.min(50000, theoreticalTotalHeight - virtualOffset));

  return (
    <div 
      className="flex flex-col flex-1 items-center justify-start min-h-screen py-5 bg-zinc-100 font-sans dark:bg-zinc-900 dark:text-zinc-100 relative"
      >
      {/* Floating Diagnostics UI */}
      <div className="fixed top-4 right-4 bg-black/90 text-green-400 p-5 rounded-lg border-2 border-green-500 font-mono text-sm shadow-[0_0_15px_rgba(34,197,94,0.3)] z-50 pointer-events-none min-w-[280px]">
        <div className="font-bold text-base text-center border-b border-green-500/50 pb-2 mb-3 tracking-widest text-green-300">TREADMILL ACTIVE</div>
        <div className="flex justify-between"><span>Native Scroll:</span> <span>{Math.round(debugActualScroll)}px</span></div>
        <div className="flex justify-between"><span>Virtual Offset:</span> <span className="text-pink-400">{virtualOffset}px</span></div>
        <div className="flex justify-between font-bold text-white border-t border-green-500/30 mt-2 pt-2"><span>Theoretical:</span> <span>{Math.round(debugActualScroll + virtualOffset)}px</span></div>
        <div className="flex justify-between text-zinc-400 mt-2 text-xs"><span>Canvas Limit:</span> <span>{Math.round(physicalCanvasHeight)}px (Max 50K)</span></div>
      </div>

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
        ref={viewportRef}
        className="w-full max-w-[1000px] h-[80vh] overflow-y-auto bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800"
        onScroll={handleScroll}
      >
        {/* Pages Canvas (The invisible tall box that forces the scrollbar) */}
        <div 
          className="w-full flex flex-col items-center gap-[32px] px-4 relative"
          style={{ height: `${physicalCanvasHeight}px` }}
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
                // The physical placement of the div dynamically adjusts based on the current Virtual Offset
                // so the user does NOT see the elements shift when the treadmill teleport jump occurs
                transform: `translateY(${(actualPageIndex * 732) - virtualOffset}px)`,
              }}
              className="bg-white border border-zinc-300 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black" 
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
