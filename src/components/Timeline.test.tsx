import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Timeline } from './Timeline';

test('renders the indicator inside the timeline wrapper', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2010}
      rangeEnd={2016}
      yearWidth={60}
      onScroll={() => {}}
      indicatorColor="var(--color-correct)"
    />
  );

  const indicator = screen.getByTestId('timeline-indicator');
  const wrapper = screen.getByTestId('timeline-wrapper');

  expect(wrapper.contains(indicator)).toBe(true);
});

test('renders the year label above the tick line', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2010}
      rangeEnd={2016}
      yearWidth={60}
      onScroll={() => {}}
    />
  );

  const label = screen.getByText('2010');
  const tick = label.parentElement;

  expect(tick?.firstElementChild?.tagName).toBe('SPAN');
});

test('applies dimmed class to ticks outside spotlight window', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2000}
      rangeEnd={2010}
      yearWidth={60}
      onScroll={() => {}}
      spotlightCenter={2005}
      spotlightActive={true}
    />
  );

  const tick2000 = screen.getByText('2000').parentElement!;
  const tick2004 = screen.getByText('2004').parentElement!;
  const tick2005 = screen.getByText('2005').parentElement!;
  const tick2010 = screen.getByText('2010').parentElement!;

  expect(tick2005.className).toContain('Highlight');
  expect(tick2004.className).toContain('Dimmed');
  expect(tick2000.className).toContain('Dimmed');
  expect(tick2010.className).toContain('Dimmed');
});

test('does not apply spotlight classes when spotlightActive is false', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2000}
      rangeEnd={2010}
      yearWidth={60}
      onScroll={() => {}}
      spotlightCenter={2005}
      spotlightActive={false}
    />
  );

  const tick2000 = screen.getByText('2000').parentElement!;
  expect(tick2000.className).not.toContain('Dimmed');
  expect(tick2000.className).not.toContain('Highlight');
});

test('marks only the revealed year as correct', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2000}
      rangeEnd={2006}
      yearWidth={60}
      onScroll={() => {}}
      revealedYear={2005}
    />
  );

  const tick2004 = screen.getByText('2004').parentElement!;
  const tick2005 = screen.getByText('2005').parentElement!;

  expect(tick2005.className).toContain('Correct');
  expect(tick2004.className).not.toContain('Correct');
});
