import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaRevealCard } from './MediaRevealCard';

const media = {
  src: '/specials/messi/09-worldcup.jpg',
  caption: 'Messi lifts the trophy in Qatar',
  credit: 'Photo: Example Author, CC BY-SA 4.0, via Wikimedia Commons',
};

describe('MediaRevealCard', () => {
  test('renders image, caption, credit, and button', () => {
    render(<MediaRevealCard media={media} buttonLabel="Next Round" onNext={() => {}} />);
    expect(screen.getByRole('img', { name: media.caption })).toHaveAttribute('src', media.src);
    expect(screen.getByText(media.caption)).toBeInTheDocument();
    expect(screen.getByText(media.credit)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Round' })).toBeInTheDocument();
  });

  test('button fires onNext', () => {
    const onNext = vi.fn();
    render(<MediaRevealCard media={media} buttonLabel="See Results" onNext={onNext} />);
    fireEvent.click(screen.getByRole('button', { name: 'See Results' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  test('image load failure falls back to caption-only', () => {
    render(<MediaRevealCard media={media} buttonLabel="Next Round" onNext={() => {}} />);
    fireEvent.error(screen.getByRole('img', { name: media.caption }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(media.caption)).toBeInTheDocument();
  });
});
