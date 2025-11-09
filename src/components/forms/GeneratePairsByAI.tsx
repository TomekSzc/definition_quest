import React, { useState } from "react";
import { useGeneratePairsMutation } from "@/store/api/apiSlice";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/store/hooks";
import AcceptPairsModal from "./AcceptPairsModal";
import type { CreateBoardFormHandle } from "./CreateBoardForm";

interface Props {
  formRef: React.RefObject<CreateBoardFormHandle | null>;
}

const GeneratePairsByAI: React.FC<Props> = ({ formRef }) => {
  const [inputText, setInputText] = useState("");
  const [generatePairs, { isLoading }] = useGeneratePairsMutation();
  const { showToast } = useToast();
  const [pairs, setPairs] = useState<{ term: string; definition: string }[] | null>(null);

  const handleGenerate = async () => {
    try {
      const result = await generatePairs({ title: "temp", inputText, cardCount: 16, isPublic: false }).unwrap();
      setPairs(result.pairs);
    } catch (e: any) {
      showToast({ type: "error", title: "Błąd", message: e?.data?.message || "Nie udało się wygenerować" });
    }
  };

  const handleAccept = (selected: { term: string; definition: string }[]) => {
    formRef.current?.addPairs(selected);
    setPairs(null);
    setInputText("");
  };

  return (
    <div className="p-4 border rounded bg-muted">
      <h3 className="font-semibold mb-2">Generuj pary AI</h3>
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Wklej tekst (≤ 5000 znaków)"
        className="mb-2"
      />
      <Button onClick={handleGenerate} disabled={isLoading || !inputText.trim()} className="w-full">
        {isLoading ? "Generuję..." : "Generuj"}
      </Button>

      {pairs && (
        <AcceptPairsModal pairs={pairs} onAccept={handleAccept} onCancel={() => setPairs(null)} />
      )}
    </div>
  );
};

export default GeneratePairsByAI;
