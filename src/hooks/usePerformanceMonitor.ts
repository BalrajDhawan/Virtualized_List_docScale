import { useRef, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  scrollFps: number;
}

export function usePerformanceMonitor(label: string) {
  const metrics = useRef<PerformanceMetrics>({
    renderCount: 0,
    scrollFps: 0,
  });

  const frameTimestamps = useRef<number[]>([]);

  // Increment in useEffect so StrictMode double-renders and discarded
  // concurrent renders are not counted — only committed renders tally.
  useEffect(() => {
    metrics.current.renderCount += 1;
  });

  const trackScrollFrame = useCallback(() => {
    const now = performance.now();
    frameTimestamps.current.push(now);
    const cutoff = now - 1000;
    frameTimestamps.current = frameTimestamps.current.filter(t => t > cutoff);
    metrics.current.scrollFps = frameTimestamps.current.length;
  }, []);

  const getMetrics = useCallback(() => ({
    label,
    renderCount: metrics.current.renderCount,
    scrollFps: metrics.current.scrollFps,
  }), [label]);

  const resetRenderCount = useCallback(() => {
    metrics.current.renderCount = 0;
  }, []);

  return { trackScrollFrame, getMetrics, resetRenderCount };
}

export function useScrollFpsTracker() {
  const fpsRef = useRef(0);
  const frameTimestamps = useRef<number[]>([]);
  const rafId = useRef<number>(0);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onScrollActivity = useCallback(() => {
    isScrolling.current = true;

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 200);

    if (!rafId.current) {
      const measure = () => {
        if (!isScrolling.current) {
          rafId.current = 0;
          return;
        }
        const now = performance.now();
        frameTimestamps.current.push(now);
        const cutoff = now - 1000;
        frameTimestamps.current = frameTimestamps.current.filter(t => t > cutoff);
        fpsRef.current = frameTimestamps.current.length;
        rafId.current = requestAnimationFrame(measure);
      };
      rafId.current = requestAnimationFrame(measure);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const getFps = useCallback(() => fpsRef.current, []);

  return { onScrollActivity, getFps };
}
