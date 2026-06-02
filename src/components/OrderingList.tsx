import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GameEvent } from '../types';
import styles from './OrderingList.module.css';

interface SortableCardProps {
  event: GameEvent;
  locked: boolean;
  correctIndex?: number;
  currentIndex?: number;
}

function SortableCard({ event, locked, correctIndex, currentIndex }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.text,
    disabled: locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let statusClass = '';
  if (locked && correctIndex !== undefined && currentIndex !== undefined) {
    statusClass = correctIndex === currentIndex ? styles.correct : styles.incorrect;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''} ${statusClass}`}
      {...attributes}
      {...listeners}
    >
      <span className={styles.handle}>⠿</span>
      <span className={styles.cardText}>{event.text}</span>
      {locked && <span className={styles.year}>{event.year}</span>}
    </div>
  );
}

interface OrderingListProps {
  events: GameEvent[];
  correctOrder: GameEvent[];
  locked: boolean;
  onReorder: (from: number, to: number) => void;
}

export function OrderingList({ events, correctOrder, locked, onReorder }: OrderingListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = events.findIndex((ev) => ev.text === active.id);
    const to = events.findIndex((ev) => ev.text === over.id);
    onReorder(from, to);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={events.map((e) => e.text)} strategy={verticalListSortingStrategy}>
        <div className={styles.list}>
          {events.map((event, i) => (
            <SortableCard
              key={event.text}
              event={event}
              locked={locked}
              currentIndex={i}
              correctIndex={locked ? correctOrder.findIndex((e) => e.text === event.text) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
