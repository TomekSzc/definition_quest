import type { FC } from "react";
import { withProviders } from "@/components/HOC/Providers";
import { useQueryParams } from "@/hooks/useQueryParams";
import { DEFAULT_PAGINATION } from "@/constants/pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { useListPublicBoardsQuery } from "@/store/api/apiSlice";
import type { ListBoardsQuery } from "@/types";
import { Pagination } from "@/components/ui/Pagination";
import { BoardsList } from "@/components/ui/BoardsList";

const BoardsPageComponent: FC = () => {
  const initialParams = DEFAULT_PAGINATION;
  const { params, setQueryParams } = useQueryParams<{ q?: string; page?: string }>();
  const { data, isFetching, refetch } = useListPublicBoardsQuery({
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

  return (
    <div className="min-h-screen bg-secondary">
      <section className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 relative">
          <SearchInput onChange={handleQueryChange} initialValue={params.q} />
        </div>
        <BoardsList boards={data?.data} loading={isFetching} />
        <Pagination meta={data?.meta} onPageChange={handlePageChange} />
      </section>
    </div>
  );
};

export const BoardsPage = withProviders(BoardsPageComponent);
