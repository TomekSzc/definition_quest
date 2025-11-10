import type { FC } from "react";
import { withProviders } from "@/components/HOC/Providers";
import { useQueryParams } from "@/hooks/useQueryParams";
import { DEFAULT_PAGINATION } from "@/constants/pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { useListPlayedBoardsQuery } from "@/store/api/apiSlice";
import type { ListBoardsQuery, BoardSummaryDTO } from "@/types";
import { Pagination } from "@/components/ui/Pagination";
import { BoardsList } from "@/components/ui/BoardsList";

const BoardsPlayedPageComponent: FC = () => {
  const initialParams = DEFAULT_PAGINATION;
  const { params, setQueryParams } = useQueryParams<{ q?: string; page?: string }>();
  const { data, isFetching, refetch } = useListPlayedBoardsQuery({
    ...initialParams,
    ...params,
  } as unknown as Partial<ListBoardsQuery>);

  const handleQueryChange = (val: string) => {
    if (val === "") {
      setQueryParams({ ...params, q: undefined, page: "1" });
      refetch();
    } else {
      setQueryParams({ ...params, q: val, page: "1" });
    }
  };

  const handlePageChange = (page: number) => {
    const searchQuery = page ? { page: String(page) } : {};
    setQueryParams({ ...params, ...searchQuery });
  };

  const boardsForList = data?.data as BoardSummaryDTO[] | undefined;

  return (
    <div className="min-h-[85vh] bg-secondary">
      <section className="container mx-auto max-w-6xl px-4 py-8 pl-[80px]">
        <div className="mb-6 relative">
          <SearchInput onChange={handleQueryChange} initialValue={params.q} />
        </div>
        <BoardsList boards={boardsForList} loading={isFetching} />
        <Pagination meta={data?.meta} onPageChange={handlePageChange} />
      </section>
    </div>
  );
};

export const BoardsPlayedPage = withProviders(BoardsPlayedPageComponent);
export default BoardsPlayedPage;
