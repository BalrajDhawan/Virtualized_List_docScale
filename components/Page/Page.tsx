import React from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { useAnnotation } from '../../hooks/useAnnotation';

interface PageProps {
  index: number;
  translateY: number;
}

export const Page = React.memo(({ index, translateY }: PageProps) => {
  // ATOMIC SUBSCRIPTION
  const annotations = useDocumentStore(state => state.annotations[index] || []);
  const addAnnotation = useDocumentStore(state => state.addAnnotation);
  const deleteAnnotation = useDocumentStore(state => state.deleteAnnotation);
  const selectedAnnotationId = useDocumentStore(state => state.selectedAnnotationId);
  const setSelectedAnnotationId = useDocumentStore(state => state.setSelectedAnnotationId);

  // Hook handles transient 60fps drawing state and percentage math calculations
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
      <p className="select-none pointer-events-none">Page: {(index + 1).toString()}</p>
      
      {/* RENDER SAVED & SYNCING ANNOTATIONS */}
      {annotations.map((ann) => {
        const isSelected = selectedAnnotationId === ann.id;
        const isSyncing = ann.status === 'syncing';

        return (
          <React.Fragment key={ann.id}>
            {/* The Bounding Box */}
            <div 
              onPointerDown={(e) => {
                // Prevent creating a new box when clicking an existing one!
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
                // Make pointer events active so we can click them
                pointerEvents: 'auto' 
              }}
            >
              {isSyncing && (
                <div className="absolute top-1 right-1">
                  <div className="w-3 h-3 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>

            {/* The POPOVER (Only renders if this specific box is selected) */}
            {isSelected && !isSyncing && (
              <div 
                className="absolute z-50 bg-zinc-900 border border-zinc-700 shadow-xl rounded-md p-2 flex items-center gap-2 transform -translate-x-1/2 -translate-y-[120%]"
                style={{
                  left: `${(ann.x + ann.width / 2) * 100}%`,
                  top: `${ann.y * 100}%`,
                  // Stop pointer events from bleeding through
                  pointerEvents: 'auto' 
                }}
                onPointerDown={(e) => e.stopPropagation()} // Stop drawing when clicking menu
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

      {/* RENDER TRANSIENT DRAWING BOX (Temporary) */}
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
    </div>
  );
});

Page.displayName = 'Page';
