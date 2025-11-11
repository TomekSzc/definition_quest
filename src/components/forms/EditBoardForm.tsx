import type { FC } from "react";
import { useState } from "react";
import type { BoardViewDTO, EditBoardVM, PatchBoardCmd, PairUpdateCmd, PairDTO } from "@/types";
import BoardTitleInput from "./parts/BoardTitleInput";
import PairEditList from "./parts/PairEditList";
import { useUpdateBoardMetaMutation, useUpdatePairMutation } from "@/store/api/apiSlice";
import { useToast } from "@/store/hooks";
import { Button } from "@/components/ui/Button";

interface Props {
  board: BoardViewDTO;
  onRefresh: () => void;
}

const mapToVM = (data: BoardViewDTO): EditBoardVM => ({
  id: data.id,
  title: data.title,
  pairs: data.pairs,
  tags: data.tags,
  isPublic: data.isPublic,
  archived: data.archived,
});

const EditBoardForm: FC<Props> = ({ board, onRefresh }) => {
  const [vm, setVm] = useState<EditBoardVM>(() => mapToVM(board));
  const [updateMeta] = useUpdateBoardMetaMutation();
  const [updatePair] = useUpdatePairMutation();
  const { showToast } = useToast();

  const handleTitleSave = async (title: string) => {
    if (title === vm.title) return;
    try {
      await updateMeta({ id: vm.id, payload: { title } as PatchBoardCmd }).unwrap();
      setVm((prev) => ({ ...prev, title }));
      showToast({ type: "success", title: "Zapisano", message: "Tytuł zaktualizowany" });
      onRefresh();
    } catch (e: any) {
      showToast({ type: "error", title: "Błąd", message: e.data?.error || "Nie udało się zapisać" });
    }
  };

  const handlePairSave = async (pairId: string, patch: PairUpdateCmd) => {
    try {
      const updated = await updatePair({ boardId: vm.id, pairId, payload: patch }).unwrap();
      setVm((prev) => ({
        ...prev,
        pairs: prev.pairs.map((p) => (p.id === updated.id ? updated : p)),
      }));
      showToast({ type: "success", title: "Zapisano", message: "Para zaktualizowana" });
    } catch (e: any) {
      showToast({ type: "error", title: "Błąd", message: e.data?.error || "Nie udało się zapisać" });
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6 py-10">
      <BoardTitleInput value={vm.title} onSave={handleTitleSave} />
      <PairEditList pairs={vm.pairs} cardCount={board.cardCount} onSave={handlePairSave} />
      <div className="flex justify-between pt-10">
        <Button variant="secondary" onClick={() => history.back()}>
          Powrót
        </Button>
        <Button disabled>Dodaj level</Button>
      </div>
    </div>
  );
};

export default EditBoardForm;
