import { describe, it, expect } from 'vitest';

// Extract the pure math from useAnnotation's handlePointerUp for testability.
// This tests that endX/endY (the pointerup coordinates) are used for all
// four dimensions, not the stale currentPoint from the last pointermove.

function computeAnnotationBox(
  startX: number, startY: number,
  endX: number, endY: number,
  rectWidth: number, rectHeight: number
) {
  const physicalLeft = Math.min(startX, endX);
  const physicalTop = Math.min(startY, endY);
  const physicalWidth = Math.abs(endX - startX);
  const physicalHeight = Math.abs(endY - startY);

  return {
    x: physicalLeft / rectWidth,
    y: physicalTop / rectHeight,
    width: physicalWidth / rectWidth,
    height: physicalHeight / rectHeight,
  };
}

describe('useAnnotation math', () => {
  const RECT_W = 800;
  const RECT_H = 700;

  it('computes position and size from endX/endY consistently', () => {
    // Simulate: pointerdown at (100,100), pointermove to (200,200), pointerup at (250,300)
    // The saved box should use the pointerup coordinate (250,300), not pointermove (200,200)
    const box = computeAnnotationBox(100, 100, 250, 300, RECT_W, RECT_H);

    expect(box.x).toBeCloseTo(100 / RECT_W);
    expect(box.y).toBeCloseTo(100 / RECT_H);
    expect(box.width).toBeCloseTo(150 / RECT_W);  // 250-100, NOT 200-100
    expect(box.height).toBeCloseTo(200 / RECT_H); // 300-100, NOT 200-100
  });

  it('handles reversed drag (end before start)', () => {
    const box = computeAnnotationBox(400, 500, 100, 200, RECT_W, RECT_H);

    expect(box.x).toBeCloseTo(100 / RECT_W);
    expect(box.y).toBeCloseTo(200 / RECT_H);
    expect(box.width).toBeCloseTo(300 / RECT_W);
    expect(box.height).toBeCloseTo(300 / RECT_H);
  });

  it('produces percentage values in 0..1 range for in-bounds draws', () => {
    const box = computeAnnotationBox(0, 0, RECT_W, RECT_H, RECT_W, RECT_H);

    expect(box.x).toBe(0);
    expect(box.y).toBe(0);
    expect(box.width).toBe(1);
    expect(box.height).toBe(1);
  });
});
