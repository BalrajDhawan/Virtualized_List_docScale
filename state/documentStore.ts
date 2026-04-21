import { create } from 'zustand';
import { Annotation } from '../types';

interface DocumentState {
  annotations: Record<number, Annotation[]>;
  selectedAnnotationId: string | null;
  
  addAnnotation: (pageIndex: number, annotation: Annotation) => void;
  deleteAnnotation: (pageIndex: number, id: string) => void;
  setSelectedAnnotationId: (id: string | null) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  annotations: {},
  selectedAnnotationId: null,

  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
  
  addAnnotation: (pageIndex, annotation) => {
    // 1. Instantly push annotation in 'syncing' status (Optimistic UI)
    set((state) => {
      const existingAnnotations = state.annotations[pageIndex] || [];
      return {
        annotations: {
          ...state.annotations,
          [pageIndex]: [...existingAnnotations, { ...annotation, status: 'syncing' }]
        }
      };
    });

    // 2. Simulate 1.5s Backend API Delay
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

  deleteAnnotation: (pageIndex, id) => set((state) => {
    const existingAnnotations = state.annotations[pageIndex] || [];
    return {
      annotations: {
        ...state.annotations,
        [pageIndex]: existingAnnotations.filter((ann) => ann.id !== id)
      },
      // Clear selection if we just deleted the selected item
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId
    };
  })
}));
