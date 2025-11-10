import React, { forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateBoardSchema } from "@/lib/validation/boards";
import { Button } from "@/components/ui/Button";
import TagsInput from "../ui/TagsInput";
import CardCountToggle from "../ui/ToggleGroup/CardCountToggle";
import PairFormRow from "./PairFormRow";
import { useToast } from "@/store/hooks";
import { Routes } from "@/lib/routes";

export type SubmitFn = (payload: any) => Promise<any>;

export type CreateBoardFormValues = z.infer<typeof CreateBoardSchema>;

interface ICreateBoardForm {
  submitFn: SubmitFn;
}

const defaultValues: CreateBoardFormValues = {
  title: "",
  cardCount: 16,
  pairs: [{ term: "", definition: "" }],
  isPublic: true,
  tags: [],
};

export interface CreateBoardFormHandle {
  addPairs: (pairs: { term: string; definition: string }[]) => void;
}

const CreateBoardForm = forwardRef<CreateBoardFormHandle, ICreateBoardForm>(({ submitFn }, ref) => {
  const { showToast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateBoardFormValues>({
    resolver: zodResolver(CreateBoardSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pairs",
  });

  const appendPairs = (pairs: { term: string; definition: string }[]) => {
    pairs.forEach((p) => {
      if (fields.length < 100) {
        append(p);
      }
    });
  };

  useImperativeHandle(ref, () => ({ addPairs: appendPairs }));

  const onSubmit = async (values: CreateBoardFormValues) => {
    try {
      await submitFn(values as any);
      showToast({ type: "success", title: "Sukces", message: "Tablica utworzona" });
      window.location.href = Routes.MyBoards;
    } catch (e) {
      showToast({ type: "error", title: "Błąd", message: "Nie udało się utworzyć tablicy" });
    }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-10">
      {/* Title */}
      <div>
        <label className="block text-sm text-[var(--color-primary)] font-bold mb-1">Tytuł tablicy</label>
        <input
          {...register("title")}
          className={`w-full px-3 py-2 border rounded bg-background text-foreground ${errors.title ? "border-red-500" : "border-[var(--color-primary)]"}`}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      {/* Tags */}
      <Controller
        control={control}
        name="tags"
        render={({ field }) => <TagsInput {...field} error={errors.tags?.message as string | undefined} />}
      />

      {/* Card Count Toggle */}
      <Controller
        control={control}
        name="cardCount"
        render={({ field }) => <CardCountToggle {...field} />}
      />

      {/* Pairs Field Array */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--color-primary)]">Pary termin – definicja</h3>
        {fields.map((field: { id: string }, index: number) => (
          <PairFormRow
            key={field.id}
            index={index}
            register={register}
            errors={errors.pairs?.[index]}
            onRemove={() => remove(index)}
          />
        ))}
        {errors.pairs && typeof errors.pairs.message === "string" && (
          <p className="text-red-500 text-xs">{errors.pairs.message}</p>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => append({ term: "", definition: "" })}
          disabled={fields.length >= 100}
            className="cursor-pointer font-bold border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
        >
          + Dodaj parę
        </Button>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button type="submit" disabled={isSubmitting} className="font-bold bg-[var(--color-primary)] text-white cursor-pointer">
          Utwórz tablicę
        </Button>
      </div>
    </form>
  );
});

export default CreateBoardForm;
