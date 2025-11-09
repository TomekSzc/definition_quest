import { useEffect, useMemo, useCallback, useState } from "react";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useListPublicBoardsQuery } from "../store/api/apiSlice";
import type { BoardSummaryDTO } from "../types";

interface UseLevelsResult {
  /** All levels of the board sorted ascending by level number */
  levels: BoardSummaryDTO[];
  /** Level corresponding to the current boardId (undefined until data loaded) */
  currentLevel?: number;
  /** Navigate browser to board page hosting the given level (no-op if not found) */
  navigateToLevel(level: number): void;
  /** Loading state propagated from the underlying query */
  loading: boolean;
  /** Last error (if any) propagated from the query */
  error?: unknown;
}

/**
 * React hook returning all levels for the given board title & owner and helpers.
 *
 * @param boardId   ID of the currently opened board (from URL param)
 * @param boardTitle Title of the board (all levels share the same title)
 */
export function useLevels(boardId: string, boardTitle: string): UseLevelsResult {
  // 1. Resolve current user id from redux store
  const userId = useAppSelector(selectCurrentUser)?.id;

  // 2. Fetch all boards (levels) matching title & owner
  const {
    data: pagedData,
    isFetching,
    error,
  } = useListPublicBoardsQuery(
    userId && boardTitle
      ? { ownerId: userId, q: boardTitle, page: 1, pageSize: 100 }
      : // When userId undefined, skip query by passing undefined (RTK Query convention)
        (undefined as any),
  );

  // 3. Normalise/ sort levels
  const levels = useMemo<BoardSummaryDTO[]>(() => {
    return (pagedData?.data || []).sort((a, b) => a.level - b.level);
  }, [pagedData]);

  // 4. Track current level based on boardId
  const [currentLevel, setCurrentLevel] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!boardId || !levels.length) return;
    const match = levels.find((b) => b.id === boardId);
    setCurrentLevel(match?.level);
  }, [boardId, levels]);

  // 5. Navigation helper (Astro – simple location change)
  const navigateToLevel = useCallback(
    (level: number) => {
      const target = levels.find((b) => b.level === level);
      if (target) {
        window.location.href = `/boards/${target.id}`;
      }
    },
    [levels],
  );

  return { levels, currentLevel, navigateToLevel, loading: isFetching, error };
}
