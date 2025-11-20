import type { FC } from "react";
import type { PairDTO, PairUpdateCmd } from "@/types";
import PairEditRow from "./PairEditRow";
import { useToast } from "@/store/hooks";

interface IPairEditListProps {
  boardId: string;
  pairs: PairDTO[];
  cardCount: number;
  onSave: (pairId: string, patch: PairUpdateCmd) => void;
  onDelete: (pairId: string) => void;
}

const PairEditList: FC<IPairEditListProps> = ({ boardId, pairs, cardCount, onSave, onDelete }) => {
  const { showToast } = useToast();

  if (pairs.length > cardCount / 2) {
    showToast({
      type: "error",
      title: "Limit par",
      message: `Tablica może mieć maksymalnie ${cardCount / 2} par`,
    });
  }

  return (
    <div className="space-y-4" data-testid="pair-edit-list">
      {pairs.map((pair: PairDTO) => (
        <PairEditRow key={pair.id} pair={pair} boardId={boardId} onSave={onSave} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default PairEditList;
