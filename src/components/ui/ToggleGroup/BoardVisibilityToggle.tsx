import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup/Toggle-group";

interface BoardVisibilityToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const BoardVisibilityToggle: React.FC<BoardVisibilityToggleProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="boardVisibility" className="block text-sm font-bold mb-1 text-[var(--color-primary)]">
        Widoczność tablicy
      </label>
      <ToggleGroup
        id="boardVisibility"
        data-testid="board-visibility-toggle"
        type="single"
        value={value ? "public" : "private"}
        onValueChange={(v) => {
          if (v === "public" || v === "private") onChange(v === "public");
        }}
        className="flex gap-2"
      >
        <ToggleGroupItem value="public" data-testid="visibility-public">
          Publiczna
        </ToggleGroupItem>
        <ToggleGroupItem value="private" data-testid="visibility-private">
          Prywatna
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default BoardVisibilityToggle;
