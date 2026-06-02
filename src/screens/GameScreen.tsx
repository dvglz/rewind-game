export function GameScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div>
      <h1>GAME</h1>
      <button onClick={onFinish}>Finish</button>
    </div>
  );
}
