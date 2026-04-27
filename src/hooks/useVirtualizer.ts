import { useState, useRef, useEffect, useCallback } from "react";
import { useDocumentStore } from '../state/documentStore';
import { PAGE_HEIGHT, PAGE_GAP, OVERSCAN } from '../constants';

interface UseVirtualizerProps {
  pageCount: number;
  itemHeight: number;
}

export function useVirtualizer({ pageCount, itemHeight }: UseVirtualizerProps) {
  const [exactIndex, setExactIndex] = useState<number>(0);
  const [virtualScrollTop, setVirtualScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(800);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartY = useRef<number>(0);
  const dragStartScrollTop = useRef<number>(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      setViewportHeight(viewportRef.current.clientHeight);
    }
  }, [pageCount]);

  const theoreticalTotalHeight = pageCount > 0 ? (pageCount * PAGE_HEIGHT) + ((pageCount - 1) * PAGE_GAP) : 0;
  const maxPossibleScroll = Math.max(0, theoreticalTotalHeight - viewportHeight);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (useDocumentStore.getState().selectedAnnotationId) {
      useDocumentStore.getState().setSelectedAnnotationId(null);
    }

    if (pageCount === 0 || theoreticalTotalHeight <= viewportHeight) return;
    
    let deltaY = e.deltaY;
    if (e.deltaMode === 1) deltaY *= 33; 
    else if (e.deltaMode === 2) deltaY *= viewportHeight;

    setVirtualScrollTop((prev) => {
      const newScroll = prev + deltaY;
      const clampedScroll = Math.max(0, Math.min(newScroll, maxPossibleScroll));
      
      const newExactIndex = Math.floor(clampedScroll / itemHeight);
      setExactIndex(prevIndex => prevIndex !== newExactIndex ? newExactIndex : prevIndex);
      
      return clampedScroll;
    });
  }, [pageCount, theoreticalTotalHeight, viewportHeight, maxPossibleScroll, itemHeight]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = virtualScrollTop;
    document.body.style.userSelect = "none";
  }, [virtualScrollTop]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const physicalDeltaY = e.clientY - dragStartY.current;
      
      const thumbHeight = Math.max(40, (viewportHeight / theoreticalTotalHeight) * viewportHeight);
      const scrollablePixels = theoreticalTotalHeight - viewportHeight;
      const availableTrackSpace = viewportHeight - thumbHeight;
      
      const scrollRatio = availableTrackSpace > 0 ? scrollablePixels / availableTrackSpace : 0;
      const theoreticalDelta = physicalDeltaY * scrollRatio;
      
      const newScroll = dragStartScrollTop.current + theoreticalDelta;
      const clampedScroll = Math.max(0, Math.min(newScroll, maxPossibleScroll));
      
      setVirtualScrollTop(clampedScroll);
      
      const newExactIndex = Math.floor(clampedScroll / itemHeight);
      setExactIndex((prevIndex) => prevIndex !== newExactIndex ? newExactIndex : prevIndex);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, viewportHeight, theoreticalTotalHeight, maxPossibleScroll, itemHeight]);

  const thumbHeight = theoreticalTotalHeight > 0 
    ? Math.max(40, (viewportHeight / theoreticalTotalHeight) * viewportHeight)
    : 0;
  const thumbY = maxPossibleScroll > 0 
    ? (virtualScrollTop / maxPossibleScroll) * (viewportHeight - thumbHeight)
    : 0;

  // OVERSCAN MATH
  // Shift the array start computationally backwards by the overscan amount.
  const startIndex = Math.max(0, exactIndex - OVERSCAN);
  
  // Calculate how many items physically fit + the hidden mathematical buffers
  const visibleItemCapacity = viewportHeight > 0 
    ? Math.ceil(viewportHeight / itemHeight) 
    : 10;
  const visiblePageCount = visibleItemCapacity + (OVERSCAN * 2);

  return {
    viewportRef,
    handleWheel,
    handlePointerDown,
    isDragging,
    thumbHeight,
    thumbY,
    virtualScrollTop,
    startIndex, // Math buffer start (e.g. 7 instead of 9)
    visiblePageCount, // e.g. 14 items total
    theoreticalTotalHeight,
    viewportHeight
  };
}
