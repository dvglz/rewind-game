export function HomeScreen({ onPlay }: { onPlay: () => void }) {
  return (
    <div>
      <h1>REWIND</h1>
      <button onClick={onPlay}>Play</button>
    </div>
  );
}
