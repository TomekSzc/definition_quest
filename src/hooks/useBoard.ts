import { useGetBoardByIdQuery } from "@/store/api/apiSlice";

export function useBoard(boardId: string) {
  const { data: board, isLoading, isError, error, refetch } = useGetBoardByIdQuery(boardId, { skip: !boardId });

  return {
    board,
    isLoading,
    isError,
    error,
    refresh: refetch,
  };
}
