import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MediaRevealCard } from './MediaRevealCard';

const media = {
  src: '/specials/messi/09-worldcup.jpg',
  caption: 'Messi lifts the trophy in Qatar',
  credit: 'Photo: Example Author, CC BY-SA 4.0, via Wikimedia Commons',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
};

const detail = 'In 2022, Messi won maybe the greatest final ever played.';

function renderCard(overrides: Partial<Parameters<typeof MediaRevealCard>[0]> = {}) {
  return render(
    <MediaRevealCard
      media={media}
      detail={detail}
      tilt={-2.5}
      buttonLabel="Next Round"
      onNext={() => {}}
      {...overrides}
    />,
  );
}

describe('MediaRevealCard', () => {
  test('renders photo, reveal text, credits link, and button', () => {
    renderCard();
    expect(screen.getByRole('img', { name: media.caption })).toHaveAttribute('src', media.src);
    expect(screen.getByText(detail, { exact: false })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Image credits.' });
    expect(link).toHaveAttribute('href', media.sourceUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: 'Next Round' })).toBeInTheDocument();
  });

  test('caption and credit are not shown as visible text', () => {
    renderCard();
    expect(screen.queryByText(media.caption)).not.toBeInTheDocument();
    expect(screen.queryByText(media.credit)).not.toBeInTheDocument();
  });

  test('applies the per-round tilt to the print frame', () => {
    renderCard({ tilt: 3 });
    const img = screen.getByRole('img', { name: media.caption });
    expect((img.parentElement as HTMLElement).style.getPropertyValue('--tilt')).toBe('3deg');
  });

  test('button fires onNext', () => {
    const onNext = vi.fn();
    renderCard({ buttonLabel: 'See Results', onNext });
    fireEvent.click(screen.getByRole('button', { name: 'See Results' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  test('image load failure hides the photo but keeps text, credits, and button', () => {
    renderCard();
    fireEvent.error(screen.getByRole('img', { name: media.caption }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(detail, { exact: false })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Image credits.' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next Round' })).toBeInTheDocument();
  });
});
