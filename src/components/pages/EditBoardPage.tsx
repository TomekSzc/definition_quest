import type { FC } from "react";
import { withProviders } from "@/components/HOC/Providers";
import LoaderOverlay from "@/components/ui/LoaderOverlay";
import { useBoard } from "@/hooks/useBoard";
import EditBoardForm from "@/components/forms/EditBoardForm";
import { showToast } from "@/store/slices/toastSlice";
import { useAppDispatch } from "@/store/hooks";

interface IEditBoardPageProps extends Record<string, unknown> {
  boardId: string;
}

const EditBoardPageComponent: FC<IEditBoardPageProps> = ({ boardId }) => {
  const dispatch = useAppDispatch();
  const { board, isLoading, isError, error, refresh } = useBoard(boardId);

  if (isError) {
    dispatch(
      showToast({
        type: "error",
        title: "Błąd",
        message: (error as any)?.data?.error || "Nie udało się pobrać tablicy",
      })
    );
  }

  return (
    <div className="flex justify-center p-4 bg-secondary min-h-[85vh] md:pl-[80px] relative text-black">
      {isLoading && <LoaderOverlay />}
      {board && <EditBoardForm board={board} onRefresh={refresh} />}
    </div>
  );
};

export const EditBoardPage = withProviders<IEditBoardPageProps>(EditBoardPageComponent);

export default EditBoardPage;
