import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CardCountToggleProps {
  value: 16 | 24;
  onChange: (value: 16 | 24) => void;
}

const CardCountToggle: React.FC<CardCountToggleProps> = ({ value, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">Liczba kart</label>
      <ToggleGroup
        type="single"
        value={value.toString()}
        onValueChange={(v) => {
          if (v === "16" || v === "24") onChange(Number(v) as 16 | 24);
        }}
        className="flex gap-2"
      >
        <ToggleGroupItem value="16">16</ToggleGroupItem>
        <ToggleGroupItem value="24">24</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default CardCountToggle;
