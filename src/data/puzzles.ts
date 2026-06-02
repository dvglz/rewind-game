import type { Puzzle, GameEvent } from '../types';

const PUZZLE_BANK: { theme: string; events: GameEvent[] }[] = [
  {
    theme: 'Iconic Moments',
    events: [
      { text: 'Kobe scores 81 points against the Raptors', year: 2006 },
      { text: 'LeBron James is drafted 1st overall by Cleveland', year: 2003 },
      { text: 'Miami Heat win their last championship with LeBron', year: 2013 },
      { text: 'Warriors finish 73-9 regular season', year: 2016 },
      { text: 'Dirk Nowitzki wins the NBA Finals', year: 2011 },
    ],
  },
  {
    theme: 'The LeBron Era',
    events: [
      { text: 'LeBron announces "The Decision" on live TV', year: 2010 },
      { text: 'LeBron returns to Cleveland', year: 2014 },
      { text: 'LeBron hits the chase-down block in Game 7', year: 2016 },
      { text: 'LeBron joins the Los Angeles Lakers', year: 2018 },
      { text: 'LeBron breaks Kareem\'s all-time scoring record', year: 2023 },
    ],
  },
  {
    theme: 'Draft Night',
    events: [
      { text: 'Allen Iverson is drafted 1st overall', year: 1996 },
      { text: 'Tim Duncan is drafted 1st overall by the Spurs', year: 1997 },
      { text: 'Derrick Rose is drafted 1st overall by the Bulls', year: 2008 },
      { text: 'Zion Williamson is drafted 1st overall by the Pelicans', year: 2019 },
      { text: 'Victor Wembanyama is drafted 1st overall by the Spurs', year: 2023 },
    ],
  },
  {
    theme: 'Championship Runs',
    events: [
      { text: 'Michael Jordan wins his 6th and final championship', year: 1998 },
      { text: 'Shaq and Kobe win their first title together', year: 2000 },
      { text: 'The Detroit Pistons upset the Lakers in the Finals', year: 2004 },
      { text: 'The Celtics win their 17th championship', year: 2008 },
      { text: 'Giannis wins his first NBA title for the Bucks', year: 2021 },
    ],
  },
  {
    theme: 'Playoff Legends',
    events: [
      { text: 'Ray Allen hits the corner three to save Miami in the Finals', year: 2013 },
      { text: 'Kawhi hits the Game 7 buzzer-beater vs the Sixers', year: 2019 },
      { text: 'Dame waves goodbye to OKC with the series-winning three', year: 2019 },
      { text: 'The Bubble NBA Finals are held in Orlando', year: 2020 },
      { text: 'Nikola Jokic wins his first NBA championship', year: 2023 },
    ],
  },
  {
    theme: 'MVP Seasons',
    events: [
      { text: 'Allen Iverson wins NBA MVP', year: 2001 },
      { text: 'Derrick Rose becomes the youngest MVP in NBA history', year: 2011 },
      { text: 'Stephen Curry wins unanimous MVP', year: 2016 },
      { text: 'Giannis wins his second consecutive MVP', year: 2020 },
      { text: 'Nikola Jokic wins his third MVP', year: 2024 },
    ],
  },
  {
    theme: 'Culture Moments',
    events: [
      { text: 'Malice at the Palace brawl shocks the NBA', year: 2004 },
      { text: 'Linsanity takes over New York', year: 2012 },
      { text: 'Kevin Durant joins the Warriors', year: 2016 },
      { text: 'Paul George says "that\'s a bad shot" about Kawhi\'s winner', year: 2019 },
      { text: 'The NBA suspends its season due to COVID-19', year: 2020 },
    ],
  },
];

function dateToIndex(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PUZZLE_BANK.length;
}

function puzzleNumber(dateStr: string): number {
  const base = new Date('2026-06-01').getTime();
  const current = new Date(dateStr).getTime();
  return Math.floor((current - base) / 86_400_000) + 1;
}

export function getPuzzleForDate(dateStr: string): Puzzle {
  const index = dateToIndex(dateStr);
  const entry = PUZZLE_BANK[index];
  return {
    id: dateStr,
    number: puzzleNumber(dateStr),
    sport: 'nba',
    theme: entry.theme,
    events: entry.events,
  };
}

export function getTodaysPuzzle(): Puzzle {
  const today = new Date().toISOString().slice(0, 10);
  return getPuzzleForDate(today);
}
