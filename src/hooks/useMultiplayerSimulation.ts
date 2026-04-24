import { useEffect } from 'react';
import { useDocumentStore } from '../state/documentStore';

const GHOST_ID = 'ghost-user-007';
const GHOST_NAME = 'BalrajTheGhost';
const TARGET_PAGE = 0; // Simulate all ghost activity on Page 1 for visibility

export function useMultiplayerSimulation(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    let cursorX = 0.5;
    let cursorY = 0.5;
    let moveInterval: NodeJS.Timeout;
    let drawInterval: NodeJS.Timeout;
    let deleteInterval: NodeJS.Timeout;

    // SIMULATED WEBSOCKET: 60FPS Cursor Movement
    moveInterval = setInterval(() => {
      // Random walk algorithm
      cursorX = Math.max(0, Math.min(1, cursorX + (Math.random() - 0.5) * 0.05));
      cursorY = Math.max(0, Math.min(1, cursorY + (Math.random() - 0.5) * 0.05));

      useDocumentStore.getState().updateGhostCursor(TARGET_PAGE, {
        id: GHOST_ID,
        name: GHOST_NAME,
        color: '#e83e8c', // Pink cursor
        x: cursorX,
        y: cursorY
      });
    }, 100); // 10 ticks a second

    // SIMULATED WEBSOCKET: Random Annotation Creation (Every 4 seconds)
    drawInterval = setInterval(() => {
      useDocumentStore.getState().addAnnotation(TARGET_PAGE, {
        id: `ghost-box-${Date.now()}`,
        type: 'highlight',
        x: cursorX,
        y: cursorY,
        width: 0.2 + (Math.random() * 0.2), // Random width (20-40%)
        height: 0.1 + (Math.random() * 0.1), // Random height (10-20%)
        color: 'rgba(232, 62, 140, 0.4)', // Pink box
        status: 'syncing'
      });
    }, 4000);

    // SIMULATED WEBSOCKET: Random Deletion of our own boxes (Every 10 seconds)
    deleteInterval = setInterval(() => {
      const state = useDocumentStore.getState();
      const pageAnnotations = state.annotations[TARGET_PAGE] || [];
      const ghostBoxes = pageAnnotations.filter(a => a.id.startsWith('ghost-box'));
      
      if (ghostBoxes.length > 0) {
        // Delete a random ghost box
        const targetToDelete = ghostBoxes[Math.floor(Math.random() * ghostBoxes.length)].id;
        state.deleteAnnotation(TARGET_PAGE, targetToDelete);
      }
    }, 10000);

    return () => {
      clearInterval(moveInterval);
      clearInterval(drawInterval);
      clearInterval(deleteInterval);
    };
  }, [isActive]);
}
