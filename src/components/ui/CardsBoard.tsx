import type { FC } from "react";
import type { PaginationMeta } from "@/types";
import { BoardsGrid } from "./BoardsGrid";
import type { BoardSummaryDTO } from "@/types";

interface Props {
  boards:  BoardSummaryDTO[] | undefined;
  loading: boolean;
  meta?: PaginationMeta;
}

export const CardsBoard: FC<Props> = ({ boards, loading, meta }) => {
  if(!boards) return null;
  return (
    <>
      <BoardsGrid boards={boards} loading={loading} />
    </>
  )
};
