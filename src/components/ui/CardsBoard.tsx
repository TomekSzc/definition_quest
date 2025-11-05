import type { FC } from "react";
import type { BoardCardVM, PaginationMeta } from "@/types";
import { BoardsGrid } from "./BoardsGrid";
import { Pagination } from "./Pagination";

interface Props {
  boards: BoardCardVM[];
  loading: boolean;
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const CardsBoard: FC<Props> = ({ boards, loading, meta, onPageChange }) => (
  <>
    <BoardsGrid boards={boards} loading={loading} />
    <Pagination meta={meta} onPageChange={onPageChange} />
  </>
);
