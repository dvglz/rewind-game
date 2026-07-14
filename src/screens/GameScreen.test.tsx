import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { GameScreen } from './GameScreen';

const headerMock = vi.hoisted(() => ({
  latestProps: null as null | { roundState?: { animatedDoneIndex?: number } },
}));

vi.mock('../components/Header', () => ({
  Header: (props: { roundState?: { animatedDoneIndex?: number }; specialFlag?: string }) => {
    headerMock.latestProps = props;
    return (
      <div>
        Header
        {props.specialFlag && <span>{props.specialFlag}</span>}
      </div>
    );
  },
}));

vi.mock('../components/Timeline', () => ({
  Timeline: ({
    spotlightActive,
    indicatorColor,
  }: {
    spotlightActive?: boolean;
    indicatorColor?: string;
  }) => (
    <div data-testid="timeline-props">
      {spotlightActive ? 'spotlight-on' : 'spotlight-off'}|{indicatorColor ?? 'none'}
    </div>
  ),
}));

vi.mock('../components/ConfirmButton', () => ({
  ConfirmButton: ({ onConfirm }: { onConfirm: () => void }) => (
    <button type="button" onClick={onConfirm}>Lock</button>
  ),
}));

vi.mock('../components/Confetti', () => ({
  Confetti: ({ active }: { active: boolean }) => (
    active ? <div data-testid="confetti-active" /> : null
  ),
}));

vi.mock('../hooks/useGame', () => ({
  useGame: vi.fn(),
}));

vi.mock('../hooks/useTimeline', () => ({
  useTimeline: vi.fn(),
}));

vi.mock('../hooks/useElapsedTimer', () => ({
  useElapsedTimer: vi.fn(() => 0),
}));

vi.mock('../data/puzzles', () => ({
  getTodaysPuzzle: vi.fn(),
  isRewindLabMode: vi.fn(() => false),
  isPracticeMode: vi.fn(() => false),
}));

vi.mock('../lib/haptics', () => ({
  vibrateConfirm: vi.fn(),
  vibrateError: vi.fn(),
  vibrateMedium: vi.fn(),
}));

const { useGame } = await import('../hooks/useGame');
const { useTimeline } = await import('../hooks/useTimeline');
const { getTodaysPuzzle } = await import('../data/puzzles');
let selectedYear = 2025;

beforeEach(() => {
  headerMock.latestProps = null;

  vi.mocked(getTodaysPuzzle).mockReturnValue({
    id: 'puzzle-1',
    number: 1,
    sport: 'american',
    theme: 'NBA Finals',
    events: [{ text: 'LeBron makes The Block', year: 2016 }],
  });

  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });
});

test('shows the currently locked year in the headline year slot before reveal', () => {
  render(<GameScreen onFinish={() => {}} />);

  expect(screen.getByTestId('headline-year').textContent).toBe('2025');
});

test('does not render puzzle theme metadata in the game screen', () => {
  render(<GameScreen onFinish={() => {}} />);

  expect(screen.queryByText('NBA Finals')).toBeNull();
});

test('keeps showing the guessed year while the timeline scrolls to the correct answer', async () => {
  const scrollPromise = new Promise<void>(() => {});

  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016 },
      guessedYear: 2025,
      actualYear: 2016,
      diff: 9,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn((year: number) => {
      selectedYear = year;
      return scrollPromise;
    }),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  expect(screen.getByTestId('headline-year').textContent).toBe('2025');
});

test('activates spotlight while a non-perfect reveal is scrolling', async () => {
  vi.useFakeTimers();
  const scrollPromise = new Promise<void>(() => {});

  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016, detail: 'In 2016, ...' },
      guessedYear: 2025,
      actualYear: 2016,
      diff: 9,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => scrollPromise),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  await act(async () => {
    vi.advanceTimersByTime(300);
  });

  expect(screen.getByTestId('timeline-props').textContent).toContain('spotlight-on');
  expect(screen.getByTestId('timeline-props').textContent).toContain('var(--color-text)');
  expect(screen.getByTestId('headline-year').getAttribute('style')).toContain('var(--color-text)');
  vi.useRealTimers();
});

test('keeps the headline year dimmed until reveal state is committed', async () => {
  vi.useFakeTimers();
  let resolveScroll: (() => void) | null = null;
  const scrollPromise = new Promise<void>((resolve) => {
    resolveScroll = resolve;
  });

  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016, detail: 'In 2016, ...' },
      guessedYear: 2025,
      actualYear: 2016,
      diff: 9,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => scrollPromise),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  await act(async () => {
    vi.advanceTimersByTime(300);
  });

  expect(screen.getByTestId('headline-year').className).toContain('micropauseDim');

  await act(async () => {
    resolveScroll?.();
    await Promise.resolve();
  });

  expect(screen.getByTestId('headline-year').className).not.toContain('micropauseDim');
  vi.useRealTimers();
});

