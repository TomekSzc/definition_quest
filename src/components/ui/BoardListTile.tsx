import type { FC } from "react";
import type { BoardSummaryDTO } from "@/types";
import { EditIcon, DeleteIcon } from "@/assets/icons";
import { useAppSelector } from "@/store/hooks";
import Chip from "./Chip";
import type { RootState } from "@/store";
import { useState } from "react";
import { DeleteBoardDialog } from "./DeleteBoardDialog";

interface IBoardListTileProps {
  board: BoardSummaryDTO;
}

export const BoardListTile: FC<IBoardListTileProps> = ({ board }) => {
  const href = `/boards/${board.id}`;
  const authUserId = useAppSelector((s: RootState) => s.auth.user?.id);
  const canManage = authUserId && authUserId === board.ownerId;
  const [showDelete, setShowDelete] = useState(false);
  return (
    <a
      href={href}
      className="
    h-[60px]
    text-[var(--color-primary)]
    border border-[var(--color-primary)]
    rounded-[5px]
    flex items-center
    p-2 mb-3
    bg-white hover:bg-[var(--color-primary)]/10
    font-bold capitalize
    cursor-pointer w-full justify-between flex transition-colors"
    >
      <div className="flex items-center">
        <div
          className="
            w-[40px] 
            h-[40px] 
            rounded-[20px] 
            border-2 border-blue-500 
            bg-white 
            text-[var(--color-primary)]
            flex 
            justify-center 
            items-center 
            relative
            mr-2"
        >
          {board.title.slice(0, 1)}
        </div>
        <div className="flex flex-col">
          <div className="relative">{board.title}</div>
          <div className="text-sm text-gray-500 mb-1 flex gap-4">
            <span>Level: {board.level}</span>
            <div>
              <div className="flex flex-wrap gap-1">
                <div className="block md:hidden">
                  {board.tags && board.tags.slice(0, 1).map((t) => <Chip key={t}>{t}</Chip>)}
                  {board.tags && board.tags.length > 1 && <Chip>…</Chip>}
                </div>
                <div className="hidden md:block">
                  {board.tags && board.tags.slice(0, 2).map((t) => <Chip key={t}>{t}</Chip>)}
                  {board.tags && board.tags.length > 2 && <Chip>…</Chip>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {canManage && (
        <div className="flex items-center gap-2">
          {board?.lastTime && (
            <div className="text-sm text-gray-500 flex flex-col lowercase">
              <span>Last score</span>
              <span>{board.lastTime}ms</span>
            </div>
          )}
          <EditIcon
            className="w-[30px] h-[30px] cursor-pointer text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white rounded p-1 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/boards/${board.id}/edit`;
            }}
          />
          <DeleteIcon
            className="w-[30px] h-[30px] cursor-pointer text-[var(--color-primary)] hover:bg-red-500 hover:text-white rounded p-1 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDelete(true);
            }}
          />
        </div>
      )}
      <DeleteBoardDialog
        boardId={board.id}
        isVisible={showDelete}
        onSubmit={() => window.location.reload()}
        onClose={() => setShowDelete(false)}
      />
    </a>
  );
};
