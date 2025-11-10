import { type FC, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { GeneratedPair } from "@/types";

interface IAcceptPairsModalProps {
  pairs: GeneratedPair[];
  onAccept: (selected: GeneratedPair[]) => void;
  onCancel: () => void;
}

const AcceptPairsModal: FC<IAcceptPairsModalProps> = ({ pairs, onAccept, onCancel }) => {
  const [selected, setSelected] = useState<boolean[]>(() => pairs.map(() => true));

  const toggle = (idx: number) => {
    setSelected((prev: boolean[]) => prev.map((v: boolean, i: number) => (i === idx ? !v : v)));
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-h-[80vh] overflow-y-auto border-3 border-[var(--color-primary)]">
        <DialogTitle className="text-[var(--color-primary)]">Wybierz pary do dodania</DialogTitle>
        <div className="space-y-2 my-4">
          {pairs.map((p: GeneratedPair, idx: number) => (
            <label key={idx} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected[idx]}
                onChange={() => toggle(idx)}
                className="h-5 w-5 cursor-pointer accent-[var(--color-primary)]"
              />
              <span className="text-black">
                <strong>{p.term}</strong> – {p.definition}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} className="cursor-pointer font-bold">
            Anuluj
          </Button>
          <Button
            onClick={() => onAccept(pairs.filter((_, i) => selected[i]))}
            disabled={!selected.some(Boolean)}
            className="cursor-pointer font-bold bg-[var(--color-primary)] text-white"
          >
            Akceptuj
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptPairsModal;
