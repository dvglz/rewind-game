import { useEffect, useState } from 'react';

/**
 * Live count-up elapsed timer derived from wall-clock time.
 *
 * Recomputes `Date.now() - startedAt` on each tick (never accumulates), so a
 * throttled or backgrounded tab resyncs to the correct value when it resumes.
 * Once `isComplete` is true the timer freezes at its final value, which equals
 * the `elapsedMs` recorded by useGame at completion.
 */
export function useElapsedTimer(startedAt: number, isComplete: boolean): number {
  const [elapsed, setElapsed] = useState(() => Math.max(0, Date.now() - startedAt));

  useEffect(() => {
    if (isComplete) {
      setElapsed(Math.max(0, Date.now() - startedAt));
      return;
    }

    setElapsed(Math.max(0, Date.now() - startedAt));
    const id = setInterval(() => {
      setElapsed(Math.max(0, Date.now() - startedAt));
    }, 1000);

    return () => clearInterval(id);
  }, [startedAt, isComplete]);

  return elapsed;
}
