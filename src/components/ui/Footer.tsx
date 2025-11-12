import type { FC } from "react";
import clsx from "clsx";
import { useSidebar } from "@/hooks/useSidebar";

interface FooterProps {
  className?: string;
}

/**
 * Full-width application footer (60 px height, top inner shadow).
 * Left padding adapts to sidebar width so the content aligns with the main view.
 */
export const Footer: FC<FooterProps> = ({ className }) => {
  const { collapsed } = useSidebar();
  // Sidebar widths: collapsed w-16 (4rem) vs expanded w-64 (16rem)
  const leftPadding = collapsed ? "pl-20" : "pl-72"; // +4rem for safety (footer internal px-6)

  return (
    <footer
      className={clsx(
        "w-full h-[60px] justify-center flex items-center px-6 shadow-inner bg-[var(--color-primary)] text-sm transition-all duration-200",
        leftPadding,
        className
      )}
    >
      <p className="text-gray-100">Definition Quest 2025</p>
    </footer>
  );
};
