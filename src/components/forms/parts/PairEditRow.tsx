import { useState } from "react";
import type { PairDTO, PairUpdateCmd } from "@/types";
import { Button } from "@/components/ui/Button";
import { CheckIcon, XIcon, EditIcon } from "@/assets/icons";

interface Props {
  pair: PairDTO;
  onSave: (pairId: string, patch: PairUpdateCmd) => void;
}

const PairEditRow: React.FC<Props> = ({ pair, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [term, setTerm] = useState(pair.term);
  const [definition, setDefinition] = useState(pair.definition);

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
            <Button size="icon" variant="ghost" onClick={handleConfirm}>
              <CheckIcon className="w-5 h-5 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={reset}>
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
            <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
              <EditIcon className="w-5 h-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PairEditRow;
