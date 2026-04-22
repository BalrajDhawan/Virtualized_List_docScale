import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { useAnnotation } from '../../hooks/useAnnotation';

interface PageProps {
  index: number;
  translateY: number;
}

export const Page = React.memo(({ index, translateY }: PageProps) => {
  // PREMIUM UX POLISH: Skeleton Loader Simulation
  // When a div is recycled to a new index, we instantly show a skeleton
  // to mask the heavy CPU calculation and network payload time.
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(false); // Reset to skeleton when index updates via scrolling
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 400); // Fake a 400ms High-Res Document fetch
    
    return () => clearTimeout(timer);
  }, [index]);

  // ATOMIC SUBSCRIPTION
  const annotations = useDocumentStore(state => state.annotations[index] || []);
  const addAnnotation = useDocumentStore(state => state.addAnnotation);
  const deleteAnnotation = useDocumentStore(state => state.deleteAnnotation);
  const selectedAnnotationId = useDocumentStore(state => state.selectedAnnotationId);
  const setSelectedAnnotationId = useDocumentStore(state => state.setSelectedAnnotationId);
  const ghostCursors = useDocumentStore(state => state.ghostCursors[index] || []);

  const { pageRef, handlePointerDown, handlePointerMove, handlePointerUp, transientBox } = useAnnotation(index, addAnnotation);

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
      className="bg-white border border-zinc-300 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black cursor-crosshair overflow-hidden relative" 
    >
      {!isLoaded ? (
        <div className="w-full h-full flex flex-col gap-4 animate-pulse opacity-50">
          <div className="w-1/3 h-8 bg-zinc-200 rounded"></div>
          <div className="w-full h-4 bg-zinc-100 rounded mt-4"></div>
          <div className="w-full h-4 bg-zinc-100 rounded"></div>
          <div className="w-5/6 h-4 bg-zinc-100 rounded"></div>
          <div className="w-full h-4 bg-zinc-100 rounded mt-6"></div>
          <div className="w-4/6 h-4 bg-zinc-100 rounded"></div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 select-none pointer-events-none">Document Page {(index + 1).toString()}</h2>
          <p className="select-none pointer-events-none text-zinc-600 leading-relaxed">
            This is securely fetched heavy document content for Page {index + 1}. We are rendering it after a sophisticated skeleton pulse to ensure optimal UX perception. Notice how if you draw a bounding box annotation on this exact specific page, React.memo guarantees that absolutely nothing else on the screen stutters or re-renders!
          </p>
        </>
      )}
      
      {/* RENDER SAVED & SYNCING ANNOTATIONS */}
      {annotations.map((ann) => {
        const isSelected = selectedAnnotationId === ann.id;
        const isSyncing = ann.status === 'syncing';

        return (
          <React.Fragment key={ann.id}>
            <div 
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!isSyncing) setSelectedAnnotationId(ann.id);
              }}
              className={`absolute rounded transition-all cursor-pointer ${
                isSyncing 
                  ? 'border-2 border-dashed border-yellow-500/50 bg-yellow-400/20' 
                  : 'border-2 border-solid border-yellow-500 bg-yellow-400/30 hover:bg-yellow-400/40'
              } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
              style={{
                left: `${ann.x * 100}%`,
                top: `${ann.y * 100}%`,
                width: `${ann.width * 100}%`,
                height: `${ann.height * 100}%`,
                pointerEvents: 'auto' 
              }}
            >
              {isSyncing && (
                <div className="absolute top-1 right-1">
                  <div className="w-3 h-3 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>

            {isSelected && !isSyncing && (
              <div 
                className="absolute z-50 bg-zinc-900 border border-zinc-700 shadow-xl rounded-md p-2 flex items-center gap-2 transform -translate-x-1/2 -translate-y-[120%]"
                style={{
                  left: `${(ann.x + ann.width / 2) * 100}%`,
                  top: `${ann.y * 100}%`,
                  pointerEvents: 'auto' 
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="text-white text-xs px-2 whitespace-nowrap opacity-70">
                  Comment Support Coming Soon
                </div>
                <div className="w-px h-4 bg-zinc-700 mx-1" />
                <button 
                  onClick={() => deleteAnnotation(index, ann.id)}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-1.5 rounded transition-colors"
                  title="Delete Annotation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            )}
          </React.Fragment>
        );
      })}

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
