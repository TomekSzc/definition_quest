import React, { forwardRef, useImperativeHandle } from "react";
import { useForm, useFieldArray, Controller, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateBoardSchema } from "@/lib/validation/boards";
import { Button } from "@/components/ui/Button";
import TagsInput from "../ui/TagsInput";
import CardCountToggle from "../ui/ToggleGroup/CardCountToggle";
import BoardVisibilityToggle from "../ui/ToggleGroup/BoardVisibilityToggle";
import { useToast } from "@/store/hooks";
import { Routes } from "@/lib/routes";
import PairForm from "./PairForm";
import { useAppDispatch } from "@/store/hooks";
import { setLoading } from "@/store/slices/uiSlice";

export type SubmitFn = (payload: CreateBoardFormValues) => Promise<unknown>;

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
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
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

    // Remove empty pairs after adding new ones
    setTimeout(() => {
      const currentPairs = getValues("pairs");
      const indicesToRemove: number[] = [];

      currentPairs.forEach((pair, index) => {
        if (!pair.term.trim() && !pair.definition.trim()) {
          indicesToRemove.push(index);
        }
      });

      // Remove in reverse order to maintain correct indices
      indicesToRemove.reverse().forEach((index) => {
        remove(index);
      });
    }, 0);
  };

  useImperativeHandle(ref, () => ({ addPairs: appendPairs }));

  const onSubmit = async (values: CreateBoardFormValues) => {
    dispatch(setLoading(true));
    try {
      await submitFn(values);
      showToast({ type: "success", title: "Sukces", message: "Tablica utworzona" });
      dispatch(setLoading(false));
      window.location.assign(Routes.MyBoards);
    } catch {
      showToast({ type: "error", title: "Błąd", message: "Nie udało się utworzyć tablicy" });
      dispatch(setLoading(false));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-10 pb-60 md:pb-10">
      {/* Title */}
      <div>
        <label htmlFor="boardTitle" className="block text-sm text-[var(--color-primary)] font-bold mb-1">
          Tytuł tablicy
        </label>
        <input
          id="boardTitle"
          data-testid="board-title-input"
          {...register("title")}
          placeholder="Dodaj tytuł"
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
      <Controller control={control} name="cardCount" render={({ field }) => <CardCountToggle {...field} />} />

      {/* Board Visibility Toggle */}
      <Controller control={control} name="isPublic" render={({ field }) => <BoardVisibilityToggle {...field} />} />

      {/* Pairs Field Array */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--color-primary)]">Pary termin – definicja</h3>
        <PairForm
          fields={fields}
          errors={errors.pairs as { term?: FieldError; definition?: FieldError }[] | undefined}
          register={register}
          remove={remove}
          cardCount={watch("cardCount") as 16 | 24}
        />
        {errors.pairs && typeof errors.pairs.message === "string" && (
          <p className="text-red-500 text-xs">{errors.pairs.message}</p>
        )}
        <Button
          type="button"
          variant="secondary"
          data-testid="add-pair-button"
          onClick={() => append({ term: "", definition: "" })}
          disabled={fields.length >= 100}
          className="cursor-pointer font-bold border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
        >
          + Dodaj parę
        </Button>
      </div>

      {/* Submit */}
      <div className="pt-4">
        <Button
          type="submit"
          data-testid="create-board-submit"
          disabled={isSubmitting}
          className="font-bold bg-[var(--color-primary)] text-white cursor-pointer"
        >
          Utwórz tablicę
        </Button>
      </div>
    </form>
  );
});
CreateBoardForm.displayName = "CreateBoardForm";

export default CreateBoardForm;
