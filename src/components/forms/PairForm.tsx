import { type FC } from "react";
import type { UseFormRegister, FieldError } from "react-hook-form";
import PairFormRow from "./PairFormRow";
import type { CreateBoardFormValues } from "./CreateBoardForm";

interface PairFormProps {
  fields: { id: string }[];
  errors?: {
    term?: FieldError;
    definition?: FieldError;
  }[];
  register: UseFormRegister<CreateBoardFormValues>;
  remove: (index: number) => void;
  cardCount: 16 | 24;
}

const PairForm: FC<PairFormProps> = ({ fields, errors = [], register, remove, cardCount }) => {
  const maxPerLevel = cardCount / 2;

  return (
    <>
      {fields.map((field, index) => {
        const levelIndex = Math.floor(index / maxPerLevel);
        const isFirstInLevel = index % maxPerLevel === 0;
        return (
          <div key={field.id}>
            {isFirstInLevel && <div className="font-bold text-[var(--color-primary)]">Level: {levelIndex + 1}</div>}
            <PairFormRow index={index} register={register} errors={errors[index]} onRemove={() => remove(index)} />
          </div>
        );
      })}
    </>
  );
};

export default PairForm;
