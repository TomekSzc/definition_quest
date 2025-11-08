import Card from "./Card";
import type { CardStatus, CardVM } from "@/lib/hooks/useBoardGame";

interface BoardGridProps {
  cards: (CardVM & { status: CardStatus })[];
  onCardClick(index: number): void;
}

export default function BoardGrid({ cards, onCardClick }: BoardGridProps) {
  return (
    <div className="flex flex-wrap bg-secondary w-[calc(100%-199px)] p-[32px]">
      {cards.map((c, idx) => (
          <Card text={c.value} status={c.status} onClick={() => onCardClick(idx)} />
      ))}
    </div>
  );
}
