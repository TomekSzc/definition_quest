import type { FC } from "react";
import Card from "./Card";
import type { CardStatus, CardVM } from "@/hooks/useBoardGame";

interface IBoardGridProps {
  cards: (CardVM & { status: CardStatus })[];
  running: boolean;
  onCardClick(index: number): void;
}

export const BoardGrid: FC<IBoardGridProps> = ({ cards, running, onCardClick }) => {
  const someAnimating = cards.some(c => c.status === "success" || c.status === "failure");
  return (
    <div className="flex flex-wrap bg-secondary w-[calc(100%-199px)] p-[32px] min-h-[80vh] relative">
        <div className="flex flex-wrap h-fit justify-center mx-auto">
        {cards.map((c, idx) => (
            <Card key={c.pairId + idx} text={c.value} status={c.status} disabled={someAnimating} onClick={() => onCardClick(idx)} />
        ))}
        </div>
        {!running && (
          <div className="absolute inset-0 bg-white opacity-50 flex items-center justify-center text-[var(--color-primary)] text-xl font-bold select-none cursor-default">
            {cards.length === 0 ? "Wciśnij Reset aby powtórzyć" : "Wciśnij Start aby zacząć"}
          </div>
        )}
    </div>
  );
}

export default BoardGrid;