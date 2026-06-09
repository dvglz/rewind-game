import { render } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { Confetti } from './Confetti';

const fillRect = vi.fn();

beforeEach(() => {
  fillRect.mockReset();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    scale: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect,
    fillStyle: '',
    globalAlpha: 1,
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

test('renders a fixed-position canvas element', () => {
  const { container } = render(<Confetti active={true} />);
  const canvas = container.querySelector('canvas');

  expect(canvas).toBeTruthy();
  expect(canvas!.style.position).toBe('fixed');
  expect(canvas!.style.pointerEvents).toBe('none');
});

test('does not render canvas when not active', () => {
  const { container } = render(<Confetti active={false} />);
  const canvas = container.querySelector('canvas');

  expect(canvas).toBeNull();
});

test('calls onComplete after animation finishes', async () => {
  vi.useFakeTimers();
  const onComplete = vi.fn();

  render(<Confetti active={true} onComplete={onComplete} />);

  vi.advanceTimersByTime(1500);
  expect(onComplete).toHaveBeenCalled();
  vi.useRealTimers();
});

test('renders a single confetti burst worth of particles on the first frame', () => {
  const originalRaf = window.requestAnimationFrame;
  let frameCalls = 0;
  window.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    frameCalls += 1;
    if (frameCalls === 1) {
      callback(performance.now());
    }
    return frameCalls;
  });

  render(<Confetti active={true} />);

  expect(fillRect).toHaveBeenCalledTimes(80);
  window.requestAnimationFrame = originalRaf;
});

test('does not restart the burst when re-rendered active with a new onComplete callback', () => {
  const originalRaf = window.requestAnimationFrame;
  let frameCalls = 0;
  const raf = vi.fn((callback: FrameRequestCallback) => {
    frameCalls += 1;
    if (frameCalls <= 2) {
      callback(performance.now());
    }
    return frameCalls;
  });
  window.requestAnimationFrame = raf;

  const { rerender } = render(<Confetti active={true} onComplete={() => {}} />);
  const initialScheduleCount = raf.mock.calls.length;

  rerender(<Confetti active={true} onComplete={() => undefined} />);

  expect(raf.mock.calls.length).toBe(initialScheduleCount);
  window.requestAnimationFrame = originalRaf;
});
