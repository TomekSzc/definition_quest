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
  // sidebar widths: collapsed w-16 (4rem) vs expanded w-64 (16rem)
  const leftPadding = collapsed ? "pl-20" : "pl-72"; // +4rem for safety (header internal px-6)

  return (
    <header
      className={clsx(
        "w-screen h-[80px] flex items-center px-6 shadow-md bg-[var(--color-primary)] transition-all duration-200",
        leftPadding,
        className
      )}
    >
      <h1 className="text-2xl font-bold">Public Boards</h1>
    </header>
  );
};
