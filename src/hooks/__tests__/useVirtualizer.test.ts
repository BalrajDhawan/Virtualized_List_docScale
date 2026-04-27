import { describe, it, expect } from 'vitest';
import { PAGE_HEIGHT, PAGE_GAP, ITEM_HEIGHT, OVERSCAN } from '../../constants';

function computeTheoreticalTotalHeight(pageCount: number): number {
  return pageCount > 0 ? (pageCount * PAGE_HEIGHT) + ((pageCount - 1) * PAGE_GAP) : 0;
}

function computeMaxPossibleScroll(totalHeight: number, viewportHeight: number): number {
  return Math.max(0, totalHeight - viewportHeight);
}

function computeStartIndex(exactIndex: number): number {
  return Math.max(0, exactIndex - OVERSCAN);
}

function computeVisiblePageCount(viewportHeight: number, itemHeight: number): number {
  const visibleItemCapacity = viewportHeight > 0
    ? Math.ceil(viewportHeight / itemHeight)
    : 10;
  return visibleItemCapacity + (OVERSCAN * 2);
}

function computeExactIndex(scrollTop: number, itemHeight: number): number {
  return Math.floor(scrollTop / itemHeight);
}

function clampScroll(newScroll: number, maxPossibleScroll: number): number {
  return Math.max(0, Math.min(newScroll, maxPossibleScroll));
}

function computeThumbHeight(viewportHeight: number, totalHeight: number): number {
  return totalHeight > 0
    ? Math.max(40, (viewportHeight / totalHeight) * viewportHeight)
    : 0;
}

function computeThumbY(scrollTop: number, maxScroll: number, viewportHeight: number, thumbHeight: number): number {
  return maxScroll > 0
    ? (scrollTop / maxScroll) * (viewportHeight - thumbHeight)
    : 0;
}

function normalizeDeltaY(deltaY: number, deltaMode: number, viewportHeight: number): number {
  if (deltaMode === 1) return deltaY * 33;
  if (deltaMode === 2) return deltaY * viewportHeight;
  return deltaY;
}

describe('useVirtualizer math', () => {
  const VIEWPORT_HEIGHT = 800;

  describe('computeTheoreticalTotalHeight', () => {
    it('returns 0 for 0 pages', () => {
      expect(computeTheoreticalTotalHeight(0)).toBe(0);
    });

    it('returns correct height for 1 page (no gap)', () => {
      expect(computeTheoreticalTotalHeight(1)).toBe(PAGE_HEIGHT);
    });

    it('returns correct height for 500 pages', () => {
      expect(computeTheoreticalTotalHeight(500)).toBe(500 * PAGE_HEIGHT + 499 * PAGE_GAP);
    });

    it('includes gaps between pages', () => {
      const twoPages = computeTheoreticalTotalHeight(2);
      const onePage = computeTheoreticalTotalHeight(1);
      expect(twoPages - onePage).toBe(PAGE_HEIGHT + PAGE_GAP);
    });
  });

  describe('computeMaxPossibleScroll', () => {
    it('returns 0 when content fits in viewport', () => {
      expect(computeMaxPossibleScroll(500, 800)).toBe(0);
    });

    it('returns difference when content exceeds viewport', () => {
      expect(computeMaxPossibleScroll(10000, 800)).toBe(9200);
    });
  });

  describe('computeStartIndex (overscan)', () => {
    it('clamps to 0 when exactIndex is less than OVERSCAN', () => {
      expect(computeStartIndex(0)).toBe(0);
      expect(computeStartIndex(1)).toBe(0);
    });

    it('subtracts OVERSCAN when exactIndex is large enough', () => {
      expect(computeStartIndex(5)).toBe(3);
      expect(computeStartIndex(10)).toBe(8);
    });
  });

  describe('computeVisiblePageCount', () => {
    it('includes overscan buffers on both sides', () => {
      const count = computeVisiblePageCount(VIEWPORT_HEIGHT, ITEM_HEIGHT);
      const rawCapacity = Math.ceil(VIEWPORT_HEIGHT / ITEM_HEIGHT);
      expect(count).toBe(rawCapacity + OVERSCAN * 2); // visible + 2 top + 2 bottom
    });

    it('defaults to 10 + overscan when viewport is 0', () => {
      expect(computeVisiblePageCount(0, ITEM_HEIGHT)).toBe(10 + OVERSCAN * 2);
    });
  });

  describe('computeExactIndex', () => {
    it('returns 0 at scroll position 0', () => {
      expect(computeExactIndex(0, ITEM_HEIGHT)).toBe(0);
    });

    it('returns correct index mid-scroll', () => {
      expect(computeExactIndex(ITEM_HEIGHT * 3, ITEM_HEIGHT)).toBe(3);
    });

    it('floors fractional positions', () => {
      expect(computeExactIndex(ITEM_HEIGHT * 3 + 100, ITEM_HEIGHT)).toBe(3);
    });
  });

  describe('clampScroll', () => {
    it('clamps negative scroll to 0', () => {
      expect(clampScroll(-100, 5000)).toBe(0);
    });

    it('clamps beyond-max to max', () => {
      expect(clampScroll(6000, 5000)).toBe(5000);
    });

    it('passes through valid scroll values', () => {
      expect(clampScroll(2500, 5000)).toBe(2500);
    });
  });

  describe('computeThumbHeight', () => {
    it('returns 0 when totalHeight is 0', () => {
      expect(computeThumbHeight(800, 0)).toBe(0);
    });

    it('enforces minimum thumb height of 40px', () => {
      const thumb = computeThumbHeight(800, 1000000);
      expect(thumb).toBe(40);
    });

    it('scales proportionally for reasonable content', () => {
      const thumb = computeThumbHeight(800, 1600);
      expect(thumb).toBe(400); // half viewport = half thumb
    });
  });

  describe('computeThumbY', () => {
    it('returns 0 when scrollTop is 0', () => {
      expect(computeThumbY(0, 5000, 800, 100)).toBe(0);
    });

    it('returns 0 when maxScroll is 0', () => {
      expect(computeThumbY(100, 0, 800, 100)).toBe(0);
    });

    it('reaches end of track at max scroll', () => {
      const thumbH = 100;
      const viewportH = 800;
      const maxScroll = 5000;
      const thumbY = computeThumbY(maxScroll, maxScroll, viewportH, thumbH);
      expect(thumbY).toBe(viewportH - thumbH);
    });
  });

  describe('normalizeDeltaY (wheel event modes)', () => {
    it('passes through pixel mode (deltaMode 0)', () => {
      expect(normalizeDeltaY(100, 0, 800)).toBe(100);
    });

    it('multiplies by 33 for line mode (deltaMode 1)', () => {
      expect(normalizeDeltaY(3, 1, 800)).toBe(99);
    });

    it('multiplies by viewport height for page mode (deltaMode 2)', () => {
      expect(normalizeDeltaY(1, 2, 800)).toBe(800);
    });
  });
});
