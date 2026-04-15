import { create } from 'zustand';
import { Annotation } from '../types';

interface DocumentState {
  annotations: Record<number, Annotation[]>;
  addAnnotation: (pageIndex: number, annotation: Annotation) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  annotations: {},
  
  addAnnotation: (pageIndex, annotation) => set((state) => {
    const existingAnnotations = state.annotations[pageIndex] || [];
    return {
      annotations: {
        ...state.annotations,
        [pageIndex]: [...existingAnnotations, annotation]
      }
    };
  })
}));
