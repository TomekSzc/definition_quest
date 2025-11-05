import { useEffect, useMemo } from "react";
import { useLazyListPublicBoardsQuery } from "@/store/api/apiSlice";
import type { BoardCardVM, PaginationMeta, ListBoardsQuery } from "@/types";

const DEFAULT_PAGE_SIZE = 20;

interface UsePublicBoardsParams {
  params: any;
}

interface UsePublicBoardsResult {
  data: BoardCardVM[];
  meta?: PaginationMeta;
  loading: boolean;
  error?: string;
}

export function usePublicBoards({ params }: UsePublicBoardsParams): UsePublicBoardsResult {
  const [trigger, { data, isFetching, error }] = useLazyListPublicBoardsQuery();

  useEffect(() => {
    const handle = setTimeout(() => trigger(params), 300);
    return () => clearTimeout(handle);
  }, [params, trigger]);

  const mapped: BoardCardVM[] = (data?.data ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    ownerDisplayName: b.ownerId.slice(0, 8),
    cardCount: b.cardCount,
    tags: b.tags ?? [],
    createdAt: b.createdAt,
  }));

  return {
    data: mapped,
    meta: data?.meta,
    loading: isFetching,
    error: (error as any)?.data?.error ?? undefined,
  };
}
