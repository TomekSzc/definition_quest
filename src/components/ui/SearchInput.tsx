import { useCallback, useRef, useState } from "react";
import type { FC } from "react";
import debounce  from "lodash.debounce";

interface ISearchInputProps {
  onChange: (value: string) => void;
}

export const SearchInput: FC<ISearchInputProps> = ({ onChange }) => {

  const debouncedSearch = debounce(async (search: string) => {
    onChange(search);
  }, 300);
  
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => debouncedSearch(e.target.value);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-primary)] bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--color-primary)] ">
      <input
        onChange={handleOnChange}
        placeholder="Szukaj..."
        aria-label="Pole wyszukiwania"
        className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-sm text-[var(--color-primary)] placeholder-[var(--color-primary)] focus:outline-none"
      />
      {/* {value.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          aria-label="Wyczyść wyszukiwanie"
          className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )} */}
    </div>
  );
};
