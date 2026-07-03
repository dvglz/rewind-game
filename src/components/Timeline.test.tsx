import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
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

test('uses container-relative spacers so scroll math centers the selected tick', () => {
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2010}
      rangeEnd={2016}
      yearWidth={60}
      onScroll={() => {}}
    />
  );

  const scroller = screen.getByTestId('timeline-scroller');
  expect((scroller.firstElementChild as HTMLElement).style.minWidth).toBe('50%');
  expect((scroller.lastElementChild as HTMLElement).style.minWidth).toBe('50%');
});

test('places the indicator above the year labels', () => {
  const css = readFileSync(resolve(__dirname, './Timeline.module.css'), 'utf8');
  const indicatorBlock = css.match(/\.centerIndicator\s*\{([^}]*)\}/);
  const desktopBlock = css.match(/@media \(min-width: 900px\)[\s\S]*?\.centerIndicator\s*\{([^}]*)\}/);

  expect(indicatorBlock?.[1] ?? '').toMatch(/top:\s*-2px;/);
  expect(indicatorBlock?.[1] ?? '').toMatch(/border-left:\s*8px solid transparent;/);
  expect(indicatorBlock?.[1] ?? '').toMatch(/border-right:\s*8px solid transparent;/);
  expect(indicatorBlock?.[1] ?? '').toMatch(/border-top:\s*12px solid var\(--color-text\);/);
  expect(indicatorBlock?.[1] ?? '').toMatch(/z-index:\s*2;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/top:\s*2px;/);
});

test('keeps desktop tick lines tall enough for wide game layouts', () => {
  const css = readFileSync(resolve(__dirname, './Timeline.module.css'), 'utf8');
  const desktopBlock = css.match(/@media \(min-width: 900px\)\s*\{([\s\S]*)\n\}/);

  expect(desktopBlock?.[1] ?? '').toMatch(/\.tickMinor \.tickLine\s*\{\s*height:\s*132px;/);
  expect(desktopBlock?.[1] ?? '').toMatch(/\.tickMajor \.tickLine\s*\{\s*height:\s*168px;/);
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

test('supports mouse drag scrolling and snaps on release', () => {
  const onDragEndSnap = vi.fn();
  render(
    <Timeline
      containerRef={createRef<HTMLDivElement>()}
      rangeStart={2000}
      rangeEnd={2006}
      yearWidth={60}
      onScroll={() => {}}
      onDragEndSnap={onDragEndSnap}
    />
  );

  const scroller = screen.getByTestId('timeline-scroller') as HTMLDivElement & {
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };

  scroller.setPointerCapture = () => {};
  scroller.releasePointerCapture = () => {};
  Object.defineProperty(scroller, 'scrollLeft', {
    value: 180,
    writable: true,
  });

  fireEvent.pointerDown(scroller, {
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
    clientX: 100,
  });
  fireEvent.pointerMove(scroller, {
    pointerId: 1,
    pointerType: 'mouse',
    clientX: 140,
  });

  expect(scroller.scrollLeft).toBe(140);
  expect(scroller.style.scrollSnapType).toBe('none');

  fireEvent.pointerUp(scroller, {
    pointerId: 1,
    pointerType: 'mouse',
    clientX: 140,
  });

  expect(onDragEndSnap).toHaveBeenCalledTimes(1);
  expect(scroller.style.scrollSnapType).toBe('x mandatory');
});
