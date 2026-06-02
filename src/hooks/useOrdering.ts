import { useState, useCallback } from 'react';
import type { GameEvent, Puzzle } from '../types';

export interface OrderingState {
  events: GameEvent[];
  locked: boolean;
  correctOrder: GameEvent[];
  score: number;
}

export function useOrdering(puzzle: Puzzle) {
  const [events, setEvents] = useState<GameEvent[]>(() =>
    [...puzzle.events].sort(() => Math.random() - 0.5)
  );
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);

  const correctOrder = [...puzzle.events].sort((a, b) => a.year - b.year);

  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    if (locked) return;
    setEvents((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, [locked]);

  const lockIn = useCallback(() => {
    let total = 0;
    const maxPerCard = 200;
    events.forEach((event, playerIndex) => {
      const correctIndex = correctOrder.findIndex((e) => e.text === event.text);
      const distance = Math.abs(playerIndex - correctIndex);
      if (distance === 0) {
        total += maxPerCard;
      } else if (distance === 1) {
        total += Math.round(maxPerCard * 0.5);
      } else {
        total += Math.round(maxPerCard * 0.1);
      }
    });
    setScore(total);
    setLocked(true);
  }, [events, correctOrder]);

  return { events, correctOrder, locked, score, reorder, lockIn };
}
