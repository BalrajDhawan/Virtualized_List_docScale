import React from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { useAnnotation } from '../../hooks/useAnnotation';

interface PageProps {
  index: number;
  translateY: number;
}

export const Page = React.memo(({ index, translateY }: PageProps) => {
  // ATOMIC SUBSCRIPTION: Only re-renders this specific Page if ITS annotations array changes
  const annotations = useDocumentStore(state => state.annotations[index] || []);
  const addAnnotation = useDocumentStore(state => state.addAnnotation);

  // Hook handles transient 60fps drawing state and percentage math calculations
  const { pageRef, handlePointerDown, handlePointerMove, handlePointerUp, transientBox } = useAnnotation(index, addAnnotation);

  return (
    <div 
      ref={pageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      // ContentEditable natively eats pointer events, we disable it locally here so we can draw over the page freely 
      // without triggering text selection. In a real app we might toggle this with an "Annotation Mode" button!
      contentEditable={false} 
      suppressContentEditableWarning={true}
      style={{
        position: 'absolute',
        top: 0,
        transform: `translateY(${translateY}px)`,
        // We set touch-action to none so mobile scroll doesn't fire while drawing
        touchAction: 'none'
      }}
      className="bg-white border border-zinc-300 p-8 w-full max-w-[800px] h-[700px] shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 rounded transition-shadow text-black cursor-crosshair overflow-hidden relative" 
    >
      <p className="select-none pointer-events-none">Page: {(index + 1).toString()}</p>
      
      {/* RENDER SAVED ANNOTATIONS (Permanent) */}
      {annotations.map((ann) => (
        <div 
          key={ann.id}
          className="absolute border-2 border-yellow-500 bg-yellow-400/30 rounded pointer-events-none"
          style={{
            left: `${ann.x * 100}%`,
            top: `${ann.y * 100}%`,
            width: `${ann.width * 100}%`,
            height: `${ann.height * 100}%`,
          }}
        />
      ))}

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
