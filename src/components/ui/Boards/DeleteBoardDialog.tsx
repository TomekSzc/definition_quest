import { useState } from "react";
import type { FC } from "react";
import { useSelector } from "react-redux";
import { Dialog, DialogContent, DialogTitle } from "../Dialog";
import { Button } from "../Button";
import { selectAccessToken } from "../../../store/slices/authSlice";

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
  const [loading, setLoading] = useState(false);
  const accessToken = useSelector(selectAccessToken);

  const archiveBoard = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add Authorization header if token is available
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error("Failed to archive board", await res.text());
        return;
      }
      onSubmit();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Unexpected error while archiving board", e);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="text-black">
        <DialogTitle>Na pewno usunąć tablicę?</DialogTitle>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" className="cursor-pointer" disabled={loading} onClick={onClose}>
            Anuluj
          </Button>
          <Button variant="destructive" className="text-white cursor-pointer" disabled={loading} onClick={archiveBoard}>
            {loading ? "Usuwanie…" : "OK"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
