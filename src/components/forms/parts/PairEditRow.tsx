import { useState } from "react";
import type { PairDTO, PairUpdateCmd } from "@/types";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon, EditIcon, DeleteIcon } from "@/assets/icons";
import { useDeletePairMutation } from "@/store/api/apiSlice";
import { useToast } from "@/store/hooks";

interface IPairEditRow {
  boardId: string;
  pair: PairDTO;
  onSave: (pairId: string, patch: PairUpdateCmd) => void;
  onDelete: (pairId: string) => void;
}

const PairEditRow: React.FC<IPairEditRow> = ({ pair, boardId, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [term, setTerm] = useState(pair.term);
  const [definition, setDefinition] = useState(pair.definition);
  const [deletePair] = useDeletePairMutation();
  const { showToast } = useToast();

  const reset = () => {
    setTerm(pair.term);
    setDefinition(pair.definition);
    setIsEditing(false);
  };

  const handleConfirm = () => {
    const patch: PairUpdateCmd = {};
    if (term.trim() !== pair.term) patch.term = term.trim();
    if (definition.trim() !== pair.definition) patch.definition = definition.trim();

    if (Object.keys(patch).length === 0) {
      setIsEditing(false);
      return;
    }

    onSave(pair.id, patch);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 border rounded p-3 bg-background" data-testid={`pair-edit-row-${pair.id}`}>
      {isEditing ? (
        <>
          <input
            data-testid={`pair-edit-term-${pair.id}`}
            className="border rounded px-2 py-1 w-full"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Termin"
          />
          <textarea
            data-testid={`pair-edit-definition-${pair.id}`}
            className="border rounded px-2 py-1 w-full"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Definicja"
          />
          <div className="flex gap-2 justify-end">
            <Button
              data-testid={`pair-edit-save-${pair.id}`}
              size="icon"
              variant="ghost"
              className="cursor-pointer"
              onClick={handleConfirm}
            >
              <CheckIcon className="w-5 h-5 text-green-600" />
            </Button>
            <Button
              data-testid={`pair-edit-cancel-${pair.id}`}
              size="icon"
              variant="ghost"
              className="cursor-pointer"
              onClick={reset}
            >
              <XIcon className="w-5 h-5 text-red-600" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="font-semibold break-words" data-testid={`pair-term-${pair.id}`}>
                {pair.term}
              </p>
              <p className="text-sm break-words mt-1 opacity-80" data-testid={`pair-definition-${pair.id}`}>
                {pair.definition}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                data-testid={`pair-edit-button-${pair.id}`}
                onClick={() => setIsEditing(true)}
                className="cursor-pointer"
              >
                <EditIcon className="w-[30px] h-[30px] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded p-1 transition-colors" />
              </button>
              <button
                data-testid={`pair-delete-button-${pair.id}`}
                onClick={async () => {
                  try {
                    await deletePair({ boardId, pairId: pair.id }).unwrap();
                    onDelete(pair.id);
                    showToast({ type: "success", title: "Usunięto", message: "Para usunięta" });
                  } catch (e: unknown) {
                    const apiError = (e as { data?: { error?: string } } | undefined)?.data?.error;
                    showToast({ type: "error", title: "Błąd", message: apiError || "Nie udało się usunąć" });
                  }
                }}
                className="cursor-pointer"
              >
                <DeleteIcon className="w-[30px] h-[30px] text-[var(--color-primary)] hover:bg-red-500 hover:text-white rounded p-1 transition-colors" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PairEditRow;
