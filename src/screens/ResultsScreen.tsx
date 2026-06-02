export function ResultsScreen({ onHome }: { onHome: () => void }) {
  return (
    <div>
      <h1>RESULTS</h1>
      <button onClick={onHome}>Home</button>
    </div>
  );
}
