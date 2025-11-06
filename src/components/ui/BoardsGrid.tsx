import type { FC } from "react";
import type { BoardCardVM } from "@/types";
import { BoardCard } from "./BoardCard";
import type { Paged, BoardSummaryDTO } from "@/types";

interface Props {
  boards: BoardSummaryDTO[];
  loading: boolean;
}

export const BoardsGrid: FC<Props> = ({ boards, loading }) => {
  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Ładowanie…</p>;
  }
  if (!boards.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Brak plansz do wyświetlenia.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boards.map((b) => (
        <BoardCard key={b.id} board={b} />
      ))}
    </div>
  );
};
