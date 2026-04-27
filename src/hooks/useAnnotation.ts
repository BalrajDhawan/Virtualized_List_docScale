import { useState, useRef, useCallback } from 'react';
import { Annotation } from '../types';
import { uuid } from '../utils/uuid';

export function useAnnotation(pageIndex: number, addAnnotation: (pageIndex: number, annotation: Annotation) => void) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const pageRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pageRef.current) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
    setIsDrawing(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !pageRef.current) return;

    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPoint({ x, y });
  }, [isDrawing]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !pageRef.current) return;

    setIsDrawing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const rect = pageRef.current.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // Use endX/endY consistently for all four dimensions
    const physicalLeft = Math.min(startPoint.x, endX);
    const physicalTop = Math.min(startPoint.y, endY);
    const physicalWidth = Math.abs(endX - startPoint.x);
    const physicalHeight = Math.abs(endY - startPoint.y);

    if (physicalWidth < 5 || physicalHeight < 5) return;

    const newAnnotation: Annotation = {
      id: uuid(),
      type: 'highlight',
      x: physicalLeft / rect.width,
      y: physicalTop / rect.height,
      width: physicalWidth / rect.width,
      height: physicalHeight / rect.height,
      color: 'rgba(255, 235, 59, 0.4)',
      status: 'syncing'
    };

    addAnnotation(pageIndex, newAnnotation);
  }, [isDrawing, startPoint, addAnnotation, pageIndex]);

  const transientBox = isDrawing ? {
    left: Math.min(startPoint.x, currentPoint.x),
    top: Math.min(startPoint.y, currentPoint.y),
    width: Math.abs(currentPoint.x - startPoint.x),
    height: Math.abs(currentPoint.y - startPoint.y)
  } : null;

  return {
    pageRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    transientBox
  };
}
