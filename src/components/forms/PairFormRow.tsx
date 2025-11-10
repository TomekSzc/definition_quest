import React from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import type { CreateBoardFormValues } from "./CreateBoardForm";

interface PairFormRowProps {
  index: number;
  register: UseFormRegister<CreateBoardFormValues>;
  errors?: {
    term?: FieldError;
    definition?: FieldError;
  };
  onRemove: () => void;
}

const PairFormRow: React.FC<PairFormRowProps> = ({ index, register, errors, onRemove }) => {
  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        <input
          placeholder="Term"
          {...register(`pairs.${index}.term` as const)}
          className={`w-full px-3 py-2 border rounded bg-background text-foreground ${errors?.term ? "border-red-500" : "border-[var(--color-primary)]"}`}
        />
        {errors?.term && <p className="text-red-500 text-xs">{errors.term.message}</p>}
      </div>
      <div className="flex-1">
        <input
          placeholder="Definition"
          {...register(`pairs.${index}.definition` as const)}
          className={`w-full px-3 py-2 border rounded bg-background text-foreground ${errors?.definition ? "border-red-500" : "border-[var(--color-primary)]"}`}
        />
        {errors?.definition && <p className="text-red-500 text-xs">{errors.definition.message}</p>}
      </div>
      <Button type="button" variant="destructive" onClick={onRemove} className="self-center h-9">
        ×
      </Button>
    </div>
  );
};

export default PairFormRow;
