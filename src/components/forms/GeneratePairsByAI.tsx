import { type FC, type RefObject, useState } from "react";
import { useGeneratePairsMutation } from "@/store/api/apiSlice";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/store/hooks";
import AcceptPairsModal from "./AcceptPairsModal";
import type { CreateBoardFormHandle } from "./CreateBoardForm";
import { useAppDispatch } from "@/store/hooks";
import { setLoading } from "@/store/slices/uiSlice";

interface IGeneratePairsByAIProps {
  formRef: RefObject<CreateBoardFormHandle | null>;
}

const GeneratePairsByAI: FC<IGeneratePairsByAIProps> = ({ formRef }) => {
  const dispatch = useAppDispatch();
  const [inputText, setInputText] = useState("");
  const [generatePairs, { isLoading }] = useGeneratePairsMutation();
  const { showToast } = useToast();
  const [pairs, setPairs] = useState<{ term: string; definition: string }[] | null>(null);

  const handleGenerate = async () => {
    try {
      dispatch(setLoading(true));
      const result = await generatePairs({ title: "temp", inputText, cardCount: 16, isPublic: false }).unwrap();
      setPairs(result.pairs);
    } catch (e: any) {
      showToast({ type: "error", title: "Błąd", message: e?.data?.message || "Nie udało się wygenerować" });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAccept = (selected: { term: string; definition: string }[]) => {
    formRef.current?.addPairs(selected);
    setPairs(null);
    setInputText("");
  };

  return (
    <div className="p-4 border rounded bg-[var(--color-primary)] fixed right-0 top-0 w-[350px] h-full border-0">
      <h3 className="font-semibold mb-2 pt-20">Generuj pary AI</h3>
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            if (!isLoading && inputText.trim()) {
              handleGenerate();
            }
          }
        }}
        placeholder="Wklej tekst (≤ 5000 znaków)"
        className="mb-2"
      />
      <Button
        onClick={handleGenerate}
        disabled={isLoading || !inputText.trim()}
        className="w-full cursor-pointer font-bold border-3 border-white bg-transparent hover:bg-black hover:border-black"
      >
        {isLoading ? "Generuję..." : "Generuj"}
      </Button>

      {pairs && (
        <AcceptPairsModal pairs={pairs} onAccept={handleAccept} onCancel={() => setPairs(null)} />
      )}
    </div>
  );
};

export default GeneratePairsByAI;
