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
