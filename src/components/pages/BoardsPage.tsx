import { useMemo, useState } from "react";
import type { FC } from "react";
import { usePublicBoards } from "@/lib/hooks/usePublicBoards";
import { SearchInput } from "@/components/ui/SearchInput";
import { BoardsGrid } from "@/components/ui/BoardsGrid";
import { Pagination } from "@/components/ui/Pagination";
import Providers from "../Providers";

function parseQuery(search: string) {
  const params = new URLSearchParams(search);
  const query = params.get("q")?.split(" ").filter(Boolean) ?? [];
  const page = Math.max(1, Number(params.get("page") ?? 1));
  return { query, page };
}

const BoardsPageComponent: FC = () => {
  const isBrowser = typeof window !== "undefined";
  const locationSearch = isBrowser ? window.location.search : "";
  const navigate = (path: string) => {
    if (isBrowser) {
      window.history.pushState({}, "", path);
    }
  };
  const { query: initialQuery, page: initialPage } = useMemo(() => parseQuery(locationSearch), [locationSearch]);
  const [query, setQuery] = useState<string[]>(initialQuery);
  const [page, setPage] = useState<number>(initialPage);

  const { data, meta, loading, error } = usePublicBoards({ query, page });

  const updateUrl = (newQuery: string[], newPage: number) => {
    const params = new URLSearchParams();
    if (newQuery.length) params.set("q", newQuery.join(" "));
    if (newPage > 1) params.set("page", newPage.toString());
    navigate(`/boards?${params.toString()}`);
  };

  const handleQueryChange = (val: string[]) => {
    setQuery(val);
    setPage(1);
    updateUrl(val, 1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    updateUrl(query, p);
  };

  return (
    <Providers>
        <section className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold">Public Boards</h1>
            <SearchInput value={query} onChange={handleQueryChange} />
        </header>

        {error && <p className="mb-4 rounded bg-destructive/10 p-3 text-destructive">{error}</p>}

        <BoardsGrid boards={data} loading={loading} />

        <Pagination meta={meta} onPageChange={handlePageChange} />
        </section>
    </Providers>
  );
};

import { withProviders } from "@/components/Providers";

export const BoardsPage = withProviders(BoardsPageComponent);
