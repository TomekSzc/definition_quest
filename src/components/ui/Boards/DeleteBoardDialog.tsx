import type { FC } from "react";
import { Dialog, DialogContent, DialogTitle } from "../Dialog";
import { Button } from "../Button";
import { useDeleteBoardMutation } from "../../../store/api/apiSlice";

interface DeleteBoardDialogProps {
  boardId: string;
  isVisible: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * Modal dialog used for soft-deleting (archiving) a board.
 * Performs the DELETE request internally and notifies the parent via `onSubmit`.
 */
export const DeleteBoardDialog: FC<DeleteBoardDialogProps> = ({ boardId, isVisible, onSubmit, onClose }) => {
  const [deleteBoard, { isLoading }] = useDeleteBoardMutation();

  const archiveBoard = async () => {
    if (isLoading) return;
    try {
      await deleteBoard(boardId).unwrap();
      onSubmit();
      onClose();
    } catch (error) {
      // Error is handled by RTK Query onQueryStarted in apiSlice
      // eslint-disable-next-line no-console
      console.error("Unexpected error while archiving board", error);
      onClose();
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="text-black">
        <DialogTitle>Na pewno usunąć tablicę?</DialogTitle>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" className="cursor-pointer" disabled={isLoading} onClick={onClose}>
            Anuluj
          </Button>
          <Button
            variant="destructive"
            className="text-white cursor-pointer"
            disabled={isLoading}
            onClick={archiveBoard}
          >
            {isLoading ? "Usuwanie…" : "OK"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
