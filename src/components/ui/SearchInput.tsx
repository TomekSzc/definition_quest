import { useEffect, useRef } from "react";
import type { FC } from "react";
import debounce from "lodash.debounce";
import { X } from "lucide-react";
import { useRefValue } from "@/hooks/useRefValue";

interface ISearchInputProps {
  onChange: (value: string) => void;
  initialValue?: string;
}

export const SearchInput: FC<ISearchInputProps> = ({ onChange, initialValue }) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const value = useRefValue(searchRef);

  const debouncedSearch = debounce(async (search: string) => {
    onChange(search);
  }, 300);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => debouncedSearch(e.target.value);
  const clearAll = () => {
    if (searchRef.current) searchRef.current.value = "";
    onChange("");
  };

  useEffect(() => {
    if (initialValue && searchRef.current) {
      searchRef.current.value = initialValue;
    }
  }, []);

  return (
    <div className="relative flex items-center rounded-md border border-[var(--color-primary)] bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--color-primary)] w-full h-[50px] border-2">
      <input
        ref={searchRef}
        onChange={handleOnChange}
        placeholder="Szukaj..."
        aria-label="Pole wyszukiwania"
        className="w-full border-0 bg-transparent pr-8 text-sm text-[var(--color-primary)] placeholder-[var(--color-primary)] focus:outline-none"
      />
      {value && value.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          aria-label="Wyczyść wyszukiwanie"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-primary)] hover:text-[var(--color-muted)] focus:outline-none"
          style={{ zIndex: 1 }}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
