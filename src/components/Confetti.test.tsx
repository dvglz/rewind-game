import { render } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { Confetti } from './Confetti';

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    scale: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
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
