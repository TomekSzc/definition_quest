export default function SkeletonBoard({ cardCount }: { cardCount: number }) {
  const columns = Math.sqrt(cardCount);
  return (
    <ul
      className="grid gap-4 flex-1 animate-pulse"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cardCount }).map((_, idx) => (
        <li key={idx} className="h-24 bg-neutral-200 rounded-md" />
      ))}
    </ul>
  );
}
