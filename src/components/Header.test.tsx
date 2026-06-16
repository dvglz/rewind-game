import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('zero-pads the game number to 3 digits', () => {
    render(<Header gameNumber={10} />);
    expect(screen.getByText('#010')).not.toBeNull();
  });

  it('zero-pads a single-digit game number', () => {
    render(<Header gameNumber={3} />);
    expect(screen.getByText('#003')).not.toBeNull();
  });

  it('uses the wordmark as a home action when provided', () => {
    const onHome = vi.fn();
    render(<Header gameNumber={3} onHome={onHome} />);

    fireEvent.click(screen.getByRole('button', { name: 'REWIND' }));

    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
