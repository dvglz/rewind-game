import { Header } from '../components/Header';
import { OrderingList } from '../components/OrderingList';
import { useOrdering } from '../hooks/useOrdering';
import { getTodaysPuzzle } from '../data/puzzles';

interface OrderingScreenProps {
  onFinish: () => void;
}

export function OrderingScreen({ onFinish }: OrderingScreenProps) {
  const puzzle = getTodaysPuzzle();
  const ordering = useOrdering(puzzle);

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Header />
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px' }}>
          Order these events
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-muted)' }}>
          Earliest at top, latest at bottom
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <OrderingList
          events={ordering.events}
          correctOrder={ordering.correctOrder}
          locked={ordering.locked}
          onReorder={ordering.reorder}
        />
      </div>

      <div style={{ padding: '16px 24px', textAlign: 'center' }}>
        {ordering.locked ? (
          <>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', marginBottom: '16px' }}>
              Score: {ordering.score}
            </p>
            <button
              onClick={onFinish}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                padding: '16px 48px',
                border: 'none',
                background: 'var(--color-text)',
                color: 'var(--color-bg)',
                borderRadius: '999px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Done
            </button>
          </>
        ) : (
          <button
            onClick={ordering.lockIn}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              padding: '16px 48px',
              border: '2px solid var(--color-text)',
              background: 'var(--color-bg)',
              borderRadius: '999px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Lock In
          </button>
        )}
      </div>
    </div>
  );
}
