'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useScrollFpsTracker } from '../../hooks/usePerformanceMonitor';
import { useDocumentStore } from '../../state/documentStore';

interface DebugHUDProps {
  startIndex: number;
  visiblePageCount: number;
  pageCount: number;
}

export function DebugHUD({ startIndex, visiblePageCount, pageCount }: DebugHUDProps) {
  const { onScrollActivity, getFps } = useScrollFpsTracker();
  const [fps, setFps] = useState(0);
  const [renderSnapshot, setRenderSnapshot] = useState({ total: 0 });

  // Poll FPS display at 4Hz
  useEffect(() => {
    const id = setInterval(() => {
      setFps(getFps());
      const annKeys = Object.keys(useDocumentStore.getState().annotations);
      let total = 0;
      for (const k of annKeys) {
        total += useDocumentStore.getState().annotations[Number(k)]?.length ?? 0;
      }
      setRenderSnapshot({ total });
    }, 250);
    return () => clearInterval(id);
  }, [getFps]);

  // Expose scroll activity tracker to parent
  useEffect(() => {
    const handler = () => onScrollActivity();
    window.addEventListener('wheel', handler, { passive: true });
    window.addEventListener('pointermove', handler, { passive: true });
    return () => {
      window.removeEventListener('wheel', handler);
      window.removeEventListener('pointermove', handler);
    };
  }, [onScrollActivity]);

  const endIndex = Math.min(startIndex + visiblePageCount, pageCount);

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/90 text-green-400 font-mono text-xs p-3 rounded-lg border border-green-500/30 shadow-xl min-w-[200px] space-y-1">
      <div className="text-green-300 font-bold mb-1">Debug HUD</div>
      <div>Scroll FPS: <span className={fps > 30 ? 'text-green-400' : 'text-red-400'}>{fps}</span></div>
      <div>Visible range: {startIndex}–{endIndex} of {pageCount}</div>
      <div>DOM nodes: {Math.min(visiblePageCount, pageCount - startIndex)}</div>
      <div>Annotations: {renderSnapshot.total}</div>
    </div>
  );
}
