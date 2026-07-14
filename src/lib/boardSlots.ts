import { SPECIAL_DAYS, getActiveSpecial, specialEndDate, type SpecialDay } from '../data/specials';

/**
 * Leaderboard day pickers (global and group) walk an ordered list of board
 * slots: one per regular day, plus one extra slot per special-event live day
 * pinned right after its date — so an event day shows twice: the daily board,
 * then e.g. "Jul 15 · Messi Special 🇦🇷".
 */
export type BoardSlot =
  | { kind: 'regular'; offset: number }
  | { kind: 'special'; offset: number; special: SpecialDay };

const MAX_SLOT_DAYS = 60;

export function shiftDateByDays(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

export function buildBoardSlots(activeDate: string): BoardSlot[] {
  const specials = SPECIAL_DAYS.filter((s) => s.enabled && s.date <= activeDate);
  const slots: BoardSlot[] = [];
  for (let offset = 0; offset < MAX_SLOT_DAYS; offset++) {
    slots.push({ kind: 'regular', offset });
    const date = shiftDateByDays(activeDate, -offset);
    // Multi-day specials get one board slot per live day.
    const special = specials.find((s) => date >= s.date && date <= specialEndDate(s));
    if (special) slots.push({ kind: 'special', offset, special });
  }
  return slots;
}

/** Opening a picker from special mode lands on that special's newest board. */
export function initialSlotIndex(slots: BoardSlot[]): number {
  const active = getActiveSpecial();
  if (!active) return 0;
  const index = slots.findIndex((s) => s.kind === 'special' && s.special.slug === active.slug);
  return index >= 0 ? index : 0;
}
