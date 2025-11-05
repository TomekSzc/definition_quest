import { useState } from "react";
import type { FC } from "react";
import { withProviders } from "@/components/Providers";
import { useQueryParams } from "@/hooks/useQueryParams";
import { usePublicBoards } from "@/hooks/usePublicBoards";
import { SearchInput } from "@/components/ui/SearchInput";
import { CardsBoard } from "@/components/ui/CardsBoard";
import { Header } from "@/components/ui/Header";

const BoardsPageComponent: FC = () => {
  const { params, setQueryParams } = useQueryParams<{ q?: string; page?: string }>();
  const initialQuery = params.q ? params.q.split(' ').filter(Boolean) : [];
  const initialPage = Math.max(1, Number(params.page ?? 1));

  const [query, setQuery] = useState<string[]>(initialQuery);
  const [page, setPage] = useState<number>(initialPage);

  const { data, meta, loading, error } = usePublicBoards({params});

  const updateUrl = (newQuery: string[], newPage: number) => {
    const searchQuery = newQuery ? newQuery : {};
    setQueryParams({...params, ...searchQuery, page: String(newPage)});
  };

//   const handleQueryChange = (val: string[]) => {
//     setQuery(val);
//     setPage(1);
//     updateUrl(val, 1); 
//   };

  const handlePageChange = (p: number) => {
    setPage(p);
    updateUrl(query, p);
  };

  return (
    <>
        <Header>
            <h1 className="text-2xl font-bold">Public Boards</h1>
        </Header>
        <div className="min-h-screen bg-secondary">
        <section className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput onChange={(s: string) => console.log('searech2222', s)} />
        </header>

        {error && <p className="mb-4 rounded bg-destructive/10 p-3 text-destructive">{error}</p>}

        <CardsBoard boards={data} loading={loading} meta={meta} onPageChange={handlePageChange} />
        </section>
        </div>
    </>
  );
};

export const BoardsPage = withProviders(BoardsPageComponent);
