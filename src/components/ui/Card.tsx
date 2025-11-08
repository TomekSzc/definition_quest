import { cn } from "@/lib/utils";
import type { CardStatus } from "@/lib/hooks/useBoardGame";

interface CardProps {
  text: string;
  status: CardStatus;
  onClick(): void;
}

export default function Card({ text, status, onClick }: CardProps) {
  const base = "cursor-pointer mx-2 bg-white text-black w-[150px] h-[100px] flex items-center justify-center rounded-md text-center p-2 text-sm font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";

  const statusClasses: Record<CardStatus, string> = {
    idle: "border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700",
    selected: "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20",
    success: "border-2 border-green-500 bg-green-50 dark:bg-green-900/20",
    failure: "border-2 border-red-500 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, statusClasses[status])}
      aria-pressed={status === "selected"}
    >
      {text}
    </button>
  );
}
