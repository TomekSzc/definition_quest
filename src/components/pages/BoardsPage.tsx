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
  const { data, isFetching } = useListPublicBoardsQuery((params as unknown as Partial<ListBoardsQuery>));


  const handleQueryChange = (val: string) => {
    const searchQuery = val ? {q: val} : {};
    setQueryParams({...params, ...searchQuery});
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

        <CardsBoard boards={data?.data} loading={isFetching} meta={data?.meta} />
        </section>
        </div>
    </>
  );
};

export const BoardsPage = withProviders(BoardsPageComponent);
