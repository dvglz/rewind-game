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

  it('renders a rules button when onRules is provided and calls it on click', () => {
    const onRules = vi.fn();
    render(<Header onRules={onRules} />);
    const btn = screen.getByRole('button', { name: /how to play/i });
    fireEvent.click(btn);
    expect(onRules).toHaveBeenCalledTimes(1);
  });

  it('renders no rules button when onRules is omitted', () => {
    render(<Header />);
    expect(screen.queryByRole('button', { name: /how to play/i })).toBeNull();
  });

  it('renders round dots when roundState is provided', () => {
    render(
      <Header
        gameNumber={14}
        roundState={{ results: [{ diff: 0 }, { diff: 1 }], currentRound: 2, totalRounds: 5 }}
      />
    );
    expect(screen.getAllByTestId('round-dot')).toHaveLength(5);
  });

  it('renders the MM:SS timer when timerText is provided', () => {
    render(<Header gameNumber={14} timerText="02:39" />);
    expect(screen.getByTestId('game-timer')).toHaveTextContent('02:39');
  });
});
