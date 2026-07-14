import { useEffect, useState } from 'react';

/**
 * Live count-up elapsed timer derived from wall-clock time.
 *
 * Recomputes `Date.now() - startedAt` on each tick (never accumulates), so a
 * throttled or backgrounded tab resyncs to the correct value when it resumes.
 * Once `isComplete` is true the timer freezes at its final value, which equals
 * the `elapsedMs` recorded by useGame at completion.
 *
 * Supports pause: pass `pausedMs` to subtract from elapsed, and `isPaused` to
 * freeze the display while a modal is open. When `isPaused` clears and `pausedMs`
 * grows, the effect reruns and recomputes to the pause-start value.
 */
export function useElapsedTimer(
  startedAt: number,
  isComplete: boolean,
  pausedMs = 0,
  isPaused = false,
): number {
  const [elapsed, setElapsed] = useState(() => Math.max(0, Date.now() - startedAt - pausedMs));

  useEffect(() => {
    if (isComplete) {
      setElapsed(Math.max(0, Date.now() - startedAt - pausedMs));
      return;
    }
    // While paused we hold the last shown value; dismissal bumps pausedMs,
    // which re-runs this effect and recomputes to the pause-start value.
    if (isPaused) return;

    setElapsed(Math.max(0, Date.now() - startedAt - pausedMs));
    const id = setInterval(() => {
      setElapsed(Math.max(0, Date.now() - startedAt - pausedMs));
    }, 1000);

    return () => clearInterval(id);
  }, [startedAt, isComplete, pausedMs, isPaused]);

  return elapsed;
}
