export function OrderingScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <div>
      <h1>ORDERING</h1>
      <button onClick={onFinish}>Finish</button>
    </div>
  );
}
