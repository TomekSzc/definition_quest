import { useCallback, useRef, useState } from "react";
import type { FC } from "react";
import type { SearchInputProps } from "@/types";
import { X } from "lucide-react";
import clsx from "clsx";

/**
 * Reużywalny komponent inputu wyszukiwania akceptujący wiele fraz/tagów.
 * - Wartością jest tablica stringów.
 * - Dodaje frazę po naciśnięciu Enter lub przecinka.
 * - Pozwala usuwać pojedyncze tagi lub wyczyścić całość.
 */
export const SearchInput: FC<SearchInputProps> = ({ value, onChange }) => {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addDraft = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (trimmed.length > 100 || value.length >= 10) return; // validation guard
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setDraft("");
  }, [draft, onChange, value]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraft();
    } else if (e.key === "Backspace" && !draft && value.length) {
      // Backspace on empty draft removes last tag
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => onChange(value.filter((_, i) => i !== index));

  const clearAll = () => {
    setDraft("");
    onChange([]);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
      {value.map((tag, idx) => (
        <span
          key={idx}
          className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm text-muted-foreground"
        >
          {tag}
          <button
            type="button"
            aria-label={`Usuń tag ${tag}`}
            onClick={() => removeTag(idx)}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Szukaj..."
        aria-label="Pole wyszukiwania"
        className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-sm focus:outline-none"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          aria-label="Wyczyść wyszukiwanie"
          className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
