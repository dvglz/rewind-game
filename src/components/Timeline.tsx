import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import styles from './Timeline.module.css';

interface TimelineProps {
  containerRef: RefObject<HTMLDivElement | null>;
  rangeStart: number;
  rangeEnd: number;
  yearWidth: number;
  onScroll: () => void;
  disabled?: boolean;
  revealedYear?: number | null;
  indicatorColor?: string;
  spotlightCenter?: number | null;
  spotlightActive?: boolean;
  onDragEndSnap?: () => void;
}

export function Timeline({
  containerRef,
  rangeStart,
  rangeEnd,
  yearWidth,
  onScroll,
  disabled,
  revealedYear,
  indicatorColor,
  spotlightCenter,
  spotlightActive,
  onDragEndSnap,
}: TimelineProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
  } | null>(null);

  const stopDragging = useCallback((pointerId: number) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);
    onDragEndSnap?.();
  }, [onDragEndSnap]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    };
    setIsDragging(true);
    container.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }, [containerRef, disabled]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const container = containerRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || !container) {
      return;
    }

    container.scrollLeft = dragState.startScrollLeft - (event.clientX - dragState.startX);
    onScroll();
  }, [containerRef, onScroll]);

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    stopDragging(event.pointerId);
  }, [stopDragging]);

  const years = Array.from(
    { length: rangeEnd - rangeStart + 1 },
    (_, i) => rangeStart + i
  );

  return (
    <div className={styles.wrapper} data-testid="timeline-wrapper">
      <div
        ref={containerRef}
        data-testid="timeline-scroller"
        className={styles.scrollContainer}
        onScroll={onScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        style={{
          pointerEvents: disabled ? 'none' : 'auto',
          scrollSnapType: disabled || spotlightActive || isDragging ? 'none' : 'x mandatory',
          cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        <div style={{ minWidth: '50vw', flexShrink: 0 }} />
        <div className={styles.track}>
          {years.map((year) => {
            const isMajor = year % 5 === 0;
            const isRevealed = revealedYear !== null && revealedYear !== undefined;
            const isCorrectYear = revealedYear === year;

            let spotlightClass = '';
            if (!isRevealed && spotlightActive && spotlightCenter != null) {
              const dist = Math.abs(year - spotlightCenter);
              spotlightClass = dist === 0 ? styles.tickHighlight : styles.tickDimmed;
            }

            const tickClassName = [
              styles.tick,
              isMajor ? styles.tickMajor : styles.tickMinor,
              isRevealed ? styles.tickRevealed : '',
              isCorrectYear ? styles.tickCorrect : '',
              spotlightClass,
            ].filter(Boolean).join(' ');

            return (
              <div
                key={year}
                className={tickClassName}
                style={{ width: yearWidth }}
              >
                <span className={styles.yearLabel}>{year}</span>
                <div className={styles.tickLine} />
              </div>
            );
          })}
        </div>
        <div style={{ minWidth: '50vw', flexShrink: 0 }} />
      </div>
      <div
        className={styles.centerIndicator}
        data-testid="timeline-indicator"
        style={indicatorColor ? { borderTopColor: indicatorColor } : undefined}
      />
    </div>
  );
}
