import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface AcceptPairsModalProps {
  pairs: { term: string; definition: string }[];
  onAccept: (selected: { term: string; definition: string }[]) => void;
  onCancel: () => void;
}

const AcceptPairsModal: React.FC<AcceptPairsModalProps> = ({ pairs, onAccept, onCancel }) => {
  const [selected, setSelected] = useState(() => pairs.map(() => true));

  const toggle = (idx: number) => {
    setSelected((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogTitle>Wybierz pary do dodania</DialogTitle>
        <div className="space-y-2 my-4">
          {pairs.map((p, idx) => (
            <label key={idx} className="flex items-start gap-2">
              <input type="checkbox" checked={selected[idx]} onChange={() => toggle(idx)} />
              <span className="text-black">
                <strong>{p.term}</strong> – {p.definition}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Anuluj
          </Button>
          <Button
            onClick={() => onAccept(pairs.filter((_, i) => selected[i]))}
            disabled={!selected.some(Boolean)}
          >
            Akceptuj
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptPairsModal;
