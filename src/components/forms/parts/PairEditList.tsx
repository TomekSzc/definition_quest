import type { FC } from "react";
import type { PairDTO, PairUpdateCmd } from "@/types";
import PairEditRow from "./PairEditRow";
import { useToast } from "@/store/hooks";

interface IPairEditListProps {
  pairs: PairDTO[];
  cardCount: number;
  onSave: (pairId: string, patch: PairUpdateCmd) => void;
}

const PairEditList: FC<IPairEditListProps> = ({ pairs, cardCount, onSave }) => {
  const { showToast } = useToast();

  if (pairs.length > cardCount / 2) {
    showToast({
      type: "error",
      title: "Limit par",
      message: `Tablica może mieć maksymalnie ${cardCount / 2} par`,
    });
  }

  return (
    <div className="space-y-4">
      {pairs.map((pair: PairDTO) => (
        <PairEditRow key={pair.id} pair={pair} onSave={onSave} />
      ))}
    </div>
  );
};

export default PairEditList;
