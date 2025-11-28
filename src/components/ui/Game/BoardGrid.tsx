import type { FC } from "react";
import type { CardStatus, CardVM } from "@/hooks/useBoardGame";
import Card from "./Card";

interface IBoardGridProps {
  cards: (CardVM & { status: CardStatus })[];
  running: boolean;
  onCardClick(index: number): void;
  levels?: number[];
  currentLevel?: number;
  navigateToLevel?: (level: number) => void;
}

export const BoardGrid: FC<IBoardGridProps> = ({
  cards,
  running,
  onCardClick,
  levels = [],
  currentLevel,
  navigateToLevel,
}) => {
  const hasPrev = currentLevel !== undefined && levels.includes(currentLevel - 1);
  const hasNext = currentLevel !== undefined && levels.includes(currentLevel + 1);
  const someAnimating = cards.some((c) => c.status === "success" || c.status === "failure");
  return (
    <div className="flex flex-wrap bg-secondary w-full md:w-[calc(100%-199px)] p-[32px] min-h-[80vh] relative">
      <div className="flex flex-wrap h-fit justify-center mx-auto">
        {cards.map((c, idx) => (
          <Card
            key={c.pairId + idx}
            text={c.value}
            status={c.status}
            disabled={someAnimating}
            onClick={() => onCardClick(idx)}
          />
        ))}
      </div>
      {!running && (
        <>
          <div className="absolute inset-0 md:absolute md:inset-0 fixed top-0 left-0 right-0 h-screen md:h-auto bg-white opacity-50 flex flex-col items-center justify-center text-[var(--color-primary)] text-xl font-bold select-none cursor-default space-y-4">
            <span>{cards.length === 0 ? "Wciśnij Reset aby powtórzyć" : "Wciśnij Start aby zacząć"}</span>
          </div>
          <div className="fixed md:absolute left-0 right-0 top-[60%] md:top-[60%] m-auto flex justify-center z-10">
            {cards.length === 0 && (
              <div className="flex flex-col md:flex-row gap-4 text-base px-4">
                {hasPrev && (
                  <button
                    className="cursor-pointer bg-[var(--color-primary)] text-white hover:bg-neutral-300 px-3 py-1 rounded disabled:opacity-50"
                    disabled={currentLevel === undefined}
                    onClick={() => {
                      if (currentLevel !== undefined) navigateToLevel?.(currentLevel - 1);
                    }}
                  >
                    Poprzedni level
                  </button>
                )}
                {hasNext && (
                  <button
                    className="cursor-pointer bg-[var(--color-primary)] text-white hover:bg-neutral-300 px-3 py-1 rounded disabled:opacity-50"
                    disabled={currentLevel === undefined}
                    onClick={() => {
                      if (currentLevel !== undefined) navigateToLevel?.(currentLevel + 1);
                    }}
                  >
                    Następny level
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BoardGrid;
