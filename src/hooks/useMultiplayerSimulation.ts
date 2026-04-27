import { useEffect } from 'react';
import { useDocumentStore } from '../state/documentStore';

const GHOST_ID = 'ghost-user-007';
const GHOST_NAME = 'Demo User';
const TARGET_PAGE = 0; // Simulate all ghost activity on Page 1 for visibility

export function useMultiplayerSimulation(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    let cursorX = 0.5;
    let cursorY = 0.5;
    let moveInterval: NodeJS.Timeout;
    let drawInterval: NodeJS.Timeout;
    let deleteInterval: NodeJS.Timeout;

    // 10Hz position writes with CSS transition interpolation for smooth rendering
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
      const w = 0.2 + (Math.random() * 0.2);
      const h = 0.1 + (Math.random() * 0.1);
      const x = Math.min(cursorX, 1 - w); // Clamp so x + width <= 1
      const y = Math.min(cursorY, 1 - h); // Clamp so y + height <= 1

      useDocumentStore.getState().addAnnotation(TARGET_PAGE, {
        id: `ghost-box-${Date.now()}`,
        type: 'highlight',
        x,
        y,
        width: w,
        height: h,
        color: 'rgba(232, 62, 140, 0.4)',
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
