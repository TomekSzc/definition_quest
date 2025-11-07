import type { FC, ReactNode } from "react";
import clsx from "clsx";
import { useSidebar } from "@/hooks/useSidebar";

interface HeaderProps {
  className?: string;
}

/**
 * Full-width application header (80 px height, bottom shadow).
 */
export const Header: FC<HeaderProps> = ({ className }) => {
  const { collapsed } = useSidebar();
  // Determine title based on current pathname
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const routeTitles: Record<string, string> = {
    "/boards": "Public Boards",
    "/my-boards": "My Boards",
    "/played-boards": "Played Boards",
    "/create-board": "Create Board",
  };
  const title = routeTitles[pathname] ?? "Public Boards";
  // sidebar widths: collapsed w-16 (4rem) vs expanded w-64 (16rem)
  const leftPadding = collapsed ? "pl-20" : "pl-72"; // +4rem for safety (header internal px-6)

  return (
    <header
      className={clsx(
        "w-full h-[80px] flex items-center px-6 shadow-md bg-[var(--color-primary)] transition-all duration-200",
        leftPadding,
        className
      )}
    >
      <h1 className="text-2xl font-bold">{title}</h1>
    </header>
  );
};