test('shows confetti on a perfect reveal', async () => {
  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016, detail: 'In 2016, ...' },
      guessedYear: 2016,
      actualYear: 2016,
      diff: 0,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => Promise.resolve()),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  expect(await screen.findByTestId('confetti-active')).not.toBeNull();
});

test('marks the just-revealed completed dot for animation', async () => {
  vi.useFakeTimers();

  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016, detail: 'In 2016, ...' },
      guessedYear: 2016,
      actualYear: 2016,
      diff: 0,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => Promise.resolve()),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  expect(headerMock.latestProps?.roundState?.animatedDoneIndex).toBeUndefined();

  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  await act(async () => {
    await vi.runAllTimersAsync();
  });

  expect(headerMock.latestProps?.roundState?.animatedDoneIndex).toBe(0);
  vi.useRealTimers();
});

test('keeps the reveal indicator green even on a wrong answer', async () => {
  vi.useFakeTimers();

  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016, detail: 'In 2016, ...' },
      guessedYear: 2025,
      actualYear: 2016,
      diff: 9,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => Promise.resolve()),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  await act(async () => {
    await vi.runAllTimersAsync();
  });

  expect(screen.getByTestId('timeline-props').textContent).toContain('var(--color-correct)');
  expect(screen.getByTestId('headline-year').getAttribute('style')).toContain('var(--color-wrong)');
  vi.useRealTimers();
});

test('special day: flag renders in the header', () => {
  vi.mocked(getTodaysPuzzle).mockReturnValue({
    id: 'puzzle-messi',
    number: 500,
    sport: 'soccer',
    theme: 'Messi Special',
    special: { slug: 'messi', flag: '🇦🇷', label: 'Messi Special', shareLine: 'The GOAT.' },
    events: [{ text: 'Messi makes his La Liga debut', year: 2004 }],
  });

  render(<GameScreen onFinish={() => {}} />);

  expect(screen.getByText('🇦🇷')).toBeInTheDocument();
});

test('special day: media card appears after reveal and its button advances the round', async () => {
  const messiPuzzle = {
    id: 'puzzle-messi',
    number: 500,
    sport: 'soccer' as const,
    theme: 'Messi Special',
    special: { slug: 'messi', flag: '🇦🇷', label: 'Messi Special', shareLine: 'The GOAT.' },
    events: Array.from({ length: 10 }, (_, i) => ({
      text: i === 0 ? 'Messi makes his La Liga debut' : `Messi milestone ${i}`,
      year: 2004 + i,
      media: i === 0
        ? { src: '/messi-debut.jpg', caption: 'Messi debut', credit: 'Getty' }
        : undefined,
    })),
  };
  vi.mocked(getTodaysPuzzle).mockReturnValue(messiPuzzle);

  let currentRound = 0;

  vi.mocked(useGame).mockReturnValue({
    state: { puzzleId: 'puzzle-messi', currentRound: 0, results: [], totalScore: 0, completed: false },
    get currentEvent() {
      return messiPuzzle.events[currentRound];
    },
    get currentRound() {
      return currentRound;
    },
    totalRounds: 10,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => {
      const result = {
        event: messiPuzzle.events[0],
        guessedYear: 2004,
        actualYear: 2004,
        diff: 0,
        score: 100,
      };
      currentRound = 1;
      return result;
    }),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => Promise.resolve()),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  await screen.findByText(/Messi makes his La Liga debut/i);
  const card = await screen.findByRole('dialog', {}, { timeout: 3000 });
  expect(card).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Next Round' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText('Round 2 of 10')).toBeInTheDocument();
});

test('regular day: no media card, footer Next button unchanged', async () => {
  vi.mocked(useGame).mockReturnValue({
    state: {
      puzzleId: 'puzzle-1',
      currentRound: 0,
      results: [],
      totalScore: 0,
      completed: false,
    },
    currentEvent: { text: 'LeBron makes The Block', year: 2016 },
    currentRound: 0,
    totalRounds: 5,
    isComplete: false,
    results: [],
    totalScore: 0,
    submitGuess: vi.fn(() => ({
      event: { text: 'LeBron makes The Block', year: 2016, detail: 'In 2016, ...' },
      guessedYear: 2016,
      actualYear: 2016,
      diff: 0,
      score: 100,
    })),
    recordPause: vi.fn(),
  });

  vi.mocked(useTimeline).mockReturnValue({
    containerRef: { current: null },
    get selectedYear() {
      return selectedYear;
    },
    scrollToYear: vi.fn(() => Promise.resolve()),
    snapToClosestYear: vi.fn(() => Promise.resolve()),
    syncYear: vi.fn(),
    handleScroll: vi.fn(),
    rangeStart: 1984,
    rangeEnd: 2026,
    yearWidth: 60,
  });

  render(<GameScreen onFinish={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: /lock/i }));

  await screen.findByTestId('confetti-active');

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  const nextButton = screen.getByRole('button', { name: 'Next Round' });
  fireEvent.click(nextButton);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /lock/i })).toBeInTheDocument();
});
