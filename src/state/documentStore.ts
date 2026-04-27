import { create } from 'zustand';
import { Annotation, GhostCursor } from '../types';

interface DocumentState {
  annotations: Record<number, Annotation[]>;
  selectedAnnotationId: string | null;
  ghostCursors: Record<number, GhostCursor[]>; // Scoped exactly to pageIndex!
  
  addAnnotation: (pageIndex: number, annotation: Annotation) => void;
  deleteAnnotation: (pageIndex: number, id: string) => void;
  updateAnnotationContent: (pageIndex: number, id: string, content: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  updateGhostCursor: (pageIndex: number, cursor: GhostCursor) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  annotations: {},
  selectedAnnotationId: null,
  ghostCursors: {},

  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
  
  updateGhostCursor: (pageIndex, cursor) => set((state) => {
    const pageCursors = state.ghostCursors[pageIndex] || [];
    const index = pageCursors.findIndex(c => c.id === cursor.id);
    
    let nextCursors = [...pageCursors];
    if (index === -1) {
      nextCursors.push(cursor);
    } else {
      nextCursors[index] = cursor;
    }

    return {
      ghostCursors: {
        ...state.ghostCursors,
        [pageIndex]: nextCursors
      }
    };
  }),

  addAnnotation: (pageIndex, annotation) => {
    set((state) => {
      const existingAnnotations = state.annotations[pageIndex] || [];
      return {
        annotations: {
          ...state.annotations,
          [pageIndex]: [...existingAnnotations, { ...annotation, status: 'syncing' }]
        }
      };
    });

    setTimeout(() => {
      set((state) => {
        const existingAnnotations = state.annotations[pageIndex] || [];
        const updatedAnnotations = existingAnnotations.map((ann) => 
          ann.id === annotation.id ? { ...ann, status: 'saved' as const } : ann
        );

        return {
          annotations: {
            ...state.annotations,
            [pageIndex]: updatedAnnotations
          }
        };
      });
    }, 1500);
  },

  updateAnnotationContent: (pageIndex, id, content) => set((state) => {
    const existing = state.annotations[pageIndex] || [];
    return {
      annotations: {
        ...state.annotations,
        [pageIndex]: existing.map((ann) =>
          ann.id === id
            ? { ...ann, content, type: content ? 'comment' as const : 'highlight' as const }
            : ann
        )
      }
    };
  }),

  deleteAnnotation: (pageIndex, id) => set((state) => {
    const existingAnnotations = state.annotations[pageIndex] || [];
    return {
      annotations: {
        ...state.annotations,
        [pageIndex]: existingAnnotations.filter((ann) => ann.id !== id)
      },
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId
    };
  })
}));
