import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup/Toggle-group";

interface CardCountToggleProps {
  value: 16 | 24;
  onChange: (value: 16 | 24) => void;
}

const CardCountToggle: React.FC<CardCountToggleProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="cardCount" className="block text-sm font-bold mb-1 text-[var(--color-primary)]">
        Liczba kart
      </label>
      <ToggleGroup
        id="cardCount"
        data-testid="card-count-toggle"
        type="single"
        value={value.toString()}
        onValueChange={(v) => {
          if (v === "16" || v === "24") onChange(Number(v) as 16 | 24);
        }}
        className="flex gap-2"
      >
        <ToggleGroupItem value="16" data-testid="card-count-16">
          16
        </ToggleGroupItem>
        <ToggleGroupItem value="24" data-testid="card-count-24">
          24
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default CardCountToggle;
