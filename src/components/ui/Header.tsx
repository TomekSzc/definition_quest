import type { FC } from "react";
import clsx from "clsx";
import { useSidebar } from "@/hooks/useSidebar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MenuIcon } from "@/assets/icons";

interface HeaderProps {
  className?: string;
}

/**
 * Full-width application header (80 px height, bottom shadow).
 */
export const Header: FC<HeaderProps> = ({ className }) => {
  const { collapsed, toggle } = useSidebar();
  // Determine title based on current pathname

  const leftPadding = collapsed ? "pl-20" : "pl-72"; // +4rem for safety (header internal px-6)

  return (
    <header
      className={clsx(
        "w-full h-[60px] md:h-[80px] flex items-center px-6 shadow-md bg-[var(--color-primary)] transition-all duration-200",
        leftPadding,
        className
      )}
    >
      <button className="absolute left-5" onClick={toggle}>
        <MenuIcon className="h-5 w-5" />
      </button>
      <Breadcrumbs />
    </header>
  );
};
