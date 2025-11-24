import { type FC, useRef, useEffect, useState } from "react";
import { withProviders } from "@/components/HOC/Providers";
import LoaderOverlay from "@/components/ui/LoaderOverlay";
import AddLevelForm, { type AddLevelFormHandle } from "@/components/forms/AddLevelForm";
import GeneratePairsByAI from "@/components/forms/GeneratePairsByAI";
import { useGetBoardByIdQuery } from "@/store/api/apiSlice";

interface AddLevelPageProps extends Record<string, unknown> {
  boardId: string;
}

const AddLevelPageComponent: FC<AddLevelPageProps> = ({ boardId }) => {
  const formRef = useRef<AddLevelFormHandle>(null);
  const { data: board, isFetching } = useGetBoardByIdQuery(boardId);

  const [remainingSlots, setRemainingSlots] = useState(0);

  useEffect(() => {
    if (!board) return;
    const pairs =
      formRef.current && "getPairs" in formRef.current ? (formRef.current as { getPairs: () => number }).getPairs() : 0;
    setRemainingSlots(board.cardCount / 2 - pairs);
  }, [board]);

  if (isFetching || !board) {
    return <LoaderOverlay />;
  }

  return (
    <div className="flex flex-wrap justify-start p-4 gap-8 bg-secondary relative min-h-[85vh] md:pl-[80px]">
      <LoaderOverlay />
      <div className="flex-1 min-w-[320px] max-w-3xl space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-primary)]">{board.title}</h2>
        <AddLevelForm ref={formRef} rootId={boardId} cardCount={board.cardCount as 16 | 24} />
      </div>
      <div className="w-full md:w-80 lg:w-96 sticky top-20 self-start">
        <GeneratePairsByAI remainingSlots={remainingSlots} onAdd={(pairs) => formRef.current?.addPairs(pairs)} />
      </div>
    </div>
  );
};

export const AddLevelPage = withProviders<AddLevelPageProps>(AddLevelPageComponent);
export default AddLevelPage;
