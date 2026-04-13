import { useState, useRef, useEffect, useCallback } from "react";

interface UseVirtualizerProps {
  pageCount: number;
  itemHeight: number;
}

export function useVirtualizer({ pageCount, itemHeight }: UseVirtualizerProps) {
  const [startIndex, setStartIndex] = useState<number>(0);
  const [virtualScrollTop, setVirtualScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(800);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartY = useRef<number>(0);
  const dragStartScrollTop = useRef<number>(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Measure the viewport on mount or when pageCount changes (e.g. initial load)
  useEffect(() => {
    if (viewportRef.current) {
      setViewportHeight(viewportRef.current.clientHeight);
    }
  }, [pageCount]);

  // Standard geometry math
  const theoreticalTotalHeight = pageCount > 0 ? (pageCount * 700) + ((pageCount - 1) * 32) : 0;
  const maxPossibleScroll = Math.max(0, theoreticalTotalHeight - viewportHeight);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (pageCount === 0 || theoreticalTotalHeight <= viewportHeight) return;
    
    // Unify mouse wheel speeds across Chrome/Firefox/Windows/Mac
    let deltaY = e.deltaY;
    if (e.deltaMode === 1) deltaY *= 33; 
    else if (e.deltaMode === 2) deltaY *= viewportHeight;

    setVirtualScrollTop((prev) => {
      const newScroll = prev + deltaY;
      const clampedScroll = Math.max(0, Math.min(newScroll, maxPossibleScroll));
      
      const newStartIndex = Math.floor(clampedScroll / itemHeight);
      setStartIndex((prevIndex) => prevIndex !== newStartIndex ? newStartIndex : prevIndex);
      
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
      
      const newStartIndex = Math.floor(clampedScroll / itemHeight);
      setStartIndex((prevIndex) => prevIndex !== newStartIndex ? newStartIndex : prevIndex);
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

  return {
    viewportRef,
    handleWheel,
    handlePointerDown,
    isDragging,
    thumbHeight,
    thumbY,
    virtualScrollTop,
    startIndex,
    theoreticalTotalHeight,
    viewportHeight
  };
}
