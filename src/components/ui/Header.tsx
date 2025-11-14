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

  const leftPadding = collapsed ? "pl-13" : "pl-72"; // +4rem for safety (header internal px-6)
  const breadCrumbsVisible = !collapsed ? "hidden md:block" : "block";
  return (
    <header
      className={clsx(
        "w-full z-[1] fixed top-0 h-[60px] flex items-center px-6 shadow-md bg-[var(--color-primary)] transition-all duration-200",
        leftPadding,
        className
      )}
    >
      {/* <button id="burger-menu-button" className="absolute left-5" onClick={toggle}>
        <MenuIcon className="h-5 w-5" />
      </button> */}
      <div className={breadCrumbsVisible}>
        <Breadcrumbs />
      </div>
    </header>
  );
};
