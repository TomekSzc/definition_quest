import { type FC } from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import type { CreateBoardFormValues } from "./CreateBoardForm";

interface IPairFormRowProps {
  index: number;
  register: UseFormRegister<CreateBoardFormValues>;
  errors?: {
    term?: FieldError;
    definition?: FieldError;
  };
  onRemove: () => void;
}

const PairFormRow: FC<IPairFormRowProps> = ({ index, register, errors, onRemove }) => {
  return (
    <div className="flex gap-2 items-start" data-testid={`pair-row-${index}`}>
      <div className="flex-1">
        <input
          placeholder="Słowo"
          data-testid={`pair-term-${index}`}
          {...register(`pairs.${index}.term` as const)}
          className={`w-full px-3 py-2 border rounded bg-background text-foreground ${errors?.term ? "border-red-500" : "border-[var(--color-primary)]"}`}
        />
        {errors?.term && <p className="text-red-500 text-xs">{errors.term.message}</p>}
      </div>
      <div className="flex-1">
        <input
          placeholder="Definicja"
          data-testid={`pair-definition-${index}`}
          {...register(`pairs.${index}.definition` as const)}
          className={`w-full px-3 py-2 border rounded bg-background text-foreground ${errors?.definition ? "border-red-500" : "border-[var(--color-primary)]"}`}
        />
        {errors?.definition && <p className="text-red-500 text-xs">{errors.definition.message}</p>}
      </div>
      <Button
        type="button"
        variant="destructive"
        data-testid={`remove-pair-${index}`}
        onClick={onRemove}
        className="self-center h-9 w-9 flex items-center justify-center cursor-pointer font-bold text-lg"
      >
        ×
      </Button>
    </div>
  );
};

export default PairFormRow;
