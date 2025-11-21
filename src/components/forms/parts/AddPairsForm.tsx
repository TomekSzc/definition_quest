import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon } from "@/assets/icons";
import { useAddPairMutation } from "@/store/api/apiSlice";
import { useToast } from "@/store/hooks";
import type { PairCreateCmd, PairDTO } from "@/types";

interface AddPairsFormProps {
  boardId: string;
  existingCount: number;
  cardCount: number;
  onPairAdded: (pair: PairDTO) => void;
}

const AddPairsForm: React.FC<AddPairsFormProps> = ({ boardId, existingCount, cardCount, onPairAdded }) => {
  const { showToast } = useToast();
  const [addPair] = useAddPairMutation();
  const [draftPairs, setDraftPairs] = useState<{ term: string; definition: string }[]>([]);

  const remainingSlots = cardCount / 2 - existingCount - draftPairs.length;

  const addDraftRow = () => {
    if (remainingSlots <= 0) return;
    setDraftPairs((prev) => [...prev, { term: "", definition: "" }]);
  };

  const removeDraftRow = (index: number) => {
    setDraftPairs((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDraftRow = async (index: number) => {
    const pair = draftPairs[index];
    if (!pair.term.trim() || !pair.definition.trim()) {
      showToast({ type: "error", title: "Błąd", message: "Uzupełnij termin i definicję" });
      return;
    }
    try {
      const created = await addPair({
        boardId,
        pair: { term: pair.term.trim(), definition: pair.definition.trim() } as PairCreateCmd,
      }).unwrap();
      onPairAdded(created);
      setDraftPairs((prev) => prev.filter((_, i) => i !== index));
      showToast({ type: "success", title: "Zapisano", message: "Para dodana" });
    } catch (e: unknown) {
      const apiError = (e as { data?: { error?: string } } | undefined)?.data?.error;
      showToast({ type: "error", title: "Błąd", message: apiError || "Nie udało się zapisać" });
    }
  };

  return (
    <>
      {draftPairs.map((draft, idx) => (
        <div
          key={idx}
          className="flex flex-wrap gap-2 items-start border rounded p-3 bg-background"
          data-testid={`add-pair-draft-${idx}`}
        >
          <input
            data-testid={`add-pair-term-${idx}`}
            className="flex-1 px-3 py-2 border rounded bg-background text-foreground border-[var(--color-primary)]"
            placeholder="Słowo"
            value={draft.term}
            onChange={(e) => {
              const val = e.target.value;
              setDraftPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, term: val } : p)));
            }}
          />
          <input
            data-testid={`add-pair-definition-${idx}`}
            className="flex-1 px-3 py-2 border rounded bg-background text-foreground border-[var(--color-primary)]"
            placeholder="Definicja"
            value={draft.definition}
            onChange={(e) => {
              const val = e.target.value;
              setDraftPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, definition: val } : p)));
            }}
          />
          <div className="flex gap-1 self-center">
            <Button
              data-testid={`add-pair-save-${idx}`}
              size="icon"
              variant="ghost"
              onClick={() => saveDraftRow(idx)}
              className="cursor-pointer"
            >
              <CheckIcon className="w-5 h-5 text-green-600" />
            </Button>
            <Button
              data-testid={`add-pair-cancel-${idx}`}
              size="icon"
              variant="ghost"
              onClick={() => removeDraftRow(idx)}
              className="cursor-pointer"
            >
              <XIcon className="w-5 h-5 text-red-600" />
            </Button>
          </div>
        </div>
      ))}
      {remainingSlots > 0 && (
        <Button
          data-testid="add-pair-button"
          type="button"
          variant="secondary"
          onClick={addDraftRow}
          className="cursor-pointer font-bold border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
        >
          + Dodaj parę ({remainingSlots})
        </Button>
      )}
    </>
  );
};

export default AddPairsForm;
