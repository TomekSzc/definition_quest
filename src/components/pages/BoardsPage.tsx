import type { FC } from "react";
import { withProviders } from "@/components/Providers";
import { useQueryParams } from "@/hooks/useQueryParams";
import { SearchInput } from "@/components/ui/SearchInput";
import { CardsBoard } from "@/components/ui/CardsBoard";
import { Header } from "@/components/ui/Header";
import { useListPublicBoardsQuery } from "@/store/api/apiSlice";
import type { ListBoardsQuery } from "@/types";

const BoardsPageComponent: FC = () => {
  const { params, setQueryParams } = useQueryParams<{ q?: string; page?: string }>();
  const { data, isFetching, error } = useListPublicBoardsQuery((params as unknown as Partial<ListBoardsQuery>));

  const updateUrl = (newQuery: string, newPage: number) => {
    const searchQuery = newQuery ? {q: newQuery} : {};
    setQueryParams({...params, ...searchQuery, page: String(newPage)});
  };

  const handleQueryChange = (val: string) => {
    updateUrl(val, 1); 
  };

  const handlePageChange = (p: number) => {
    updateUrl(params.q ?? '', p);
  };

  return (
    <>
        <Header>
            <h1 className="text-2xl font-bold">Public Boards</h1>
        </Header>
        <div className="min-h-screen bg-secondary">
        <section className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput onChange={handleQueryChange} />
        </header>

        <CardsBoard boards={data?.data} loading={isFetching} meta={data?.meta} onPageChange={handlePageChange} />
        </section>
        </div>
    </>
  );
};

export const BoardsPage = withProviders(BoardsPageComponent);
