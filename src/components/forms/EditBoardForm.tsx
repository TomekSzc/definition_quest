import type { FC } from "react";
import { useState } from "react";
import type { BoardViewDTO, PatchBoardCmd, PairUpdateCmd, PairDTO } from "@/types";
import BoardTitleInput from "./parts/BoardTitleInput";
import PairEditList from "./parts/PairEditList";
import AddPairsForm from "./parts/AddPairsForm";
import { useUpdateBoardMetaMutation, useUpdatePairMutation } from "@/store/api/apiSlice";
import { useToast } from "@/store/hooks";
import { Button } from "@/components/ui/Button";

interface EditBoardVM {
  id: string;
  title: string;
  pairs: PairDTO[];
  tags: string[];
  isPublic: boolean;
  archived: boolean;
}

interface IEditBoardForm {
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

const EditBoardForm: FC<IEditBoardForm> = ({ board, onRefresh }) => {
  const [vm, setVm] = useState<EditBoardVM>(() => mapToVM(board));
  const [updateMeta] = useUpdateBoardMetaMutation();
  const [updatePair] = useUpdatePairMutation();
  const { showToast } = useToast();

  const handleTitleSave = async (title: string) => {
    if (title === vm.title) return;
    try {
      await updateMeta({ id: vm.id, payload: { title } as PatchBoardCmd }).unwrap();
      setVm((prev: EditBoardVM) => ({ ...prev, title }));
      showToast({ type: "success", title: "Zapisano", message: "Tytuł zaktualizowany" });
      onRefresh();
    } catch (e: unknown) {
      const apiError = (e as { data?: { error?: string } } | undefined)?.data?.error;
      showToast({ type: "error", title: "Błąd", message: apiError || "Nie udało się zapisać" });
    }
  };

  const handlePairSave = async (pairId: string, patch: PairUpdateCmd) => {
    try {
      const updated = await updatePair({ boardId: vm.id, pairId, payload: patch }).unwrap();
      setVm((prev: EditBoardVM) => ({
        ...prev,
        pairs: prev.pairs.map((p: PairDTO) => (p.id === updated.id ? updated : p)),
      }));
      showToast({ type: "success", title: "Zapisano", message: "Para zaktualizowana" });
    } catch (e: unknown) {
      const apiError = (e as { data?: { error?: string } } | undefined)?.data?.error;
      showToast({ type: "error", title: "Błąd", message: apiError || "Nie udało się zapisać" });
    }
  };

  return (
    <div className="w-full max-w-3xl space-y-6 py-10">
      <BoardTitleInput value={vm.title} onSave={handleTitleSave} />
      <PairEditList
        boardId={vm.id}
        pairs={vm.pairs}
        cardCount={board.cardCount}
        onSave={handlePairSave}
        onDelete={(pairId: string) => {
          setVm((prev) => ({ ...prev, pairs: prev.pairs.filter((p) => p.id !== pairId) }));
        }}
      />

      {/* Add new pairs */}
      <AddPairsForm
        boardId={vm.id}
        existingCount={vm.pairs.length}
        cardCount={board.cardCount}
        onPairAdded={(newPair) => setVm((prev) => ({ ...prev, pairs: [...prev.pairs, newPair] }))}
      />
      <div className="flex justify-between pt-10">
        <Button
          onClick={() => history.back()}
          className="cursor-pointer bg-[var(--color-primary)] text-white font-bold hover:bg-white hover:text-[var(--color-primary)] border-2 border-[var(--color-primary)]"
        >
          Powrót
        </Button>
        <a href={`/boards/${vm.id}/add-level`} className="cursor-pointer">
          <Button className="cursor-pointer bg-[var(--color-primary)] text-white font-bold hover:bg-white hover:text-[var(--color-primary)] border-2 border-[var(--color-primary)]">
            Dodaj level
          </Button>
        </a>
      </div>
    </div>
  );
};

export default EditBoardForm;
