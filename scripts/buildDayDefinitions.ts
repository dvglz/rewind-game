import {
  REWIND_QUESTION_BANK,
  type RewindQuestion,
} from '../src/data/questionBank';

const DAYS = 10;
const NEED = { easy: 20, medium: 10, hard: 20 } as const;
type Diff = keyof typeof NEED;

const primaryTeam = (q: RewindQuestion) => q.teams[0] ?? `__team_${q.id}`;
const primaryPlayer = (q: RewindQuestion) => q.players[0] ?? `__player_${q.id}`;
const decade = (q: RewindQuestion) => Math.floor(new Date(q.date).getFullYear() / 10);

// Small seeded PRNG (mulberry32) so randomized runs are reproducible from a seed.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface BuildOptions {
  /** Provide a seed for a randomized (but reproducible) arrangement.
   *  Omit for the deterministic priority-ordered arrangement. */
  seed?: number;
}

export function buildDayDefinitions(
  bank: RewindQuestion[] = REWIND_QUESTION_BANK,
  options: BuildOptions = {},
): string[][] {
  const eligible = bank.filter((q) => q.eligibleForMain);
  const rnd = options.seed === undefined ? null : mulberry32(options.seed);
  const pool = (d: Diff) => {
    const sorted = eligible
      .filter((q) => q.difficulty === d)
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
    return rnd ? shuffled(sorted, rnd) : sorted;
  };
  const pools: Record<Diff, RewindQuestion[]> = {
    easy: pool('easy'),
    medium: pool('medium'),
    hard: pool('hard'),
  };
  for (const d of ['easy', 'medium', 'hard'] as Diff[]) {
    if (pools[d].length < NEED[d]) {
      throw new Error(`Not enough ${d}: need ${NEED[d]}, have ${pools[d].length}`);
    }
  }

  const days: RewindQuestion[][] = Array.from({ length: DAYS }, () => []);
  const usedTeam = Array.from({ length: DAYS }, () => new Set<string>());
  const usedPlayer = Array.from({ length: DAYS }, () => new Set<string>());
  const usedId = new Set<string>();

  // Deterministic slot fill order: all easies (2/day), then mediums (1/day),
  // then hards (2/day). Iterating days within each round yields E E M H H per day.
  const slots: { day: number; diff: Diff }[] = [];
  for (const [diff, perDay] of [['easy', 2], ['medium', 1], ['hard', 2]] as const) {
    for (let r = 0; r < perDay; r++) {
      for (let day = 0; day < DAYS; day++) slots.push({ day, diff });
    }
  }

  const canPlace = (q: RewindQuestion, day: number): boolean => {
    if (usedId.has(q.id)) return false;
    if (usedTeam[day].has(primaryTeam(q))) return false;
    if (usedPlayer[day].has(primaryPlayer(q))) return false;
    const sameTheme = days[day].filter((x) => x.theme[0] === q.theme[0]).length;
    if (sameTheme >= 2) return false; // no 3+ of one primary theme
    const sameDecade = days[day].filter((x) => decade(x) === decade(q)).length;
    if (sameDecade >= 3) return false; // guarantees >= 2 distinct decades per full day
    return true;
  };

  const place = (q: RewindQuestion, day: number) => {
    days[day].push(q);
    usedId.add(q.id);
    usedTeam[day].add(primaryTeam(q));
    usedPlayer[day].add(primaryPlayer(q));
  };
  const unplace = (q: RewindQuestion, day: number) => {
    days[day].pop();
    usedId.delete(q.id);
    usedTeam[day].delete(primaryTeam(q));
    usedPlayer[day].delete(primaryPlayer(q));
  };

  const solve = (i: number): boolean => {
    if (i === slots.length) return true;
    const { day, diff } = slots[i];
    for (const q of pools[diff]) {
      if (!canPlace(q, day)) continue;
      place(q, day);
      if (solve(i + 1)) return true;
      unplace(q, day);
    }
    return false;
  };

  if (!solve(0)) throw new Error('No valid day arrangement under current rules.');

  const rank: Record<Diff, number> = { easy: 0, medium: 1, hard: 2 };
  return days.map((day) =>
    [...day].sort((a, b) => rank[a.difficulty] - rank[b.difficulty]).map((q) => q.id),
  );
}
