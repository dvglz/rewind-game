import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HowToScreen } from './HowToScreen';
import { hasSeenRules } from '../engine/storage';

describe('HowToScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the title and the 1,000 hook', () => {
    render(<HowToScreen mode="play" entryPoint="menu" onPlay={vi.fn()} onHome={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /remember\s*when it happened\?/i })).toBeTruthy();
    expect(screen.getByText('Can you hit perfect 1,000?')).toBeTruthy();
    expect(screen.getByLabelText('Five green circles').textContent).toBe('🟢🟢🟢🟢🟢');
  });

  it('marks the rules as seen on mount', () => {
    render(<HowToScreen mode="play" entryPoint="first_run" onPlay={vi.fn()} onHome={vi.fn()} />);
    expect(hasSeenRules()).toBe(true);
  });

  it('shows a Play button in play mode and calls onPlay', async () => {
    const onPlay = vi.fn();
    render(<HowToScreen mode="play" entryPoint="first_run" onPlay={onPlay} onHome={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('shows a Back to Home button in home mode and calls onHome', async () => {
    const onHome = vi.fn();
    render(<HowToScreen mode="home" entryPoint="menu" onPlay={vi.fn()} onHome={onHome} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
