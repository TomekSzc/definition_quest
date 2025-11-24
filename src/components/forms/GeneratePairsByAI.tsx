import { type FC, type RefObject, useState } from "react";
import { useGeneratePairsMutation } from "@/store/api/apiSlice";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/store/hooks";
import AcceptPairsModal from "./AcceptPairsModal";
import type { CreateBoardFormHandle } from "./CreateBoardForm";
import { useAppDispatch } from "@/store/hooks";
import { setLoading } from "@/store/slices/uiSlice";
import { BP } from "@/constants/breakpoints";

interface IGeneratePairsByAIProps {
  formRef?: RefObject<CreateBoardFormHandle | null>; // backward compat
  remainingSlots?: number;
  onAdd?: (pairs: { term: string; definition: string }[]) => void;
}

const GeneratePairsByAI: FC<IGeneratePairsByAIProps> = ({ formRef, remainingSlots, onAdd }) => {
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
    } catch (e: unknown) {
      const apiError = (e as { data?: { message?: string } } | undefined)?.data?.message;
      showToast({ type: "error", title: "Błąd", message: apiError || "Nie udało się wygenerować" });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAccept = (selected: { term: string; definition: string }[]) => {
    if (onAdd) {
      onAdd(selected);
    } else if (formRef?.current) {
      formRef.current.addPairs(selected);
    }
    setPairs(null);
    setInputText("");
  };

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 border-0 bg-[var(--color-primary)] md:top-0 md:right-0 md:left-auto md:w-[250px] lg:w-[350px] md:h-full">
      <h3 className="font-semibold mb-2 md:pt-20">Generuj pary AI</h3>
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
        className={`mb-2 min-h-[60px] ${BP.tablet}:min-h-[80px] px-2 py-1 ${BP.tablet}:px-3 ${BP.tablet}:py-2 text-sm ${BP.tablet}:text-base`}
      />
      <Button
        onClick={handleGenerate}
        disabled={isLoading || !inputText.trim() || (remainingSlots !== undefined && remainingSlots <= 0)}
        className={`w-full cursor-pointer font-bold border-3 border-white bg-transparent hover:bg-black hover:border-black py-1 ${BP.tablet}:py-2 text-sm ${BP.tablet}:text-base`}
      >
        {isLoading ? "Generuję..." : "Generuj"}
      </Button>

      {pairs && <AcceptPairsModal pairs={pairs} onAccept={handleAccept} onCancel={() => setPairs(null)} />}
    </div>
  );
};

export default GeneratePairsByAI;
