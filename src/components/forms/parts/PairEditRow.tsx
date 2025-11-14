import { useState } from "react";
import type { PairDTO, PairUpdateCmd } from "@/types";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon, EditIcon, DeleteIcon } from "@/assets/icons";
import { useDeletePairMutation } from "@/store/api/apiSlice";
import { useToast } from "@/store/hooks";

interface Props {
  boardId: string;
  pair: PairDTO;
  onSave: (pairId: string, patch: PairUpdateCmd) => void;
  onDelete: (pairId: string) => void;
}

const PairEditRow: React.FC<Props> = ({ pair, boardId, onSave, onDelete }) => {
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
    <div className="flex flex-col gap-2 border rounded p-3 bg-background">
      {isEditing ? (
        <>
          <input
            className="border rounded px-2 py-1 w-full"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Termin"
          />
          <textarea
            className="border rounded px-2 py-1 w-full"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Definicja"
          />
          <div className="flex gap-2 justify-end">
            <Button size="icon" variant="ghost" className="cursor-pointer" onClick={handleConfirm}>
              <CheckIcon className="w-5 h-5 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="cursor-pointer" onClick={reset}>
              <XIcon className="w-5 h-5 text-red-600" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <p className="font-semibold break-words">{pair.term}</p>
              <p className="text-sm break-words mt-1 opacity-80">{pair.definition}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="cursor-pointer">
                <EditIcon className="w-[30px] h-[30px] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded p-1 transition-colors" />
              </button>
              <button
                onClick={async () => {
                  try {
                    await deletePair({ boardId, pairId: pair.id }).unwrap();
                    onDelete(pair.id);
                    showToast({ type: "success", title: "Usunięto", message: "Para usunięta" });
                  } catch (e: any) {
                    showToast({ type: "error", title: "Błąd", message: e?.data?.error || "Nie udało się usunąć" });
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
