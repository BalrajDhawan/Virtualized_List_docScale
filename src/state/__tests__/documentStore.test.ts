import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useDocumentStore } from '../documentStore';

describe('documentStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store to initial state
    useDocumentStore.setState({
      annotations: {},
      selectedAnnotationId: null,
      ghostCursors: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addAnnotation', () => {
    it('adds annotation to the correct page', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1',
        type: 'highlight',
        x: 0.1, y: 0.2, width: 0.3, height: 0.1,
        status: 'syncing',
      });

      const annotations = useDocumentStore.getState().annotations[0];
      expect(annotations).toHaveLength(1);
      expect(annotations![0].id).toBe('ann-1');
    });

    it('initializes annotation with syncing status', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1',
        type: 'highlight',
        x: 0.1, y: 0.2, width: 0.3, height: 0.1,
        status: 'saved', // even if passed as saved
      });

      const annotations = useDocumentStore.getState().annotations[0];
      expect(annotations![0].status).toBe('syncing');
    });

    it('transitions to saved after 1500ms', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1',
        type: 'highlight',
        x: 0.1, y: 0.2, width: 0.3, height: 0.1,
        status: 'syncing',
      });

      expect(useDocumentStore.getState().annotations[0]![0].status).toBe('syncing');

      vi.advanceTimersByTime(1500);

      expect(useDocumentStore.getState().annotations[0]![0].status).toBe('saved');
    });

    it('isolates annotations across pages', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-0', type: 'highlight',
        x: 0.1, y: 0.1, width: 0.2, height: 0.1, status: 'syncing',
      });
      useDocumentStore.getState().addAnnotation(5, {
        id: 'ann-5', type: 'comment',
        x: 0.5, y: 0.5, width: 0.1, height: 0.1, status: 'syncing',
      });

      expect(useDocumentStore.getState().annotations[0]).toHaveLength(1);
      expect(useDocumentStore.getState().annotations[5]).toHaveLength(1);
      expect(useDocumentStore.getState().annotations[0]![0].id).toBe('ann-0');
      expect(useDocumentStore.getState().annotations[5]![0].id).toBe('ann-5');
    });
  });

  describe('deleteAnnotation', () => {
    it('removes annotation from page', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1', type: 'highlight',
        x: 0.1, y: 0.2, width: 0.3, height: 0.1, status: 'syncing',
      });

      useDocumentStore.getState().deleteAnnotation(0, 'ann-1');

      expect(useDocumentStore.getState().annotations[0]).toHaveLength(0);
    });

    it('clears selectedAnnotationId if deleted annotation was selected', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1', type: 'highlight',
        x: 0.1, y: 0.2, width: 0.3, height: 0.1, status: 'syncing',
      });
      useDocumentStore.getState().setSelectedAnnotationId('ann-1');

      expect(useDocumentStore.getState().selectedAnnotationId).toBe('ann-1');

      useDocumentStore.getState().deleteAnnotation(0, 'ann-1');

      expect(useDocumentStore.getState().selectedAnnotationId).toBeNull();
    });

    it('preserves selectedAnnotationId if a different annotation is deleted', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1', type: 'highlight',
        x: 0.1, y: 0.1, width: 0.1, height: 0.1, status: 'syncing',
      });
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-2', type: 'highlight',
        x: 0.5, y: 0.5, width: 0.1, height: 0.1, status: 'syncing',
      });
      useDocumentStore.getState().setSelectedAnnotationId('ann-1');

      useDocumentStore.getState().deleteAnnotation(0, 'ann-2');

      expect(useDocumentStore.getState().selectedAnnotationId).toBe('ann-1');
    });
  });

  describe('updateGhostCursor', () => {
    it('adds a new ghost cursor', () => {
      useDocumentStore.getState().updateGhostCursor(0, {
        id: 'ghost-1', name: 'Alice', x: 0.5, y: 0.5, color: '#ff0000',
      });

      const cursors = useDocumentStore.getState().ghostCursors[0];
      expect(cursors).toHaveLength(1);
      expect(cursors![0].name).toBe('Alice');
    });

    it('updates existing cursor position by id', () => {
      useDocumentStore.getState().updateGhostCursor(0, {
        id: 'ghost-1', name: 'Alice', x: 0.5, y: 0.5, color: '#ff0000',
      });
      useDocumentStore.getState().updateGhostCursor(0, {
        id: 'ghost-1', name: 'Alice', x: 0.8, y: 0.9, color: '#ff0000',
      });

      const cursors = useDocumentStore.getState().ghostCursors[0];
      expect(cursors).toHaveLength(1);
      expect(cursors![0].x).toBe(0.8);
      expect(cursors![0].y).toBe(0.9);
    });

    it('isolates cursors across pages', () => {
      useDocumentStore.getState().updateGhostCursor(0, {
        id: 'ghost-1', name: 'Alice', x: 0.1, y: 0.1, color: '#ff0000',
      });
      useDocumentStore.getState().updateGhostCursor(3, {
        id: 'ghost-2', name: 'Bob', x: 0.9, y: 0.9, color: '#0000ff',
      });

      expect(useDocumentStore.getState().ghostCursors[0]).toHaveLength(1);
      expect(useDocumentStore.getState().ghostCursors[3]).toHaveLength(1);
    });
  });

  describe('setSelectedAnnotationId', () => {
    it('sets and clears selection', () => {
      useDocumentStore.getState().setSelectedAnnotationId('ann-1');
      expect(useDocumentStore.getState().selectedAnnotationId).toBe('ann-1');

      useDocumentStore.getState().setSelectedAnnotationId(null);
      expect(useDocumentStore.getState().selectedAnnotationId).toBeNull();
    });
  });

  describe('updateAnnotationContent (type transitions)', () => {
    it('transitions type from highlight to comment when content is set', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1', type: 'highlight',
        x: 0.1, y: 0.1, width: 0.1, height: 0.1, status: 'syncing',
      });

      useDocumentStore.getState().updateAnnotationContent(0, 'ann-1', 'Hello');

      const ann = useDocumentStore.getState().annotations[0]![0];
      expect(ann.type).toBe('comment');
      expect(ann.content).toBe('Hello');
    });

    it('transitions type back to highlight when content is cleared', () => {
      useDocumentStore.getState().addAnnotation(0, {
        id: 'ann-1', type: 'highlight',
        x: 0.1, y: 0.1, width: 0.1, height: 0.1, status: 'syncing',
      });
      useDocumentStore.getState().updateAnnotationContent(0, 'ann-1', 'Note');
      expect(useDocumentStore.getState().annotations[0]![0].type).toBe('comment');

      useDocumentStore.getState().updateAnnotationContent(0, 'ann-1', '');
      expect(useDocumentStore.getState().annotations[0]![0].type).toBe('highlight');
    });
  });
});
