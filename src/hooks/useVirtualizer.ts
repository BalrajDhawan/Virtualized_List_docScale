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
  const lastScrollTop = useRef<number>(0);
  const lastScrollTime = useRef<number>(performance.now());
  const [scrollVelocity, setScrollVelocity] = useState<number>(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    setViewportHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const theoreticalTotalHeight = pageCount > 0 ? (pageCount * PAGE_HEIGHT) + ((pageCount - 1) * PAGE_GAP) : 0;
  const maxPossibleScroll = Math.max(0, theoreticalTotalHeight - viewportHeight);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (pageCount === 0 || theoreticalTotalHeight <= viewportHeight) return;
    e.preventDefault();

    let deltaY = e.deltaY;
    if (e.deltaMode === 1) deltaY *= 33;
    else if (e.deltaMode === 2) deltaY *= viewportHeight;

    setVirtualScrollTop((prev) => {
      const newScroll = prev + deltaY;
      const clampedScroll = Math.max(0, Math.min(newScroll, maxPossibleScroll));

      // Only clear selection if scroll actually moved meaningfully
      if (Math.abs(clampedScroll - prev) > 2) {
        if (useDocumentStore.getState().selectedAnnotationId) {
          useDocumentStore.getState().setSelectedAnnotationId(null);
        }
      }

      // Track scroll velocity for skeleton triggering
      const now = performance.now();
      const dt = now - lastScrollTime.current;
      if (dt > 0) {
        const velocity = Math.abs(clampedScroll - lastScrollTop.current) / dt * 1000;
        setScrollVelocity(velocity);
      }
      lastScrollTop.current = clampedScroll;
      lastScrollTime.current = now;

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

  // Shared scroll helper for keyboard/touch/wheel
  const scrollBy = useCallback((delta: number) => {
    setVirtualScrollTop((prev) => {
      const clampedScroll = Math.max(0, Math.min(prev + delta, maxPossibleScroll));
      if (Math.abs(clampedScroll - prev) > 2) {
        if (useDocumentStore.getState().selectedAnnotationId) {
          useDocumentStore.getState().setSelectedAnnotationId(null);
        }
      }
      const newExactIndex = Math.floor(clampedScroll / itemHeight);
      setExactIndex(prevIndex => prevIndex !== newExactIndex ? newExactIndex : prevIndex);
      return clampedScroll;
    });
  }, [maxPossibleScroll, itemHeight]);

  const scrollTo = useCallback((position: number) => {
    const clamped = Math.max(0, Math.min(position, maxPossibleScroll));
    setVirtualScrollTop(clamped);
    const newExactIndex = Math.floor(clamped / itemHeight);
    setExactIndex(newExactIndex);
  }, [maxPossibleScroll, itemHeight]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const LINE = 60;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); scrollBy(LINE); break;
      case 'ArrowUp':   e.preventDefault(); scrollBy(-LINE); break;
      case 'PageDown':  e.preventDefault(); scrollBy(viewportHeight); break;
      case 'PageUp':    e.preventDefault(); scrollBy(-viewportHeight); break;
      case 'Home':      e.preventDefault(); scrollTo(0); break;
      case 'End':       e.preventDefault(); scrollTo(maxPossibleScroll); break;
    }
  }, [scrollBy, scrollTo, viewportHeight, maxPossibleScroll]);

  // Touch-drag scrolling on viewport
  const touchStartY = useRef<number>(0);
  const touchStartScroll = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartScroll.current = virtualScrollTop;
  }, [virtualScrollTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const deltaY = touchStartY.current - e.touches[0].clientY;
    const newScroll = Math.max(0, Math.min(touchStartScroll.current + deltaY, maxPossibleScroll));
    setVirtualScrollTop(newScroll);
    const newExactIndex = Math.floor(newScroll / itemHeight);
    setExactIndex(prevIndex => prevIndex !== newExactIndex ? newExactIndex : prevIndex);
  }, [maxPossibleScroll, itemHeight]);

  // Attach all non-passive listeners
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('keydown', handleKeyDown);
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('keydown', handleKeyDown);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleKeyDown, handleTouchStart, handleTouchMove]);

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

  const scrollPercent = maxPossibleScroll > 0 ? virtualScrollTop / maxPossibleScroll : 0;

  return {
    viewportRef,
    handlePointerDown,
    isDragging,
    thumbHeight,
    thumbY,
    virtualScrollTop,
    scrollVelocity,
    scrollPercent,
    startIndex,
    visiblePageCount,
    theoreticalTotalHeight,
    viewportHeight
  };
}
