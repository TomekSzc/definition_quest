import type { FC } from "react";
import { cn } from "@/lib/utils";
import type { CardStatus } from "@/hooks/useBoardGame";

interface ICardProps {
  text: string;
  status: CardStatus;
  disabled?: boolean;
  onClick(): void;
}

export const Card: FC<ICardProps> = ({ text, status, disabled, onClick }) => {
  const base = "mb-6 cursor-pointer mx-2 bg-white text-black w-[250px] h-[200px] flex items-center justify-center rounded-md text-center p-2 text-sm font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";

  const statusClasses: Record<CardStatus, string> = {
    idle: "border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700",
    selected: "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20",
    success: "border-2 border-green-500 bg-green-50 dark:bg-green-900/20",
    failure: "border-2 border-red-500 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      className={cn(base, statusClasses[status], disabled && "cursor-not-allowed opacity-50")}
      aria-pressed={status === "selected"}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default Card;