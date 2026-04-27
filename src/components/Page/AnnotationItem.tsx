import React from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { Annotation } from '../../types';

interface AnnotationItemProps {
  annotation: Annotation;
  pageIndex: number;
}

export const AnnotationItem = React.memo(({ annotation, pageIndex }: AnnotationItemProps) => {
  const selectedAnnotationId = useDocumentStore(state => state.selectedAnnotationId);
  const setSelectedAnnotationId = useDocumentStore(state => state.setSelectedAnnotationId);
  const deleteAnnotation = useDocumentStore(state => state.deleteAnnotation);
  const updateAnnotationContent = useDocumentStore(state => state.updateAnnotationContent);

  const ann = annotation;
  const isSelected = selectedAnnotationId === ann.id;
  const isSyncing = ann.status === 'syncing';

  return (
    <React.Fragment>
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
          className={`absolute z-50 bg-zinc-900 border border-zinc-700 shadow-xl rounded-lg p-2 transform -translate-x-1/2 min-w-[200px] ${
            ann.y < 0.18 ? 'translate-y-2' : '-translate-y-[120%]'
          }`}
          style={{
            left: `${(ann.x + ann.width / 2) * 100}%`,
            top: ann.y < 0.18
              ? `${(ann.y + ann.height) * 100}%`
              : `${ann.y * 100}%`,
            pointerEvents: 'auto'
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {ann.content && (
            <div className="text-white text-xs px-1 pb-1.5 mb-1.5 border-b border-zinc-700 break-words">
              {ann.content}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
              defaultValue={ann.content ?? ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    updateAnnotationContent(pageIndex, ann.id, val);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
                if (e.key === 'Escape') {
                  setSelectedAnnotationId(null);
                }
              }}
            />
            <button
              onClick={() => deleteAnnotation(pageIndex, ann.id)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-1.5 rounded transition-colors shrink-0"
              title="Delete Annotation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
});

AnnotationItem.displayName = 'AnnotationItem';
