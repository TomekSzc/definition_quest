import React, { useState } from "react";
import type { KeyboardEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import CloseIcon from "@/assets/icons/CloseIcon";

interface TagsInputProps {
  value?: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({ value = [], onChange, error }) => {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    if (!tag) return;
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (value.includes(trimmed) || value.length >= 10) return;
    onChange([...value, trimmed]);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-sm font-bold mb-1 text-[var(--color-primary)]">Tagi (max 10)</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((tag) => (
          <Badge key={tag} className="flex items-center gap-1 bg-[var(--color-primary)] text-white">
            {tag}
            <CloseIcon
              className="w-4 h-4 cursor-pointer font-bold"
              onClick={() => removeTag(tag)}
            />
          </Badge>
        ))}
      </div>
      <input
        className={`w-full px-3 py-2 border rounded bg-background text-foreground ${error ? "border-red-500" : "border-[var(--color-primary)]"}`}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Dodaj tag i naciśnij Enter"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default TagsInput;
