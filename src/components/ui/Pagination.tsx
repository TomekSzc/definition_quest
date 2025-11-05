import type { FC } from "react";
import type { PaginationMeta } from "@/types";

interface Props {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const Pagination: FC<Props> = ({ meta, onPageChange }) => {
  if (!meta || meta.total <= meta.pageSize) return null;
  const totalPages = Math.ceil(meta.total / meta.pageSize);
  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Paginacja">
      <button
        className="rounded px-2 py-1 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        disabled={meta.page === 1}
        onClick={() => onPageChange(meta.page - 1)}
      >
        ← Poprzednia
      </button>
      <span className="text-sm text-muted-foreground">
        {meta.page} / {totalPages}
      </span>
      <button
        className="rounded px-2 py-1 text-sm hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        disabled={meta.page === totalPages}
        onClick={() => onPageChange(meta.page + 1)}
      >
        Następna →
      </button>
    </nav>
  );
};
