import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { useAnnotation } from '../../hooks/useAnnotation';
import { AnnotationItem } from './AnnotationItem';
import { Annotation, GhostCursor } from '../../types';

const EMPTY_ANNOTATIONS: Annotation[] = [];
const EMPTY_CURSORS: GhostCursor[] = [];

interface PageProps {
  index: number;
  translateY: number;
  scrollVelocity?: number;
}

export const Page = React.memo(({ index, translateY, scrollVelocity = 0 }: PageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Show skeleton only when recycled during fast scroll
  useEffect(() => {
    if (Math.abs(scrollVelocity) > 500) {
      setIsLoaded(false);
      const timer = setTimeout(() => setIsLoaded(true), 300);
      return () => clearTimeout(timer);
    }
    setIsLoaded(true);
  }, [index, scrollVelocity]);

  // ATOMIC SUBSCRIPTION — stable empty fallbacks prevent spurious re-renders
  const annotations = useDocumentStore(state => state.annotations[index] ?? EMPTY_ANNOTATIONS);
  const addAnnotation = useDocumentStore(state => state.addAnnotation);
  const setSelectedAnnotationId = useDocumentStore(state => state.setSelectedAnnotationId);
  const ghostCursors = useDocumentStore(state => state.ghostCursors[index] ?? EMPTY_CURSORS);

  const { pageRef, handlePointerDown: startDraw, handlePointerMove, handlePointerUp, transientBox } = useAnnotation(index, addAnnotation);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setSelectedAnnotationId(null);
    startDraw(e);
  };

  return (
    <div
      ref={pageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      contentEditable={false}
      suppressContentEditableWarning={true}
      style={{
        position: 'absolute',
        top: 0,
        transform: `translateY(${translateY}px)`,
        touchAction: 'none'
      }}
      className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black dark:text-zinc-100 cursor-crosshair overflow-hidden relative"
    >
      {!isLoaded ? (
        <div className="w-full h-full flex flex-col gap-4 animate-pulse opacity-50">
          <div className="w-1/3 h-8 bg-zinc-200 dark:bg-zinc-700 rounded"></div>
          <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded mt-4"></div>
          <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-5/6 h-4 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
          <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded mt-6"></div>
          <div className="w-4/6 h-4 bg-zinc-100 dark:bg-zinc-800 rounded"></div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 select-none pointer-events-none">Document Page {(index + 1).toString()}</h2>
          <p className="select-none pointer-events-none text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </>
      )}

      {annotations.map((ann) => (
        <AnnotationItem key={ann.id} annotation={ann} pageIndex={index} />
      ))}

      {transientBox && (
        <div
          className="absolute border-2 border-yellow-500 bg-yellow-400/50 rounded pointer-events-none"
          style={{
            left: `${transientBox.left}px`,
            top: `${transientBox.top}px`,
            width: `${transientBox.width}px`,
            height: `${transientBox.height}px`,
          }}
        />
      )}

      {ghostCursors.map((cursor) => (
        <div
          key={cursor.id}
          className="absolute pointer-events-none z-50 flex items-center justify-center transition-all duration-100 ease-linear"
          style={{
            left: `${cursor.x * 100}%`,
            top: `${cursor.y * 100}%`
          }}
        >
          <div style={{ color: cursor.color }} className="relative drop-shadow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.5 3.21L15.36 21.05C15.54 21.36 15.93 21.46 16.24 21.28C16.38 21.19 16.48 21.07 16.53 20.91L18.72 13.79L23.75 11.75C24.08 11.62 24.23 11.25 24.1 10.92C24.03 10.76 23.91 10.63 23.75 10.55L6.03 2.11C5.7 1.95 5.3 2.08 5.14 2.4C5.07 2.54 5.04 2.7 5.05 2.85L5.5 3.21Z"/>
            </svg>
            <div
              className="absolute left-6 top-6 px-2 py-0.5 rounded text-xs text-white font-bold whitespace-nowrap shadow"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

Page.displayName = 'Page';
