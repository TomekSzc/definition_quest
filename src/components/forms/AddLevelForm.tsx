import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm, useFieldArray, type FieldError, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import PairFormRow from "./PairFormRow";
import { useAddLevelMutation } from "@/store/api/apiSlice";
import type { PairCreateCmd } from "@/types";
import { useToast } from "@/store/hooks";
import { setLoading } from "@/store/slices/uiSlice";
import { useAppDispatch } from "@/store/hooks";
import { Routes } from "@/lib/routes";

export const AddLevelSchema = z.object({
  pairs: z
    .array(
      z.object({
        term: z.string().trim().min(1, "Wymagane"),
        definition: z.string().trim().min(1, "Wymagane"),
      })
    )
    .nonempty("Dodaj co najmniej jedną parę"),
});

export type AddLevelFormValues = z.infer<typeof AddLevelSchema>;

export interface AddLevelFormHandle {
  addPairs: (pairs: { term: string; definition: string }[]) => void;
}

interface AddLevelFormProps {
  rootId: string;
  cardCount: 16 | 24;
}

const AddLevelForm = forwardRef<AddLevelFormHandle, AddLevelFormProps>(({ rootId, cardCount }, ref) => {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [saveMode, setSaveMode] = useState<"save" | "saveAndContinue">("save");

  const [addLevel] = useAddLevelMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddLevelFormValues>({
    resolver: zodResolver(AddLevelSchema),
    defaultValues: { pairs: [{ term: "", definition: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "pairs" });

  const appendPairs = (pairs: { term: string; definition: string }[]) => {
    pairs.forEach((p) => {
      if (fields.length < cardCount / 2) {
        append(p);
      }
    });
  };

  useImperativeHandle(ref, () => ({ addPairs: appendPairs }));

  const onSubmit = async (values: AddLevelFormValues) => {
    if (values.pairs.length > cardCount / 2) {
      showToast({
        type: "error",
        title: "Błąd",
        message: `Maksymalna liczba par dla tego poziomu to ${cardCount / 2}`,
      });
      return;
    }

    dispatch(setLoading(true));
    try {
      await addLevel({ boardId: rootId, pairs: values.pairs as unknown as PairCreateCmd[] }).unwrap();
      showToast({ type: "success", title: "Sukces", message: "Poziom zapisany" });
      if (saveMode === "save") {
        window.location.href = Routes.Boards;
      } else {
        reset({ pairs: [] });
      }
    } catch (e: unknown) {
      const apiError = (e as { data?: { message?: string } } | undefined)?.data?.message;
      showToast({ type: "error", title: "Błąd", message: apiError || "Nie udało się zapisać" });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const remainingSlots = cardCount / 2 - fields.length;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-10 pb-60 md:pb-10">
      <div className="space-y-4">
        <h3 className="font-semibold text-[var(--color-primary)]">Pary termin – definicja</h3>
        {fields.map((field, index) => (
          <PairFormRow
            key={field.id}
            index={index}
            register={
              register as unknown as UseFormRegister<{
                pairs: { term: string; definition: string }[];
                cardCount: 16 | 24;
                title: string;
                isPublic: boolean;
                tags?: string[];
              }>
            }
            errors={errors.pairs?.[index] as { term?: FieldError; definition?: FieldError } | undefined}
            onRemove={() => remove(index)}
          />
        ))}
        {remainingSlots > 0 && (
          <Button
            data-testid="add-pair-button"
            type="button"
            variant="secondary"
            onClick={() => append({ term: "", definition: "" })}
            className="cursor-pointer font-bold border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
          >
            + Dodaj parę ({remainingSlots})
          </Button>
        )}
        {errors.pairs && typeof errors.pairs.message === "string" && (
          <p className="text-red-500 text-xs">{errors.pairs.message}</p>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          data-testid="save-level-button"
          type="submit"
          disabled={isSubmitting}
          className="font-bold bg-[var(--color-primary)] text-white cursor-pointer"
          onClick={() => setSaveMode("save")}
        >
          Zapisz
        </Button>
        <Button
          data-testid="save-and-continue-level-button"
          type="submit"
          variant="outline"
          disabled={isSubmitting}
          className="font-bold border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white cursor-pointer"
          onClick={() => setSaveMode("saveAndContinue")}
        >
          Zapisz i utwórz kolejny level
        </Button>
      </div>
    </form>
  );
});
AddLevelForm.displayName = "AddLevelForm";

export default AddLevelForm;
