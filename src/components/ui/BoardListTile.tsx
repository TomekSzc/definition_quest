import type { FC } from "react";
import type { BoardSummaryDTO } from "@/types";
import { Icons } from "@/assets/icons";

interface IBoardListTileProps {
    board: BoardSummaryDTO;
}

export const BoardListTile: FC<IBoardListTileProps> = ({ board }) => {
    const href = `/boards/${board.id}`;
    return (
    <a href={href} className="
    h-[60px] 
    text-[var(--color-primary)] 
    border 
    border-[var(--color-primary)] 
    rounded-[5px] 
    flex items-center 
    p-2 mb-3 
    bg-white 
    font-bold
    capitalize
    cursor-pointer 
    w-full
    justify-between
    flex">
        <div className="flex">
            <div className="
            w-[40px] 
            h-[40px] 
            rounded-[20px] 
            border-2 border-blue-500 
            bg-white 
            text-[var(--color-primary)]
            flex 
            justify-center 
            items-center 
            mr-2" >
                {board.title.slice(0, 1)}        
            </div>
            <div className="flex flex-col">
                <div className="relative">
                    {board.title}
                </div>
                <div className="text-sm text-gray-500">Level: {board.level}</div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <img
                src={Icons.Edit}
                alt="Edytuj"
                className="cursor-pointer select-none w-[20px] h-[20px] relative z-10"
            />
            <img
                src={Icons.Delete}
                alt="Usuń"
                className="cursor-pointer select-none w-[20px] h-[20px] relative z-10"
            />
        </div>
    </a>)
}