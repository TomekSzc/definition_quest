import type { FC } from "react";
import type { BoardSummaryDTO } from "@/types";
import { BoardListTile } from "./BoardListTile";

interface IBoardsListProps {
    boards: BoardSummaryDTO[] | undefined;
    loading: boolean;
  }
  

export const BoardsList: FC<IBoardsListProps> = ({ boards, loading }) => {
    if (loading) {
        return <p className="py-10 text-center text-sm text-muted-foreground">Ładowanie…</p>;
      }
      if (!boards || boards.length === 0) {
        return <p className="py-10 text-center text-sm text-muted-foreground">Brak plansz do wyświetlenia.</p>;
      }
   
   return (<div className="flex flex-col relative w-full">
        {boards.map((board) => (
            <BoardListTile key={board.id} board={board} />   
        ))}
    </div>)
}
